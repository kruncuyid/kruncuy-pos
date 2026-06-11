const prisma = require("../../core/config/prisma");

exports.getNotifications = async (user, branchContext) => {
  const branchId = branchContext?.branchId || null;

  const notifications = [];

  // Stock alerts (4.4)
  const lowStockItems = await prisma.branchInventoryItem.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      isActive: true,
      currentStock: { lte: 2 },
    },
    include: {
      inventoryItem: { select: { name: true, unit: true } },
      branch: { select: { name: true } },
    },
    orderBy: { currentStock: "asc" },
    take: 10,
  });

  for (const item of lowStockItems) {
    notifications.push({
      type: "stock_alert",
      severity: Number(item.currentStock) <= 0 ? "critical" : "warning",
      title: `Stok ${item.inventoryItem.name} habis`,
      description: `${item.branch.name} — sisa ${Number(item.currentStock)} ${item.inventoryItem.unit}`,
      branchName: item.branch.name,
      createdAt: new Date(),
    });
  }

  // Pending cash withdrawals (4.5)
  const pendingWithdrawals = await prisma.cashWithdrawal.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      status: { in: ["REQUESTED", "OTP_ISSUED"] },
    },
    include: {
      branch: { select: { name: true } },
      requestedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const w of pendingWithdrawals) {
    notifications.push({
      type: "withdrawal_pending",
      severity: "warning",
      title: `Penarikan cash ${w.withdrawalNumber}`,
      description: `${w.branch.name} — Rp ${Number(w.amount).toLocaleString()} oleh ${w.requestedBy?.name}`,
      branchName: w.branch.name,
      createdAt: w.createdAt,
    });
  }

  // Pending outlet expenses
  const pendingExpenses = await prisma.outletExpense.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      status: "REQUESTED",
    },
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const e of pendingExpenses) {
    notifications.push({
      type: "expense_pending",
      severity: "info",
      title: `Expense ${e.note || "baru"}`,
      description: `${e.branch.name} — Rp ${Number(e.totalAmount).toLocaleString()} oleh ${e.createdBy?.name}`,
      branchName: e.branch.name,
      createdAt: e.createdAt,
    });
  }

  // Sort by date descending
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    total: notifications.length,
    byType: {
      stock_alert: lowStockItems.length,
      withdrawal_pending: pendingWithdrawals.length,
      expense_pending: pendingExpenses.length,
    },
    items: notifications.slice(0, 50),
  };
};
