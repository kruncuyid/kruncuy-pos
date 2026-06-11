const prisma = require("../../core/config/prisma");
const transactionService = require("../transactions/transaction.service");
const accessControlService = require("../../core/services/accessControl.service");
const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
const { REPORT_KEYS, generateReport } = require("./reportGenerators");

function getDateRange(daysBack = 0, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthToDateRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPeriodRange(days, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function getSelectedBranchId(branchContext) {
  return branchContext?.branchId || null;
}

function parseDateOrNull(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function buildDateRangeFromQuery(query = {}) {
  const startDate = parseDateOrNull(query.startDate);
  const endDate = parseDateOrNull(query.endDate);
  const now = new Date();

  const fallback = getMonthToDateRange(now);

  const start = startDate || fallback.start;
  const end = endDate || fallback.end;

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function buildPaymentSummary(transactions) {
  return transactions.reduce((acc, trx) => {
    const key = String(trx.paymentMethod || "UNKNOWN").toUpperCase();
    const amount = Number(trx.totalAmount || 0);

    acc[key] = (acc[key] || 0) + amount;
    return acc;
  }, {});
}

function buildUserDisplayName(user) {
  if (!user) return "-";
  const username = String(user.username || "").trim();
  const nickname = String(user.nickname || "").trim();
  const fullName = String(user.name || "").trim();

  const parts = [];
  if (username) parts.push(username);
  if (nickname && nickname !== username) parts.push(nickname);
  if (fullName && fullName !== nickname && fullName !== username) parts.push(fullName);

  return parts.length ? parts.join(" | ") : fullName || username || "-";
}

function sumTransactions(transactions) {
  const totalSales = transactions.reduce((sum, trx) => sum + Number(trx.totalAmount || 0), 0);
  const totalPcs = transactions.reduce((sum, trx) => sum + Number(trx.totalPcs || 0), 0);
  return { totalSales, totalPcs };
}

function buildSalesRecapRows(transactions) {
  return transactions.map((trx) => ({
    id: trx.id,
    invoiceNumber: trx.invoiceNumber,
    branchId: trx.branchId,
    branchName: trx.branch?.name || "-",
    branchCode: trx.branch?.code || "-",
    cashierId: trx.cashierId,
    cashierUsername: trx.cashierUsernameSnapshot || trx.cashier?.username || "-",
    cashierNickname: trx.cashier?.nickname || "-",
    cashierName: trx.cashierFullNameSnapshot || trx.cashier?.name || "-",
    cashierDisplayName: buildUserDisplayName({
      username: trx.cashierUsernameSnapshot || trx.cashier?.username || "",
      nickname: trx.cashier?.nickname || "",
      name: trx.cashierFullNameSnapshot || trx.cashier?.name || "",
    }),
    createdAt: trx.createdAt,
    salesChannel: trx.salesChannel,
    onlinePlatform: trx.onlinePlatform,
    paymentMethod: trx.paymentMethod,
    totalAmount: Number(trx.totalAmount || 0),
    totalPcs: Number(trx.totalPcs || 0),
    itemCount: Array.isArray(trx.items) ? trx.items.length : 0,
    items: Array.isArray(trx.items)
      ? trx.items.map((item) => ({
          productName: item.productName,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
        }))
      : [],
  }));
}

async function resolveCashEnd(session, cashSalesTotal, branchId) {
  if (!branchId) {
    if (!session) return 0;
    branchId = session.branchId;
  }
  if (!branchId) return 0;

  // Lazy require to avoid circular dependency
  const { getBranchCashBalance } = require("../cash-sessions/cashSession.service");
  return getBranchCashBalance(branchId);
}

async function getTodayBranchSales(user, branchContext) {
  const effective = branchContext;
  const branchId = getSelectedBranchId(effective);
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);

  const transactions = await transactionService.getTodayTransactions(user, branchContext);
  const filteredTransactions = branchId
    ? transactions.filter((trx) => trx.branchId === branchId)
    : transactions;

  const { totalSales, totalPcs } = sumTransactions(filteredTransactions);
  const paymentBreakdown = buildPaymentSummary(filteredTransactions);
  const totalCash = Number(paymentBreakdown.CASH || 0);
  const totalCashEnd = totalCash;

  return {
    scope: branchId ? "single" : hasGlobalAccess ? "all" : "single",
    branch: branchId ? null : null,
    summary: {
      totalTransactions: filteredTransactions.length,
      totalSales,
      totalPcs,
      totalCash,
      totalCashEnd,
      paymentBreakdown,
    },
    items: filteredTransactions,
    latestSession: null,
  };
}

async function getSalesRecap(user, branchContext, query = {}) {
  const selectedBranchId = getSelectedBranchId(branchContext);
  const { start, end } = buildDateRangeFromQuery(query);
  const paymentMethod = String(query.paymentMethod || "ALL").toUpperCase();
  const cashierId = query.cashierId || "ALL";
  const salesChannel = String(query.salesChannel || "ALL").toUpperCase();

  const where = {
    status: "COMPLETED",
    createdAt: {
      gte: start,
      lte: end,
    },
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    ...(paymentMethod !== "ALL" ? { paymentMethod } : {}),
    ...(cashierId !== "ALL" ? { cashierId } : {}),
    ...(salesChannel !== "ALL" ? { salesChannel } : {}),
  };

  const [branches, transactions] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where,
      include: {
        branch: true,
        cashier: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const totalTransactions = transactions.length;
  const { totalSales, totalPcs } = sumTransactions(transactions);
  const paymentBreakdown = buildPaymentSummary(transactions);
  const rows = buildSalesRecapRows(transactions);
  const cashierOptions = Array.from(
    new Map(
      transactions
        .filter((trx) => trx.cashier?.id)
        .map((trx) => [trx.cashier.id, trx.cashier])
    ).values()
  )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .map((cashier) => ({
      ...cashier,
      displayName: buildUserDisplayName(cashier),
    }));

  const branchCount = selectedBranchId ? 1 : branches.length;
  const selectedBranch = selectedBranchId
    ? branches.find((branch) => branch.id === selectedBranchId) || null
    : null;

  return {
    filters: {
      branchId: selectedBranchId,
      paymentMethod,
      cashierId,
      salesChannel,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    selectedBranch,
    branchCount,
    cashierOptions,
    summary: {
      totalTransactions,
      totalSales,
      totalPcs,
      averageTicket: totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0,
      paymentBreakdown,
      cashTotal: Number(paymentBreakdown.CASH || 0),
      qrisTotal: Number(paymentBreakdown.QRIS || 0),
      onlineTotal: Number(paymentBreakdown.GOFOOD || 0) + Number(paymentBreakdown.GRABFOOD || 0) + Number(paymentBreakdown.SHOPEEFOOD || 0),
    },
    rows,
  };
}

async function getErpDashboard(user, branchContext, query = {}) {
  const selectedBranchId = getSelectedBranchId(branchContext);
  const today = new Date();

  // Date filter: default hari ini, bisa di-override via query
  let targetDate = today;
  if (query.date) {
    targetDate = new Date(query.date);
  } else if (query.startDate) {
    targetDate = new Date(query.startDate);
  }
  if (isNaN(targetDate.getTime())) targetDate = today;

  let endDate = targetDate;
  if (query.endDate) {
    endDate = new Date(query.endDate);
    if (isNaN(endDate.getTime())) endDate = targetDate;
  }

  const { start: todayStart, end: todayEnd } = getDateRange(0, targetDate);
  // For end date, set to end of day
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);
  const { start: sevenDayStart } = getPeriodRange(7, targetDate);
  const { start: prevSevenDayStart, end: prevSevenDayEnd } = (() => {
    const end = new Date(targetDate);
    end.setDate(end.getDate() - 7);
    end.setHours(23, 59, 59, 999);

    const start = new Date(targetDate);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  })();

  const [branches, todayTransactions, sevenDayTransactions, prevSevenDayTransactions, todaySessions] =
    await Promise.all([
      prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.transaction.findMany({
        where: {
          ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: "COMPLETED",
        },
        include: {
          branch: true,
          cashier: true,
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
          createdAt: {
            gte: sevenDayStart,
            lte: todayEnd,
          },
          status: "COMPLETED",
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
          createdAt: {
            gte: prevSevenDayStart,
            lte: prevSevenDayEnd,
          },
          status: "COMPLETED",
        },
      }),
      prisma.cashSession.findMany({
        where: {
          ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
          openedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          branch: true,
          user: true,
          outletExpenses: true,
        },
        orderBy: {
          openedAt: "desc",
        },
      }),
    ]);

  const branchTransactions = todayTransactions.reduce((acc, trx) => {
    if (!acc[trx.branchId]) {
      acc[trx.branchId] = [];
    }

    acc[trx.branchId].push(trx);
    return acc;
  }, {});

  const sessionByBranch = todaySessions.reduce((acc, session) => {
    if (!acc[session.branchId]) {
      acc[session.branchId] = [];
    }

    acc[session.branchId].push(session);
    return acc;
  }, {});

  const branchSnapshots = await Promise.all(branches.map(async (branch) => {
    const transactions = branchTransactions[branch.id] || [];
    const sessions = sessionByBranch[branch.id] || [];
    const latestSession = sessions[0] || null;
    const { totalSales, totalPcs } = sumTransactions(transactions);
    const paymentBreakdown = buildPaymentSummary(transactions);
    const cashSalesTotal = Number(paymentBreakdown.CASH || 0);
    const cashEnd = await resolveCashEnd(latestSession, cashSalesTotal, branch.id);
    const activeSession = sessions.find((session) => session.status === "OPEN") || null;

    return {
      branch,
      status: activeSession ? "OPEN" : latestSession ? "CLOSED_OR_DONE" : "NO_SHIFT",
      totals: {
        totalTransactions: transactions.length,
        totalSales,
        totalPcs,
        totalCash: cashSalesTotal,
        totalCashEnd: cashEnd,
        paymentBreakdown,
      },
      latestSession,
      activeSession,
      updatedAt:
        transactions[0]?.createdAt ||
        activeSession?.updatedAt ||
        latestSession?.updatedAt ||
        branch.updatedAt,
    };
  }));

  const totals = sumTransactions(todayTransactions);
  const paymentBreakdown = buildPaymentSummary(todayTransactions);
  const thisWeekSales = sevenDayTransactions.reduce((sum, trx) => sum + Number(trx.totalAmount || 0), 0);
  const prevWeekSales = prevSevenDayTransactions.reduce((sum, trx) => sum + Number(trx.totalAmount || 0), 0);
  const growthPercent =
    prevWeekSales > 0 ? Math.round(((thisWeekSales - prevWeekSales) / prevWeekSales) * 1000) / 10 : null;
  const activeBranches = branchSnapshots.filter((item) => item.status === "OPEN").length;
  const totalCash = Number(paymentBreakdown.CASH || 0);
  const totalCashEnd = branchSnapshots.reduce((sum, item) => sum + Number(item.totals.totalCashEnd || 0), 0);

  // Daily sales breakdown for last 7 days
  const dailySales = {};
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = dayNames[d.getDay()];
    dailySales[key] = { date: key, day: label, sales: 0, pcs: 0, tx: 0 };
  }
  for (const trx of sevenDayTransactions) {
    const key = new Date(trx.createdAt).toISOString().slice(0, 10);
    if (dailySales[key]) {
      dailySales[key].sales += Number(trx.totalAmount || 0);
      dailySales[key].pcs += Number(trx.totalPcs || 0);
      dailySales[key].tx += 1;
    }
  }

  // Online vs Offline breakdown
  const channelBreakdown = { online: 0, offline: 0 };
  for (const tx of todayTransactions) {
    if (tx.salesChannel === "ONLINE") channelBreakdown.online += Number(tx.totalAmount || 0);
    else channelBreakdown.offline += Number(tx.totalAmount || 0);
  }

  // Daily PCS target: global setting with per-branch overrides
  const pcsTargets = await prisma.systemSetting.findMany({
    where: { key: "pos_target_pcs", isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  const globalTarget = 450;
  let globalTargetNum = globalTarget;
  // branch-specific targets: key = pos_target_pcs, scope = BRANCH, branchId set
  const branchTargets = {};
  for (const st of pcsTargets) {
    const val = Number(st.value);
    if (!Number.isFinite(val) || val < 1) continue;
    if (st.scope === "GLOBAL" || (!st.branchId && st.scope !== "BRANCH")) {
      globalTargetNum = val;
    } else if (st.branchId) {
      branchTargets[st.branchId] = val;
    }
  }
  let dailyPcsTarget = 0;
  for (const branch of branches) {
    if (!branch.isActive) continue;
    dailyPcsTarget += branchTargets[branch.id] || globalTargetNum;
  }

  return {
    selectedBranchId,
    selectedBranch: selectedBranchId
      ? branches.find((branch) => branch.id === selectedBranchId) || null
      : null,
    branches,
    branchSnapshots,
    dailySales: Object.values(dailySales),
    channelBreakdown,
    pcsTarget: {
      total: dailyPcsTarget,
      achieved: Number(totals.totalPcs || 0),
      remaining: Math.max(0, dailyPcsTarget - Number(totals.totalPcs || 0)),
      percentage: dailyPcsTarget > 0 ? Math.round((Number(totals.totalPcs || 0) / dailyPcsTarget) * 100) : 0,
      branches: branches.length,
    },
    summary: {
      totalTransactions: todayTransactions.length,
      totalSales: totals.totalSales,
      totalPcs: totals.totalPcs,
      totalCash,
      totalCashEnd,
      activeBranches,
      branchCount: branches.length,
      thisWeekSales,
      prevWeekSales,
      growthPercent,
      paymentBreakdown,
    },
    selectedDate: targetDate.toISOString().slice(0, 10),
    refreshedAt: new Date().toISOString(),
  };
}

async function getDailyReport(user, branchContext) {
  const transactions = await transactionService.getTodayTransactions(user, branchContext);

  const completedTransactions = transactions.filter((trx) => trx.status === "COMPLETED");
  const voidTransactions = transactions.filter((trx) => trx.status === "VOID");

  const totalSales = completedTransactions.reduce((sum, trx) => sum + trx.totalAmount, 0);
  const totalPcs = completedTransactions.reduce((sum, trx) => sum + trx.totalPcs, 0);

  const paymentSummary = completedTransactions.reduce((acc, trx) => {
    acc[trx.paymentMethod] = (acc[trx.paymentMethod] || 0) + trx.totalAmount;
    return acc;
  }, {});

  return {
    date: new Date().toISOString().slice(0, 10),
    cashier: {
      id: user.id,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
    },
    summary: {
      totalTransactions: completedTransactions.length,
      voidTransactions: voidTransactions.length,
      totalSales,
      totalPcs,
      paymentSummary,
    },
    transactions: completedTransactions,
  };
}

async function getReportByKey(reportKey, user, branchContext, query = {}) {
  return generateReport(reportKey, user, branchContext, query);
}

function listReportCatalog() {
  return REPORT_KEYS;
}

module.exports = {
  getDailyReport,
  getErpDashboard,
  getSalesRecap,
  getReportByKey,
  listReportCatalog,
};
