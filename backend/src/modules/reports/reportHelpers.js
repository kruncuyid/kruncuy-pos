const prisma = require("../../core/config/prisma");
const accessControlService = require("../../core/services/accessControl.service");

function parseDateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getMonthToDateRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildDateRangeFromQuery(query = {}) {
  const startDate = parseDateOrNull(query.startDate);
  const endDate = parseDateOrNull(query.endDate);
  const fallback = getMonthToDateRange();
  const start = startDate || fallback.start;
  const end = endDate || fallback.end;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (start > end) return { start: end, end: start };
  return { start, end };
}

function getSelectedBranchId(branchContext) {
  return branchContext?.branchId || null;
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

function buildPaymentSummary(transactions) {
  return transactions.reduce((acc, trx) => {
    const key = String(trx.paymentMethod || "UNKNOWN").toUpperCase();
    acc[key] = (acc[key] || 0) + Number(trx.totalAmount || 0);
    return acc;
  }, {});
}

function sumTransactions(transactions) {
  const totalSales = transactions.reduce((sum, trx) => sum + Number(trx.totalAmount || 0), 0);
  const totalPcs = transactions.reduce((sum, trx) => sum + Number(trx.totalPcs || 0), 0);
  return { totalSales, totalPcs };
}

function toNumber(value) {
  return Number(value || 0);
}

function toDecimalNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function formatDayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildTransactionWhere(branchId, dateRange, extra = {}) {
  return {
    ...(branchId ? { branchId } : {}),
    createdAt: {
      gte: dateRange.start,
      lte: dateRange.end,
    },
    ...extra,
  };
}

async function resolveBranchFilter(user, branchContext, query = {}) {
  const selectedBranchId = getSelectedBranchId(branchContext);
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);
  const branches = hasGlobalAccess
    ? await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      })
    : selectedBranchId
      ? await prisma.branch.findMany({
          where: { id: selectedBranchId, isActive: true },
        })
      : [];

  const selectedBranch = selectedBranchId
    ? branches.find((branch) => branch.id === selectedBranchId) || null
    : null;

  return {
    branchId: selectedBranchId,
    branches,
    selectedBranch,
    dateRange: buildDateRangeFromQuery(query),
    query,
  };
}

function buildMetricsFromSummary(summary, presets = []) {
  return presets.map((preset) => ({
    label: preset.label,
    value: preset.format ? preset.format(summary[preset.key]) : summary[preset.key],
    hint: preset.hint || "",
    badge: preset.badge || "",
    tone: preset.tone || "neutral",
  }));
}

module.exports = {
  parseDateOrNull,
  getMonthToDateRange,
  buildDateRangeFromQuery,
  getSelectedBranchId,
  buildUserDisplayName,
  buildPaymentSummary,
  sumTransactions,
  toNumber,
  toDecimalNumber,
  formatDayKey,
  buildTransactionWhere,
  resolveBranchFilter,
  buildMetricsFromSummary,
};
