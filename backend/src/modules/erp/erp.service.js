const prisma = require("../../core/config/prisma");
const { getPermissionsByRole } = require("../../core/middleware/permission.middleware");
const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");

const NAVIGATION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    items: [
      { key: "overview", label: "Overview", href: "/erp", permission: "reports:read" },
    ],
  },
  {
    key: "master-data",
    label: "Master Data",
    items: [
      { key: "products", label: "Products", href: "/erp/products", permission: "products:read" },
      { key: "categories", label: "Categories", href: "/erp/product-categories", permission: "product-categories:read" },
      { key: "branch-pricing", label: "Branch Pricing", href: "/erp/branch-products", permission: "branch-products:read" },
      { key: "recipes", label: "Recipes", href: "/erp/menu-recipes", permission: "inventory:read" },
      { key: "inventory-items", label: "Inventory Items", href: "/erp/inventory", permission: "inventory:read" },
      { key: "suppliers", label: "Suppliers", href: "/erp/suppliers", permission: "suppliers:read" },
      { key: "branches", label: "Branches", href: "/erp/branches", permission: "branches:read" },
      { key: "master-data", label: "Master Data", href: "/erp/master-data", permission: "master-data:read" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      { key: "transactions", label: "Transactions", href: "/erp/transactions", permission: "transactions:read" },
      { key: "sales-overview", label: "Sales Overview", href: "/erp/sales", permission: "reports:read" },
      { key: "stock-opname", label: "Stock Opname", href: "/erp/stock-opname", permission: "inventory:read" },
      { key: "inventory-movement", label: "Inventory Movement", href: "/erp/inventory-movement", permission: "inventory:read" },
      { key: "warehouse", label: "Warehouse", href: "/erp/warehouse", permission: "inventory:read" },
      { key: "depot-transfer", label: "Depot Transfer", href: "/erp/depot-transfers", permission: "depot-transfers:read" },
      { key: "returns", label: "Returns", href: "/erp/returns", permission: "returns:read" },
      { key: "waste", label: "Waste Management", href: "/erp/waste", permission: "waste:read" },
      { key: "shipment-tracking", label: "Shipment Tracking", href: "/erp/shipment-tracking", permission: "inventory:read" },
      { key: "branch-orders", label: "Branch Orders", href: "/erp/branch-orders", permission: "purchasing:read" },
      { key: "operations-log", label: "Operations Log", href: "/erp/operations-log", permission: "reports:read" },
    ],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    items: [
      { key: "purchasing", label: "Purchasing Overview", href: "/erp/purchasing", permission: "purchasing:read" },
      { key: "purchase-requests", label: "Purchase Request", href: "/erp/purchase-requests", permission: "purchasing-request:read" },
      { key: "purchase-orders", label: "Purchase Order", href: "/erp/purchase-orders", permission: "purchasing-order:read" },
      { key: "goods-receipt", label: "Goods Receipt", href: "/erp/goods-receipts", permission: "goods-receipt:read" },
      { key: "outlet-expenses", label: "Outlet Expenses", href: "/erp/outlet-expenses", permission: "purchasing:read" },
      { key: "purchasing-queue", label: "Purchasing Queue", href: "/erp/purchasing-queue", permission: "purchasing:read" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    items: [
      { key: "cash-sessions", label: "Cash Sessions", href: "/erp/cash-sessions", permission: "cash-sessions:read" },
      { key: "cash-withdrawals", label: "Cash Withdrawals", href: "/erp/cash-withdrawals", permission: "cash-withdrawals:read" },
      { key: "cash-control", label: "Cash Control", href: "/erp/cash-control", permission: "cash-sessions:read" },
      { key: "payroll", label: "Payroll", href: "/erp/payroll", permission: "payroll:read" },
    ],
  },
  {
    key: "hr",
    label: "HR",
    items: [
      { key: "users", label: "Users", href: "/erp/users", permission: "users:read" },
      { key: "assignments", label: "Branch Assignments", href: "/erp/branch-assignments", permission: "branch-assignments:read" },
      { key: "attendance", label: "Attendance", href: "/erp/attendance", permission: "cash-sessions:read" },
      { key: "performance", label: "Performance", href: "/erp/performance", permission: "reports:read" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    items: [
      { key: "reports-center", label: "Reports Center", href: "/erp/reports", permission: "reports:read" },
    ],
  },
  {
    key: "system",
    label: "System",
    items: [
      { key: "access-control", label: "Access Control", href: "/erp/access-control", permission: "access-control:read" },
      { key: "settings", label: "Settings", href: "/erp/settings", permission: "settings:read" },
      { key: "audit-logs", label: "Audit Logs", href: "/erp/audit-logs", permission: "audit-logs:read" },
      { key: "reference", label: "Reference", href: "/erp/reference", permission: "master-data:read" },
      { key: "compliance", label: "Compliance", href: "/erp/compliance", permission: "audit-logs:read" },
    ],
  },
];

function filterNavigation(groups, permissions) {
  return groups
    .map((group) => {
      const items = group.items.filter((item) => permissions.includes(item.permission));
      return {
        ...group,
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}

exports.getNavigationManifest = async (user) => {
  const permissions = await getPermissionsByRole(user.role);

  return {
    role: user.role,
    permissions,
    groups: filterNavigation(NAVIGATION_GROUPS, permissions),
  };
};

exports.getNavigationGroups = () => NAVIGATION_GROUPS;

function parseDateInput(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function getMonthRange(baseDate = new Date()) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return {
    start: startOfDay(firstDay),
    end: endOfDay(lastDay),
  };
}

function parseMonthInput(value) {
  if (typeof value !== "string" || !value.trim()) {
    return new Date();
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

async function getSystemSettingValue(key, defaultValue, branchId = null) {
  const setting = await prisma.systemSetting.findFirst({
    where: {
      key,
      ...(branchId ? { branchId } : {}),
    },
    orderBy: [
      { scope: "desc" },
      { updatedAt: "desc" },
    ],
  });

  if (!setting && branchId) {
    const globalSetting = await prisma.systemSetting.findFirst({
      where: {
        key,
        branchId: null,
      },
      orderBy: [
        { scope: "desc" },
        { updatedAt: "desc" },
      ],
    });

    if (globalSetting?.value !== null && globalSetting?.value !== undefined && globalSetting?.value !== "") {
      return globalSetting.value;
    }
  }

  if (setting?.value === null || setting?.value === undefined || setting?.value === "") {
    return defaultValue;
  }

  const rawValue = setting.value;
  if (typeof rawValue === "number") return rawValue;
  if (typeof rawValue === "boolean") return rawValue ? 1 : 0;
  if (typeof rawValue === "string") {
    const numeric = Number(rawValue);
    return Number.isFinite(numeric) ? numeric : rawValue;
  }

  return defaultValue;
}

function getExtraSaucePcs(items = []) {
  return items.reduce((sum, item) => {
    const name = String(item.productName || item.product?.name || "").toLowerCase();
    const isExtraSauce = name.includes("sauce") || name.includes("saos") || name.includes("sos");
    return sum + (isExtraSauce ? Number(item.pcs || 0) : 0);
  }, 0);
}

async function getAttendanceOverview(query = {}) {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = startOfDay(parseDateInput(query.startDate, defaultStart));
  const end = endOfDay(parseDateInput(query.endDate, defaultEnd));
  const branchId = typeof query.branchId === "string" && query.branchId.trim() ? query.branchId.trim() : "";
  const userId = typeof query.userId === "string" && query.userId.trim() ? query.userId.trim() : "";
  const status = typeof query.status === "string" && query.status.trim() ? query.status.trim() : "";

  const where = {
    attendanceDate: {
      gte: start,
      lte: end,
    },
    ...(branchId ? { branchId } : {}),
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
  };

  const [attendances, branches, crewUsers] = await Promise.all([
    prisma.crewAttendance.findMany({
      where,
      include: {
        branch: true,
        user: true,
      },
      orderBy: [{ attendanceDate: "desc" }, { checkInAt: "desc" }],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: "CREW",
      },
      include: {
        branch: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const summary = {
    totalAttendance: attendances.length,
    presentCount: attendances.filter((item) => item.checkInAt).length,
    checkoutCount: attendances.filter((item) => item.checkOutAt).length,
    branchCount: new Set(attendances.map((item) => item.branchId)).size,
  };

  return {
    period: {
      start,
      end,
      startInput: start.toISOString().slice(0, 10),
      endInput: end.toISOString().slice(0, 10),
    },
    summary,
    filters: {
      branchId,
      userId,
      status,
    },
    branches,
    crewUsers,
    attendances,
  };
}

async function getPerformanceOverview(query = {}) {
  const baseDate = parseMonthInput(query.month);
  const { start, end } = getMonthRange(baseDate);
  const branchId = typeof query.branchId === "string" && query.branchId.trim() ? query.branchId.trim() : "";
  const userId = typeof query.userId === "string" && query.userId.trim() ? query.userId.trim() : "";
  const targetMinPcs = Math.max(1, Number(await getSystemSettingValue("crew_bonus_min_pcs", 25, branchId)));
  const bonusPerPcs = Math.max(0, Number(await getSystemSettingValue("crew_bonus_per_pcs", 250, branchId)));
  const bonusPerExtraSauce = Math.max(0, Number(await getSystemSettingValue("crew_bonus_extra_sauce", 250, branchId)));

  const transactionWhere = {
    status: "COMPLETED",
    createdAt: {
      gte: start,
      lte: end,
    },
    ...(branchId ? { branchId } : {}),
    ...(userId ? { cashierId: userId } : {}),
  };

  const attendanceWhere = {
    attendanceDate: {
      gte: start,
      lte: end,
    },
    ...(branchId ? { branchId } : {}),
    ...(userId ? { userId } : {}),
  };

  const [transactions, attendances, branches, crewUsers] = await Promise.all([
    prisma.transaction.findMany({
      where: transactionWhere,
      include: {
        branch: true,
        cashier: true,
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.crewAttendance.findMany({
      where: attendanceWhere,
      include: {
        branch: true,
        user: true,
      },
      orderBy: {
        attendanceDate: "asc",
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: "CREW",
        ...(userId ? { id: userId } : {}),
      },
      include: {
        branch: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const transactionMap = new Map();
  for (const trx of transactions) {
    const cashierId = trx.cashierId;
    if (!cashierId) continue;

    if (!transactionMap.has(cashierId)) {
      transactionMap.set(cashierId, {
        userId: cashierId,
        name: trx.cashier?.name || "-",
        email: trx.cashier?.email || "-",
        branchNames: new Set(),
        totalTransactions: 0,
        totalSales: 0,
        totalPcs: 0,
        extraSaucePcs: 0,
        corePcs: 0,
      });
    }

    const bucket = transactionMap.get(cashierId);
    bucket.branchNames.add(trx.branch?.name || "-");
    bucket.totalTransactions += 1;
    bucket.totalSales += Number(trx.totalAmount || 0);
    bucket.totalPcs += Number(trx.totalPcs || 0);
    const extraSaucePcs = getExtraSaucePcs(trx.items || []);
    bucket.extraSaucePcs += extraSaucePcs;
    bucket.corePcs += Math.max(0, Number(trx.totalPcs || 0) - extraSaucePcs);
  }

  const attendanceMap = new Map();
  for (const attendance of attendances) {
    if (!attendance.userId) continue;
    attendanceMap.set(attendance.userId, (attendanceMap.get(attendance.userId) || 0) + 1);
  }

  const rows = crewUsers
    .map((user) => {
      const transactionBucket = transactionMap.get(user.id) || {
        userId: user.id,
        name: user.name,
        email: user.email,
        branchNames: new Set(user.branch?.name ? [user.branch.name] : []),
        totalTransactions: 0,
        totalSales: 0,
        totalPcs: 0,
        extraSaucePcs: 0,
        corePcs: 0,
      };

      const attendanceCount = attendanceMap.get(user.id) || 0;
      const pcsBonus = Math.max(0, transactionBucket.corePcs - targetMinPcs) * bonusPerPcs;
      const extraSauceBonus = Number(transactionBucket.extraSaucePcs || 0) * bonusPerExtraSauce;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchName: user.branch?.name || Array.from(transactionBucket.branchNames).join(", ") || "-",
        attendanceCount,
        totalTransactions: transactionBucket.totalTransactions,
        totalSales: transactionBucket.totalSales,
        totalPcs: transactionBucket.totalPcs,
        corePcs: transactionBucket.corePcs,
        extraSaucePcs: transactionBucket.extraSaucePcs,
        pcsBonus,
        extraSauceBonus,
        totalBonus: pcsBonus + extraSauceBonus,
      };
    })
    .filter((item) => item.attendanceCount || item.totalTransactions)
    .sort((left, right) => right.totalBonus - left.totalBonus || right.totalSales - left.totalSales);

  const summary = {
    totalCrew: rows.length,
    totalAttendance: attendances.length,
    totalTransactions: transactions.length,
    totalSales: transactions.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    totalPcs: transactions.reduce((sum, item) => sum + Number(item.totalPcs || 0), 0),
    totalBonus: rows.reduce((sum, item) => sum + Number(item.totalBonus || 0), 0),
  };

  return {
    period: {
      month: start.toISOString().slice(0, 7),
      start,
      end,
      monthInput: start.toISOString().slice(0, 7),
    },
    summary,
    filters: {
      branchId,
      userId,
    },
    branches,
    crewUsers,
    rows,
    bonusRules: {
      targetMinPcs,
      bonusPerPcs,
      bonusPerExtraSauce,
    },
  };
}

async function getCashSessionsOverview(query = {}) {
  const now = new Date();
  const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = startOfDay(parseDateInput(query.startDate, fallbackStart));
  const end = endOfDay(parseDateInput(query.endDate, fallbackEnd));
  const branchId = typeof query.branchId === "string" && query.branchId.trim() ? query.branchId.trim() : "";
  const userId = typeof query.userId === "string" && query.userId.trim() ? query.userId.trim() : "";
  const status = typeof query.status === "string" && query.status.trim() ? query.status.trim() : "";
  const search = typeof query.search === "string" && query.search.trim() ? query.search.trim().toLowerCase() : "";

  const where = {
    openedAt: {
      gte: start,
      lte: end,
    },
    ...(branchId ? { branchId } : {}),
    ...(userId ? { userId } : {}),
    ...(status !== "ALL" && status ? { status } : {}),
  };

  const [sessions, branches] = await Promise.all([
    prisma.cashSession.findMany({
      where,
      include: {
        branch: true,
        user: true,
        transactions: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            paymentMethod: true,
            totalAmount: true,
          },
        },
        outletExpenses: {
          where: { status: "POSTED" },
          select: {
            id: true,
            totalAmount: true,
          },
        },
      },
      orderBy: [{ openedAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = [];
  for (const session of sessions) {
    const cashSalesTotal = session.transactions.reduce((sum, trx) => {
      if (trx.paymentMethod !== "CASH") return sum;
      return sum + Number(trx.totalAmount || 0);
    }, 0);
    const expenseTotal = session.outletExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
    const withdrawalTotal = await getCompletedWithdrawalTotalBySession(session.id);
    const expectedCash =
      session.status === "CLOSED"
        ? Number(session.expectedCash ?? session.closingCash ?? 0)
        : Number(session.openingCash || 0) + Number(cashSalesTotal || 0) - expenseTotal - withdrawalTotal;
    const closingCash = Number(session.closingCash || 0);
    const cashDifference = session.status === "CLOSED" ? closingCash - expectedCash : null;

    const haystack = [
      session.branch?.name,
      session.branch?.code,
      session.user?.name,
      session.user?.username,
      session.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (search && !haystack.includes(search)) continue;

    rows.push({
      id: session.id,
      branchId: session.branchId,
      branchName: session.branch?.name || "-",
      branchCode: session.branch?.code || "-",
      operatorName: session.user?.name || "-",
      operatorUsername: session.user?.username || "-",
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingCash: Number(session.openingCash || 0),
      expectedCash,
      closingCash: session.status === "CLOSED" ? closingCash : null,
      cashDifference,
      totalCashSales: cashSalesTotal,
      totalExpense: expenseTotal,
      totalWithdrawal: withdrawalTotal,
      totalTransactions: session.transactions.length,
    });
  }

  const summary = {
    totalSessions: rows.length,
    openSessions: rows.filter((row) => row.status === "OPEN").length,
    closedSessions: rows.filter((row) => row.status === "CLOSED").length,
    totalOpeningCash: rows.reduce((sum, row) => sum + Number(row.openingCash || 0), 0),
    totalExpectedCash: rows.reduce((sum, row) => sum + Number(row.expectedCash || 0), 0),
    totalClosingCash: rows.reduce((sum, row) => sum + Number(row.closingCash || 0), 0),
    totalBranches: branches.length,
  };

  return {
    period: {
      start,
      end,
      startInput: start.toISOString().slice(0, 10),
      endInput: end.toISOString().slice(0, 10),
    },
    filters: {
      branchId,
      userId,
      status,
      search,
    },
    branches,
    rows,
    summary,
  };
}

exports.getAttendanceOverview = getAttendanceOverview;
exports.getPerformanceOverview = getPerformanceOverview;
exports.getCashSessionsOverview = getCashSessionsOverview;

async function getCrossBranchDashboard(user, branchContext) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true } });
  const rows = await Promise.all(branches.map(async (b) => {
    const session = await prisma.cashSession.findFirst({
      where: { branchId: b.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const todayTx = await prisma.transaction.findMany({
      where: { branchId: b.id, createdAt: { gte: todayStart, lte: todayEnd }, status: "COMPLETED" },
      select: { totalAmount: true, totalPcs: true, paymentMethod: true },
    });

    const yesterdayTx = await prisma.transaction.aggregate({
      where: { branchId: b.id, createdAt: { gte: yesterdayStart, lt: todayStart }, status: "COMPLETED" },
      _sum: { totalAmount: true, totalPcs: true },
      _count: { id: true },
    });

    const todaySales = todayTx.reduce((s, t) => s + Number(t.totalAmount), 0);
    const todayPcs = todayTx.reduce((s, t) => s + Number(t.totalPcs), 0);
    const cashSales = todayTx.filter((t) => t.paymentMethod === "CASH").reduce((s, t) => s + Number(t.totalAmount), 0);
    const yesterdaySales = Number(yesterdayTx._sum.totalAmount || 0);
    const growth = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 0;

    const lowStock = await prisma.branchInventoryItem.count({
      where: { branchId: b.id, isActive: true, currentStock: { lte: 1 } },
    });

    return {
      id: b.id, name: b.name, code: b.code,
      hasActiveSession: !!session,
      openingCash: Number(session?.openingCash || 0),
      todaySales, todayPcs, cashSales,
      transactionCount: todayTx.length,
      yesterdaySales, growth,
      lowStockItems: lowStock,
    };
  }));

  const summary = {
    totalBranches: branches.length,
    activeBranches: rows.filter((r) => r.hasActiveSession).length,
    totalSales: rows.reduce((s, r) => s + r.todaySales, 0),
    totalPcs: rows.reduce((s, r) => s + r.todayPcs, 0),
    totalCash: rows.reduce((s, r) => s + r.cashSales, 0),
    totalTransactions: rows.reduce((s, r) => s + r.transactionCount, 0),
    branchesWithLowStock: rows.filter((r) => r.lowStockItems > 0).length,
  };

  return { summary, rows };
}

exports.getCrossBranchDashboard = getCrossBranchDashboard;
