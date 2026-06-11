const prisma = require("../../core/config/prisma");
const crypto = require("crypto");

function generatePayrollNumber() {
  return `PY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

exports.list = async (query = {}) => {
  const where = {};
  if (query.periodMonth) where.periodMonth = Number(query.periodMonth);
  if (query.periodYear) where.periodYear = Number(query.periodYear);
  if (query.userId) where.userId = query.userId;
  if (query.branchId) where.branchId = query.branchId;

  return prisma.payroll.findMany({
    where,
    include: { user: true, branch: true },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });
};

exports.getById = async (id) => {
  const p = await prisma.payroll.findUnique({ where: { id }, include: { user: true, branch: true } });
  if (!p) { const e = new Error("Payroll tidak ditemukan"); e.statusCode = 404; throw e; }
  return p;
};

async function getSystemSettingValue(key, defaultValue) {
  try {
    const setting = await prisma.systemSetting.findFirst({
      where: { key },
      orderBy: { updatedAt: "desc" },
    });
    if (!setting || setting.value === null || setting.value === undefined || setting.value === "") {
      return defaultValue;
    }
    const numeric = Number(setting.value);
    return Number.isFinite(numeric) ? numeric : defaultValue;
  } catch {
    return defaultValue;
  }
}

exports.calculate = async (userId, periodMonth, periodYear, branchId) => {
  // Resolve branch from user if not provided
  let resolvedBranchId = branchId;
  if (!resolvedBranchId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
    resolvedBranchId = user?.branchId || null;
  }
  if (!resolvedBranchId) {
    const error = new Error("Branch tidak ditemukan untuk user ini");
    error.statusCode = 400;
    throw error;
  }

  // Get attendance count for the period
  const startDate = new Date(periodYear, periodMonth - 1, 1);
  const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

  const attendanceCount = await prisma.crewAttendance.count({
    where: { userId, attendanceDate: { gte: startDate, lte: endDate }, checkInAt: { not: null } },
  });

  const transactions = await prisma.transaction.findMany({
    where: { cashierId: userId, createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" },
  });
  const totalPcs = transactions.reduce((sum, t) => sum + Number(t.totalPcs || 0), 0);
  const corePcs = Math.max(0, totalPcs);
  const baseSalary = await getSystemSettingValue("payroll_base_salary", 0);
  const bonusPerPcs = await getSystemSettingValue("crew_bonus_per_pcs", 250);
  const bonusAmount = corePcs * bonusPerPcs;

  return { userId, periodMonth, periodYear, branchId: resolvedBranchId, baseSalary, bonusAmount, overtimeAmount: 0, deductions: 0, netAmount: baseSalary + bonusAmount, attendanceCount, totalPcs };
};

exports.create = async (payload) => {
  const { userId, periodMonth, periodYear, branchId, baseSalary, bonusAmount, overtimeAmount, deductions, notes } = payload;
  if (!userId || !periodMonth || !periodYear) { const e = new Error("User dan periode wajib"); e.statusCode = 400; throw e; }
  if (!branchId) { const e = new Error("Branch wajib diisi"); e.statusCode = 400; throw e; }

  const netAmount = (baseSalary || 0) + (bonusAmount || 0) + (overtimeAmount || 0) - (deductions || 0);
  return prisma.payroll.upsert({
    where: { userId_periodYear_periodMonth: { userId, periodYear, periodMonth } },
    update: { baseSalary, bonusAmount, overtimeAmount, deductions, netAmount, notes, status: "DRAFT" },
    create: {
      payrollNumber: generatePayrollNumber(),
      userId,
      branchId,
      periodMonth, periodYear,
      baseSalary: baseSalary || 0, bonusAmount: bonusAmount || 0, overtimeAmount: overtimeAmount || 0, deductions: deductions || 0, netAmount, notes,
    },
    include: { user: true, branch: true },
  });
};

exports.approve = async (id) => {
  return prisma.payroll.update({ where: { id }, data: { status: "APPROVED" } });
};

exports.pay = async (id) => {
  return prisma.payroll.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
};

exports.remove = async (id) => {
  return prisma.payroll.delete({ where: { id } });
};
