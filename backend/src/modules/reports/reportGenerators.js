const prisma = require("../../core/config/prisma");
const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
const {
  buildDateRangeFromQuery,
  buildPaymentSummary,
  buildTransactionWhere,
  buildUserDisplayName,
  formatDayKey,
  getSelectedBranchId,
  resolveBranchFilter,
  sumTransactions,
  toDecimalNumber,
  toNumber,
} = require("./reportHelpers");

const REPORT_KEYS = [
  "daily-sales-recap",
  "branch-top-sales",
  "sales-by-branch",
  "sales-by-cashier",
  "sales-by-channel",
  "sales-by-platform",
  "transaction-detail",
  "void-transactions",
  "menu-performance",
  "category-performance",
  "payment-recap",
  "cash-vs-noncash",
  "cash-sessions",
  "opening-cash",
  "closing-cash",
  "expected-cash",
  "inventory-stock",
  "stock-opname-opening",
  "stock-opname-closing",
  "stock-opname-variance",
  "inventory-movement",
  "branch-product-coverage",
  "crew-attendance",
  "crew-monthly-performance",
  "outlet-expense",
  "audit-log",
  "accounts-payable-aging",
  "cash-reconciliation",
];

function baseFilters(branchId, dateRange, query = {}) {
  return {
    branchId,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    salesChannel: String(query.salesChannel || "ALL").toUpperCase(),
    paymentMethod: String(query.paymentMethod || "ALL").toUpperCase(),
    cashierId: query.cashierId || "ALL",
  };
}

async function fetchCompletedTransactions(branchId, dateRange, query = {}) {
  const paymentMethod = String(query.paymentMethod || "ALL").toUpperCase();
  const cashierId = query.cashierId || "ALL";
  const salesChannel = String(query.salesChannel || "ALL").toUpperCase();

  return prisma.transaction.findMany({
    where: {
      ...buildTransactionWhere(branchId, dateRange, {
        status: "COMPLETED",
        ...(paymentMethod !== "ALL" ? { paymentMethod } : {}),
        ...(cashierId !== "ALL" ? { cashierId } : {}),
        ...(salesChannel !== "ALL" ? { salesChannel } : {}),
      }),
    },
    include: {
      branch: true,
      cashier: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function generateDailySalesRecap(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const dayMap = new Map();

  for (const trx of transactions) {
    const dayKey = formatDayKey(trx.createdAt);
    const bucket = dayMap.get(dayKey) || {
      day: dayKey,
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
    };
    bucket.totalTransactions += 1;
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    dayMap.set(dayKey, bucket);
  }

  const rows = Array.from(dayMap.values()).sort((a, b) => b.day.localeCompare(a.day));
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalDays: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
      averageDailySales: rows.length ? Math.round(totals.totalSales / rows.length) : 0,
    },
    rows,
  };
}

async function generateBranchSalesReport(user, branchContext, query, { ranked = false } = {}) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const branchMap = new Map();

  for (const trx of transactions) {
    const key = trx.branchId;
    const bucket = branchMap.get(key) || {
      branchId: trx.branchId,
      branchName: trx.branch?.name || "-",
      branchCode: trx.branch?.code || "-",
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
      cashTotal: 0,
      qrisTotal: 0,
      onlineTotal: 0,
    };
    bucket.totalTransactions += 1;
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    if (trx.paymentMethod === "CASH") bucket.cashTotal += toNumber(trx.totalAmount);
    if (trx.paymentMethod === "QRIS") bucket.qrisTotal += toNumber(trx.totalAmount);
    if (["GOFOOD", "GRABFOOD", "SHOPEEFOOD"].includes(trx.paymentMethod)) {
      bucket.onlineTotal += toNumber(trx.totalAmount);
    }
    branchMap.set(key, bucket);
  }

  let rows = Array.from(branchMap.values());
  rows.sort((a, b) => b.totalSales - a.totalSales);
  if (ranked) {
    rows = rows.map((row, index) => ({ rank: index + 1, ...row }));
  }

  const totals = sumTransactions(transactions);
  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      branchCount: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
      topBranch: rows[0]?.branchName || "-",
    },
    rows,
  };
}

async function generateSalesByCashier(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const cashierMap = new Map();

  for (const trx of transactions) {
    const key = trx.cashierId || "unknown";
    const bucket = cashierMap.get(key) || {
      cashierId: trx.cashierId,
      cashierName: buildUserDisplayName(trx.cashier),
      cashierUsername: trx.cashier?.username || trx.cashierUsernameSnapshot || "-",
      branchName: trx.branch?.name || "-",
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
    };
    bucket.totalTransactions += 1;
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    cashierMap.set(key, bucket);
  }

  const rows = Array.from(cashierMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      cashierCount: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
    },
    rows,
  };
}

async function generateSalesByChannel(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const channelMap = new Map();

  for (const trx of transactions) {
    const key = trx.salesChannel || "UNKNOWN";
    const bucket = channelMap.get(key) || {
      salesChannel: key,
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
    };
    bucket.totalTransactions += 1;
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    channelMap.set(key, bucket);
  }

  const rows = Array.from(channelMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      channelCount: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      offlineTotal: rows.find((row) => row.salesChannel === "OFFLINE")?.totalSales || 0,
      onlineTotal: rows.find((row) => row.salesChannel === "ONLINE")?.totalSales || 0,
    },
    rows,
  };
}

async function generateSalesByPlatform(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const platformMap = new Map();

  for (const trx of transactions) {
    const key = trx.onlinePlatform || trx.paymentMethod || "OFFLINE";
    const bucket = platformMap.get(key) || {
      platform: key,
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
    };
    bucket.totalTransactions += 1;
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    platformMap.set(key, bucket);
  }

  const rows = Array.from(platformMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      platformCount: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
    },
    rows,
  };
}

async function generateTransactionDetail(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const rows = transactions.map((trx) => ({
    id: trx.id,
    invoiceNumber: trx.invoiceNumber,
    createdAt: trx.createdAt,
    branchName: trx.branch?.name || "-",
    branchCode: trx.branch?.code || "-",
    cashierName: buildUserDisplayName(trx.cashier),
    salesChannel: trx.salesChannel,
    paymentMethod: trx.paymentMethod,
    itemCount: trx.items?.length || 0,
    totalPcs: toNumber(trx.totalPcs),
    totalAmount: toNumber(trx.totalAmount),
    itemSummary: (trx.items || []).map((item) => `${item.productName} x${item.qty}`).join(", "),
  }));
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
      averageTicket: transactions.length ? Math.round(totals.totalSales / transactions.length) : 0,
    },
    rows,
  };
}

async function generateVoidTransactions(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await prisma.transaction.findMany({
    where: buildTransactionWhere(branchId, dateRange, { status: "VOID" }),
    include: { branch: true, cashier: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = transactions.map((trx) => ({
    id: trx.id,
    invoiceNumber: trx.invoiceNumber,
    createdAt: trx.createdAt,
    branchName: trx.branch?.name || "-",
    cashierName: buildUserDisplayName(trx.cashier),
    paymentMethod: trx.paymentMethod,
    totalAmount: toNumber(trx.totalAmount),
    voidReason: trx.voidReason || "-",
    voidedAt: trx.voidedAt,
  }));

  const totalVoidAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalVoidTransactions: rows.length,
      totalVoidAmount,
    },
    rows,
  };
}

async function generateMenuPerformance(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const productMap = new Map();

  for (const trx of transactions) {
    for (const item of trx.items || []) {
      const key = item.productId || item.productName;
      const bucket = productMap.get(key) || {
        productId: item.productId,
        productName: item.productName,
        categoryName: item.product?.category?.name || "-",
        totalQty: 0,
        totalSales: 0,
      };
      bucket.totalQty += toNumber(item.qty);
      bucket.totalSales += toNumber(item.subtotal);
      productMap.set(key, bucket);
    }
  }

  const rows = Array.from(productMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  const totalSales = rows.reduce((sum, row) => sum + row.totalSales, 0);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      productCount: rows.length,
      totalQty: rows.reduce((sum, row) => sum + row.totalQty, 0),
      totalSales,
      topProduct: rows[0]?.productName || "-",
    },
    rows,
  };
}

async function generateCategoryPerformance(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const categoryMap = new Map();

  for (const trx of transactions) {
    for (const item of trx.items || []) {
      const key = item.product?.category?.name || "Uncategorized";
      const bucket = categoryMap.get(key) || {
        categoryName: key,
        totalQty: 0,
        totalSales: 0,
        productCount: new Set(),
      };
      bucket.totalQty += toNumber(item.qty);
      bucket.totalSales += toNumber(item.subtotal);
      bucket.productCount.add(item.productId || item.productName);
      categoryMap.set(key, bucket);
    }
  }

  const rows = Array.from(categoryMap.values())
    .map((row) => ({
      categoryName: row.categoryName,
      totalQty: row.totalQty,
      totalSales: row.totalSales,
      productCount: row.productCount.size,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      categoryCount: rows.length,
      totalSales: rows.reduce((sum, row) => sum + row.totalSales, 0),
      topCategory: rows[0]?.categoryName || "-",
    },
    rows,
  };
}

async function generatePaymentRecap(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  const paymentBreakdown = buildPaymentSummary(transactions);
  const rows = Object.entries(paymentBreakdown)
    .map(([paymentMethod, totalSales]) => ({
      paymentMethod,
      totalTransactions: transactions.filter((trx) => trx.paymentMethod === paymentMethod).length,
      totalSales,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
  const totals = sumTransactions(transactions);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      methodCount: rows.length,
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      cashTotal: paymentBreakdown.CASH || 0,
      qrisTotal: paymentBreakdown.QRIS || 0,
    },
    rows,
  };
}

async function generateCashVsNonCash(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const transactions = await fetchCompletedTransactions(branchId, dateRange, query);
  let cashTotal = 0;
  let nonCashTotal = 0;
  let cashCount = 0;
  let nonCashCount = 0;

  for (const trx of transactions) {
    const amount = toNumber(trx.totalAmount);
    if (trx.paymentMethod === "CASH") {
      cashTotal += amount;
      cashCount += 1;
    } else {
      nonCashTotal += amount;
      nonCashCount += 1;
    }
  }

  const rows = [
    { type: "CASH", totalTransactions: cashCount, totalSales: cashTotal },
    { type: "NON_CASH", totalTransactions: nonCashCount, totalSales: nonCashTotal },
  ];

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalTransactions: transactions.length,
      cashTotal,
      nonCashTotal,
      cashSharePercent: transactions.length ? Math.round((cashCount / transactions.length) * 1000) / 10 : 0,
    },
    rows,
  };
}

async function generateCashSessions(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const sessions = await prisma.cashSession.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      openedAt: { gte: dateRange.start, lte: dateRange.end },
    },
    include: { branch: true, user: true, outletExpenses: true },
    orderBy: { openedAt: "desc" },
  });

  const rows = await Promise.all(
    sessions.map(async (session) => {
      const cashSales = await prisma.transaction.aggregate({
        where: {
          cashSessionId: session.id,
          status: "COMPLETED",
          paymentMethod: "CASH",
        },
        _sum: { totalAmount: true },
      });
      const cashSalesTotal = toNumber(cashSales._sum.totalAmount);
      const expenseTotal = (session.outletExpenses || [])
        .filter((expense) => expense.status === "POSTED")
        .reduce((sum, expense) => sum + toNumber(expense.totalAmount), 0);
      const withdrawalTotal = await getCompletedWithdrawalTotalBySession(session.id);
      const expectedCash =
        session.status === "CLOSED"
          ? toNumber(session.expectedCash ?? session.closingCash)
          : toNumber(session.openingCash) + cashSalesTotal - expenseTotal - withdrawalTotal;

      return {
        id: session.id,
        branchName: session.branch?.name || "-",
        cashierName: buildUserDisplayName(session.user),
        status: session.status,
        openingCash: toNumber(session.openingCash),
        closingCash: toNumber(session.closingCash),
        expectedCash,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        expenseTotal,
        withdrawalTotal,
      };
    })
  );

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalSessions: rows.length,
      openSessions: rows.filter((row) => row.status === "OPEN").length,
      closedSessions: rows.filter((row) => row.status === "CLOSED").length,
      totalOpeningCash: rows.reduce((sum, row) => sum + row.openingCash, 0),
    },
    rows,
  };
}

async function generateOpeningCash(user, branchContext, query) {
  const report = await generateCashSessions(user, branchContext, query);
  return {
    ...report,
    rows: report.rows.map((row) => ({
      branchName: row.branchName,
      cashierName: row.cashierName,
      openingCash: row.openingCash,
      openedAt: row.openedAt,
      status: row.status,
    })),
    summary: {
      totalSessions: report.summary.totalSessions,
      totalOpeningCash: report.summary.totalOpeningCash,
      averageOpeningCash: report.summary.totalSessions
        ? Math.round(report.summary.totalOpeningCash / report.summary.totalSessions)
        : 0,
    },
  };
}

async function generateClosingCash(user, branchContext, query) {
  const report = await generateCashSessions(user, branchContext, query);
  const closedRows = report.rows.filter((row) => row.status === "CLOSED");
  return {
    ...report,
    rows: closedRows.map((row) => ({
      branchName: row.branchName,
      cashierName: row.cashierName,
      closingCash: row.closingCash,
      expectedCash: row.expectedCash,
      closedAt: row.closedAt,
      variance: row.closingCash - row.expectedCash,
    })),
    summary: {
      closedSessions: closedRows.length,
      totalClosingCash: closedRows.reduce((sum, row) => sum + row.closingCash, 0),
      totalExpectedCash: closedRows.reduce((sum, row) => sum + row.expectedCash, 0),
    },
  };
}

async function generateExpectedCash(user, branchContext, query) {
  const report = await generateCashSessions(user, branchContext, query);
  return {
    ...report,
    rows: report.rows.map((row) => ({
      branchName: row.branchName,
      cashierName: row.cashierName,
      status: row.status,
      openingCash: row.openingCash,
      expectedCash: row.expectedCash,
      closingCash: row.closingCash,
      variance: row.closingCash - row.expectedCash,
      expenseTotal: row.expenseTotal,
      withdrawalTotal: row.withdrawalTotal,
    })),
    summary: {
      totalSessions: report.summary.totalSessions,
      totalExpectedCash: report.rows.reduce((sum, row) => sum + row.expectedCash, 0),
      totalVariance: report.rows.reduce((sum, row) => sum + (row.closingCash - row.expectedCash), 0),
    },
  };
}

async function generateInventoryStock(user, branchContext, query) {
  const { branchId, branches, selectedBranch } = await resolveBranchFilter(user, branchContext, query);
  const stocks = await prisma.branchInventoryItem.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      isActive: true,
    },
    include: {
      branch: true,
      inventoryItem: true,
    },
    orderBy: [{ branch: { name: "asc" } }, { inventoryItem: { name: "asc" } }],
  });

  const rows = stocks.map((stock) => ({
    branchName: stock.branch?.name || "-",
    itemName: stock.inventoryItem?.name || "-",
    itemType: stock.inventoryItem?.type || "-",
    unit: stock.inventoryItem?.unit || "-",
    currentStock: toDecimalNumber(stock.currentStock),
    minStock: toDecimalNumber(stock.minStock),
    maxStock: toDecimalNumber(stock.maxStock),
    isOpnameRequired: stock.isOpnameRequired ? "Yes" : "No",
    lastOpnameAt: stock.lastOpnameAt,
  }));

  return {
    filters: baseFilters(branchId, buildDateRangeFromQuery(query), query),
    selectedBranch,
    branches,
    summary: {
      itemCount: rows.length,
      lowStockCount: rows.filter((row) => row.minStock > 0 && row.currentStock <= row.minStock).length,
      opnameRequiredCount: rows.filter((row) => row.isOpnameRequired === "Yes").length,
    },
    rows,
  };
}

async function generateStockOpname(user, branchContext, query, kind) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const opnames = await prisma.stockOpname.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      kind,
      opnameDate: { gte: dateRange.start, lte: dateRange.end },
    },
    include: {
      branch: true,
      performedBy: true,
      items: true,
    },
    orderBy: { opnameDate: "desc" },
  });

  const rows = opnames.map((opname) => ({
    id: opname.id,
    branchName: opname.branch?.name || "-",
    performedBy: buildUserDisplayName(opname.performedBy),
    opnameDate: opname.opnameDate,
    kind: opname.kind,
    itemCount: opname.items.length,
    isCompleted: opname.isCompleted ? "Completed" : "Draft",
    totalVariance: opname.items.reduce((sum, item) => sum + Math.abs(toDecimalNumber(item.varianceQty)), 0),
    notes: opname.notes || "-",
    oilLitersOpened: opname.oilLitersOpened ? toDecimalNumber(opname.oilLitersOpened) : null,
    gasChanged: opname.gasChanged,
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      opnameCount: rows.length,
      completedCount: rows.filter((row) => row.isCompleted === "Completed").length,
      totalVariance: rows.reduce((sum, row) => sum + row.totalVariance, 0),
    },
    rows,
  };
}

async function generateStockOpnameVariance(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const items = await prisma.stockOpnameItem.findMany({
    where: {
      stockOpname: {
        ...(branchId ? { branchId } : {}),
        opnameDate: { gte: dateRange.start, lte: dateRange.end },
      },
    },
    include: {
      inventoryItem: true,
      stockOpname: {
        include: { branch: true, performedBy: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = items.map((item) => ({
    branchName: item.stockOpname?.branch?.name || "-",
    opnameDate: item.stockOpname?.opnameDate,
    kind: item.stockOpname?.kind,
    itemName: item.inventoryItem?.name || "-",
    systemQty: toDecimalNumber(item.systemQty),
    countedQty: toDecimalNumber(item.countedQty),
    varianceQty: toDecimalNumber(item.varianceQty),
    performedBy: buildUserDisplayName(item.stockOpname?.performedBy),
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      itemCount: rows.length,
      positiveVariance: rows.filter((row) => row.varianceQty > 0).length,
      negativeVariance: rows.filter((row) => row.varianceQty < 0).length,
      totalAbsVariance: rows.reduce((sum, row) => sum + Math.abs(row.varianceQty), 0),
    },
    rows,
  };
}

async function generateInventoryMovement(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    },
    include: {
      branch: true,
      warehouse: true,
      inventoryItem: true,
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = movements.map((movement) => ({
    createdAt: movement.createdAt,
    location: movement.warehouse?.name || movement.branch?.name || "-",
    itemName: movement.inventoryItem?.name || "-",
    type: movement.type,
    quantity: toDecimalNumber(movement.quantity),
    performedBy: buildUserDisplayName(movement.performedBy),
    referenceType: movement.referenceType || "-",
    notes: movement.notes || "-",
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      movementCount: rows.length,
      inboundQty: rows.filter((row) => row.quantity > 0).reduce((sum, row) => sum + row.quantity, 0),
      outboundQty: rows.filter((row) => row.quantity < 0).reduce((sum, row) => sum + Math.abs(row.quantity), 0),
    },
    rows,
  };
}

async function generateBranchProductCoverage(user, branchContext, query) {
  const { branchId, branches, selectedBranch } = await resolveBranchFilter(user, branchContext, query);
  const branchProducts = await prisma.branchProduct.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: true,
      product: {
        include: { category: true },
      },
    },
    orderBy: [{ branch: { name: "asc" } }, { product: { name: "asc" } }],
  });

  const rows = branchProducts.map((item) => ({
    branchName: item.branch?.name || "-",
    productName: item.product?.name || "-",
    categoryName: item.product?.category?.name || "-",
    price: toNumber(item.price),
    pcs: toNumber(item.pcs),
    isAvailable: item.isAvailable ? "Available" : "Unavailable",
    isActive: item.isActive ? "Active" : "Inactive",
  }));

  return {
    filters: baseFilters(branchId, buildDateRangeFromQuery(query), query),
    selectedBranch,
    branches,
    summary: {
      coverageCount: rows.length,
      availableCount: rows.filter((row) => row.isAvailable === "Available").length,
      activeCount: rows.filter((row) => row.isActive === "Active").length,
    },
    rows,
  };
}

async function generateCrewAttendance(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const attendances = await prisma.crewAttendance.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      attendanceDate: { gte: dateRange.start, lte: dateRange.end },
    },
    include: { branch: true, user: true },
    orderBy: [{ attendanceDate: "desc" }, { checkInAt: "desc" }],
  });

  const rows = attendances.map((item) => ({
    attendanceDate: item.attendanceDate,
    branchName: item.branch?.name || "-",
    crewName: buildUserDisplayName(item.user),
    status: item.status,
    checkInAt: item.checkInAt,
    checkOutAt: item.checkOutAt,
    notes: item.notes || "-",
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      totalRecords: rows.length,
      presentCount: rows.filter((row) => row.checkInAt).length,
      checkoutCount: rows.filter((row) => row.checkOutAt).length,
      branchCount: new Set(rows.map((row) => row.branchName)).size,
    },
    rows,
  };
}

async function generateCrewMonthlyPerformance(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const [transactions, attendances, crewUsers] = await Promise.all([
    fetchCompletedTransactions(branchId, dateRange, query),
    prisma.crewAttendance.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        attendanceDate: { gte: dateRange.start, lte: dateRange.end },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "CREW",
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
    }),
  ]);

  const salesMap = new Map();
  for (const trx of transactions) {
    if (!trx.cashierId) continue;
    const bucket = salesMap.get(trx.cashierId) || { totalSales: 0, totalPcs: 0, totalTransactions: 0 };
    bucket.totalSales += toNumber(trx.totalAmount);
    bucket.totalPcs += toNumber(trx.totalPcs);
    bucket.totalTransactions += 1;
    salesMap.set(trx.cashierId, bucket);
  }

  const attendanceMap = new Map();
  for (const item of attendances) {
    attendanceMap.set(item.userId, (attendanceMap.get(item.userId) || 0) + 1);
  }

  const rows = crewUsers
    .map((user) => {
      const sales = salesMap.get(user.id) || { totalSales: 0, totalPcs: 0, totalTransactions: 0 };
      return {
        crewName: buildUserDisplayName(user),
        branchName: user.branchId ? branches.find((branch) => branch.id === user.branchId)?.name || "-" : "-",
        attendanceCount: attendanceMap.get(user.id) || 0,
        totalTransactions: sales.totalTransactions,
        totalSales: sales.totalSales,
        totalPcs: sales.totalPcs,
        averageTicket: sales.totalTransactions ? Math.round(sales.totalSales / sales.totalTransactions) : 0,
      };
    })
    .filter((row) => row.attendanceCount || row.totalTransactions)
    .sort((a, b) => b.totalSales - a.totalSales);

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      crewCount: rows.length,
      totalSales: rows.reduce((sum, row) => sum + row.totalSales, 0),
      totalAttendance: rows.reduce((sum, row) => sum + row.attendanceCount, 0),
      topPerformer: rows[0]?.crewName || "-",
    },
    rows,
  };
}

async function generateOutletExpense(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const expenses = await prisma.outletExpense.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      expenseDate: { gte: dateRange.start, lte: dateRange.end },
    },
    include: {
      branch: true,
      createdBy: true,
      items: true,
    },
    orderBy: { expenseDate: "desc" },
  });

  const rows = expenses.map((expense) => ({
    expenseDate: expense.expenseDate,
    branchName: expense.branch?.name || "-",
    createdBy: buildUserDisplayName(expense.createdBy),
    status: expense.status,
    totalAmount: toNumber(expense.totalAmount),
    itemCount: expense.items.length,
    note: expense.note || "-",
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      expenseCount: rows.length,
      postedAmount: rows.filter((row) => row.status === "POSTED").reduce((sum, row) => sum + row.totalAmount, 0),
      requestedAmount: rows.filter((row) => row.status === "REQUESTED").reduce((sum, row) => sum + row.totalAmount, 0),
    },
    rows,
  };
}

async function generateAuditLog(user, branchContext, query) {
  const { branchId, branches, selectedBranch, dateRange } = await resolveBranchFilter(user, branchContext, query);
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    },
    include: {
      branch: true,
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows = logs.map((log) => ({
    createdAt: log.createdAt,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId || "-",
    description: log.description || "-",
    branchName: log.branch?.name || "-",
    performedBy: buildUserDisplayName(log.performedBy),
  }));

  return {
    filters: baseFilters(branchId, dateRange, query),
    selectedBranch,
    branches,
    summary: {
      logCount: rows.length,
      actionCount: new Set(rows.map((row) => row.action)).size,
      entityCount: new Set(rows.map((row) => row.entity)).size,
    },
    rows,
  };
}

const REPORT_GENERATORS = {
  "daily-sales-recap": generateDailySalesRecap,
  "branch-top-sales": (user, branchContext, query) =>
    generateBranchSalesReport(user, branchContext, query, { ranked: true }),
  "sales-by-branch": (user, branchContext, query) => generateBranchSalesReport(user, branchContext, query),
  "sales-by-cashier": generateSalesByCashier,
  "sales-by-channel": generateSalesByChannel,
  "sales-by-platform": generateSalesByPlatform,
  "transaction-detail": generateTransactionDetail,
  "void-transactions": generateVoidTransactions,
  "menu-performance": generateMenuPerformance,
  "category-performance": generateCategoryPerformance,
  "payment-recap": generatePaymentRecap,
  "cash-vs-noncash": generateCashVsNonCash,
  "cash-sessions": generateCashSessions,
  "opening-cash": generateOpeningCash,
  "closing-cash": generateClosingCash,
  "expected-cash": generateExpectedCash,
  "inventory-stock": generateInventoryStock,
  "stock-opname-opening": (user, branchContext, query) => generateStockOpname(user, branchContext, query, "OPENING"),
  "stock-opname-closing": (user, branchContext, query) => generateStockOpname(user, branchContext, query, "CLOSING"),
  "stock-opname-variance": generateStockOpnameVariance,
  "inventory-movement": generateInventoryMovement,
  "branch-product-coverage": generateBranchProductCoverage,
  "crew-attendance": generateCrewAttendance,
  "crew-monthly-performance": generateCrewMonthlyPerformance,
  "outlet-expense": generateOutletExpense,
  "audit-log": generateAuditLog,
  "accounts-payable-aging": generateAccountsPayableAging,
  "cash-reconciliation": generateCashReconciliation,
};

async function generateCashReconciliation(user, branchContext, query = {}) {
  const branchId = branchContext?.branchId || user?.branchId || null;
  const { buildDateRangeFromQuery } = require("./reportHelpers");
  const { start, end } = buildDateRangeFromQuery(query);

  const sessionWhere = {
    ...(branchId ? { branchId } : {}),
    createdAt: { gte: start, lte: end },
  };

  const sessions = await prisma.cashSession.findMany({
    where: sessionWhere,
    include: {
      branch: true,
      user: true,
      withdrawals: { where: { status: "COMPLETED" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = await Promise.all(sessions.map(async (s) => {
    const cashSales = await prisma.transaction.aggregate({
      where: { cashSessionId: s.id, paymentMethod: "CASH", status: "COMPLETED" },
      _sum: { totalAmount: true },
    });
    const expenses = await prisma.outletExpense.aggregate({
      where: { cashSessionId: s.id, status: "POSTED" },
      _sum: { totalAmount: true },
    });
    const withdrawals = s.withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const totalCashSales = Number(cashSales._sum.totalAmount || 0);
    const totalExpenses = Number(expenses._sum.totalAmount || 0);
    const expectedCash = Number(s.openingCash) + totalCashSales - totalExpenses - withdrawals;
    const actualClosingCash = s.status === "CLOSED" ? Number(s.closingCash || 0) : null;
    const variance = actualClosingCash !== null ? actualClosingCash - expectedCash : null;

    return {
      sessionId: s.id,
      branchName: s.branch?.name || "-",
      cashierName: s.user?.name || "-",
      openedAt: s.openedAt?.toISOString(),
      closedAt: s.closedAt?.toISOString(),
      status: s.status,
      openingCash: Number(s.openingCash),
      cashSales: totalCashSales,
      expenses: totalExpenses,
      withdrawals,
      expectedCash,
      actualClosingCash,
      variance,
    };
  }));

  const summary = {
    totalSessions: sessions.length,
    totalOpeningCash: rows.reduce((s, r) => s + r.openingCash, 0),
    totalCashSales: rows.reduce((s, r) => s + r.cashSales, 0),
    totalExpenses: rows.reduce((s, r) => s + r.expenses, 0),
    totalWithdrawals: rows.reduce((s, r) => s + r.withdrawals, 0),
    totalExpectedCash: rows.reduce((s, r) => s + r.expectedCash, 0),
  };

  return { filters: { branchId, startDate: start.toISOString(), endDate: end.toISOString() }, summary, rows };
}

async function generateAccountsPayableAging(user, branchContext, query = {}) {
  const branchId = branchContext?.branchId || user?.branchId || null;

  const where = {
    status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    ...(branchId ? { branchId } : {}),
  };
  if (query.supplierId) where.supplierId = query.supplierId;

  const invoices = await prisma.supplierInvoice.findMany({
    where,
    include: { supplier: true, branch: true },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const agingBuckets = { "0-30": [], "31-60": [], "61-90": [], "90+": [] };
  let totalOutstanding = 0;

  const rows = invoices.map((inv) => {
    const remaining = Number(inv.totalAmount) - Number(inv.paidAmount);
    const dueDays = Math.ceil((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let bucket = "0-30";
    if (dueDays > 90) bucket = "90+";
    else if (dueDays > 60) bucket = "61-90";
    else if (dueDays > 30) bucket = "31-60";

    if (remaining > 0) {
      agingBuckets[bucket].push(remaining);
      totalOutstanding += remaining;
    }

    return {
      supplierId: inv.supplierId,
      supplierName: inv.supplier.name,
      invoiceNumber: inv.invoiceNumber,
      branchName: inv.branch?.name || "-",
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      remaining,
      dueDate: inv.dueDate.toISOString().split("T")[0],
      daysRemaining: dueDays,
      status: inv.status,
      bucket,
    };
  });

  return {
    filters: { branchId, supplierId: query.supplierId || "ALL" },
    summary: {
      totalInvoices: invoices.length,
      totalOutstanding,
      agingBuckets: Object.fromEntries(
        Object.entries(agingBuckets).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0)])
      ),
    },
    rows,
  };
}

async function generateReport(reportKey, user, branchContext, query = {}) {
  const generator = REPORT_GENERATORS[reportKey];
  if (!generator) {
    const error = new Error(`Report '${reportKey}' tidak ditemukan`);
    error.statusCode = 404;
    throw error;
  }

  const data = await generator(user, branchContext, query);
  return {
    key: reportKey,
    ...data,
  };
}

module.exports = {
  REPORT_KEYS,
  REPORT_GENERATORS,
  generateReport,
};
