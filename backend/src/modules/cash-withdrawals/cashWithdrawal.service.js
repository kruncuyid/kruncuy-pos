const crypto = require("crypto");
const prisma = require("../../core/config/prisma");
const { createAuditLog } = require("../../core/services/auditLog.service");
const { getEffectiveBranchForUser, getTodayRange } = require("../../core/services/branchAccess.service");

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function buildWithdrawalNumber(date = new Date()) {
  const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CW-${getTodayKey(date)}-${randomSuffix}`;
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp, salt, withdrawalId) {
  return crypto.createHash("sha256").update(`${otp}:${salt}:${withdrawalId}`).digest("hex");
}

function normalizeFilters(query = {}) {
  const status = String(query.status || "ALL").toUpperCase();
  return {
    status,
    branchId: query.branchId || "",
    search: String(query.search || "").trim(),
    startDate: query.startDate || "",
    endDate: query.endDate || "",
  };
}

function buildWithdrawalWhere(user, branchContext, query = {}, options = {}) {
  const filters = normalizeFilters(query);
  const where = {
    ...(options.cashSessionId ? { cashSessionId: options.cashSessionId } : {}),
    ...(branchContext?.branchId ? { branchId: branchContext.branchId } : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.status !== "ALL" ? { status: filters.status } : {}),
  };

  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate) : null;

  if (startDate && !Number.isNaN(startDate.getTime())) {
    startDate.setHours(0, 0, 0, 0);
    where.createdAt = { ...(where.createdAt || {}), gte: startDate };
  }

  if (endDate && !Number.isNaN(endDate.getTime())) {
    endDate.setHours(23, 59, 59, 999);
    where.createdAt = { ...(where.createdAt || {}), lte: endDate };
  }

  if (filters.search) {
    where.OR = [
      { withdrawalNumber: { contains: filters.search, mode: "insensitive" } },
      { note: { contains: filters.search, mode: "insensitive" } },
      { requestedBy: { name: { contains: filters.search, mode: "insensitive" } } },
      { branch: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (options.mineOnly) {
    where.requestedById = user.id;
  }

  return where;
}

function summarizeWithdrawals(withdrawals = []) {
  return withdrawals.reduce(
    (acc, item) => {
      const amount = Number(item.amount || 0);
      acc.totalCount += 1;
      acc.totalAmount += amount;
      acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1;
      if (item.status === "REQUESTED") acc.requestedAmount += amount;
      if (item.status === "OTP_ISSUED") acc.otpIssuedAmount += amount;
      if (item.status === "COMPLETED") acc.completedAmount += amount;
      return acc;
    },
    {
      totalCount: 0,
      totalAmount: 0,
      requestedAmount: 0,
      otpIssuedAmount: 0,
      completedAmount: 0,
      byStatus: {
        REQUESTED: 0,
        OTP_ISSUED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        EXPIRED: 0,
      },
    }
  );
}

function includeWithdrawalRelations() {
  return {
    branch: true,
    cashSession: {
      include: {
        branch: true,
        user: true,
      },
    },
    requestedBy: true,
    issuedBy: true,
    verifiedBy: true,
  };
}

function serializeWithdrawal(withdrawal) {
  return {
    ...withdrawal,
    amount: Number(withdrawal.amount || 0),
  };
}

async function getOpenSessionOrThrow(user, branchContext) {
  const effective = await getEffectiveBranchForUser(user, branchContext?.branchId || null);
  const activeSession = await prisma.cashSession.findFirst({
    where: {
      userId: user.id,
      branchId: effective.branchId || undefined,
      status: "OPEN",
    },
    include: {
      branch: true,
      user: true,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (!activeSession) {
    const error = new Error("Setoran cash hanya bisa dibuat saat shift aktif");
    error.statusCode = 400;
    throw error;
  }

  return { effective, activeSession };
}

async function getCompletedWithdrawalTotalBySession(cashSessionId) {
  if (!cashSessionId) return 0;

  const withdrawals = await prisma.cashWithdrawal.findMany({
    where: {
      cashSessionId,
      status: "COMPLETED",
    },
    select: {
      amount: true,
    },
  });

  return withdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
}

async function getWithdrawalDashboard(user, branchContext, query = {}) {
  // Read minimum cash setting
  const minCashSetting = await prisma.systemSetting.findFirst({
    where: { key: "cash_minimum_outlet", scope: "GLOBAL" },
  });
  const minCash = Number(minCashSetting?.value || 50000);

  const { effective, activeSession } = await getOpenSessionOrThrow(user, branchContext).catch(async (err) => {
    const branch = await getEffectiveBranchForUser(user, branchContext?.branchId || null);
    const withdrawals = await prisma.cashWithdrawal.findMany({
      where: buildWithdrawalWhere(user, branchContext, query, {
        mineOnly: true,
      }),
      include: includeWithdrawalRelations(),
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      effective: branch,
      activeSession: null,
      fallbackWithdrawals: withdrawals,
      fallbackSummary: summarizeWithdrawals(withdrawals),
    };
  });

  if (!activeSession) {
    return {
      branch: effective.branch || null,
      activeSession: null,
      minCash,
      todayCashSales: 0,
      todayExpenses: 0,
      withdrawals: [],
      summary: summarizeWithdrawals([]),
    };
  }

  const withdrawals = await prisma.cashWithdrawal.findMany({
    where: {
      branchId: activeSession.branchId,
    },
    include: includeWithdrawalRelations(),
    orderBy: {
      createdAt: "desc",
    },
  });

  // Hitung penjualan cash dan expense hari ini di session aktif
  const cashTransactions = await prisma.transaction.findMany({
    where: {
      cashSessionId: activeSession.id,
      status: "COMPLETED",
      paymentMethod: "CASH",
    },
    select: { totalAmount: true },
  });
  const todayCashSales = cashTransactions.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  const sessionExpenses = await prisma.outletExpense.findMany({
    where: {
      cashSessionId: activeSession.id,
      status: "POSTED",
    },
    select: { totalAmount: true },
  });
  const todayExpenses = sessionExpenses.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

  return {
    branch: activeSession.branch || effective.branch || null,
    activeSession,
    minCash,
    todayCashSales,
    todayExpenses,
    withdrawals: withdrawals.map(serializeWithdrawal),
    summary: summarizeWithdrawals(withdrawals),
  };
}

async function listCashWithdrawals(user, branchContext, query = {}) {
  const { parsePagination } = require("../../core/utils/pagination");
  const { page, limit, skip } = parsePagination(query);
  const where = buildWithdrawalWhere(user, branchContext, query);

  const [withdrawals, total] = await Promise.all([
    prisma.cashWithdrawal.findMany({
      where,
      skip,
      take: limit,
      include: includeWithdrawalRelations(),
      orderBy: { createdAt: "desc" },
    }),
    prisma.cashWithdrawal.count({ where }),
  ]);

  return {
    filters: normalizeFilters(query),
    summary: summarizeWithdrawals(withdrawals),
    items: withdrawals.map(serializeWithdrawal),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function listMyCashWithdrawals(user, branchContext) {
  const { activeSession } = await getOpenSessionOrThrow(user, branchContext).catch(async () => {
    return { activeSession: null };
  });

  if (!activeSession) {
    return {
      branch: null,
      activeSession: null,
      summary: summarizeWithdrawals([]),
      items: [],
    };
  }

  const withdrawals = await prisma.cashWithdrawal.findMany({
    where: {
      cashSessionId: activeSession.id,
      requestedById: user.id,
    },
    include: includeWithdrawalRelations(),
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    branch: activeSession.branch,
    activeSession,
    summary: summarizeWithdrawals(withdrawals),
    items: withdrawals.map(serializeWithdrawal),
  };
}

async function requestCashWithdrawal(user, payload, branchContext) {
  const { activeSession } = await getOpenSessionOrThrow(user, branchContext);
  const amount = Number(payload.amount || 0);
  const note = payload.note ? String(payload.note).trim() : null;

  if (!(amount > 0)) {
    const error = new Error("Nominal setoran harus lebih besar dari 0");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date();

  const withdrawal = await prisma.$transaction(async (tx) => {
    const created = await tx.cashWithdrawal.create({
      data: {
        withdrawalNumber: buildWithdrawalNumber(createdAt),
        branchId: activeSession.branchId,
        cashSessionId: activeSession.id,
        requestedById: user.id,
        amount,
        note,
        status: "REQUESTED",
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "CREATE",
      entity: "CashWithdrawal",
      entityId: created.id,
      description: `Crew mengajukan setoran cash sebesar Rp ${amount.toLocaleString("id-ID")}`,
      metadata: { amount, note },
      branchId: activeSession.branchId,
      performedById: user.id,
      client: tx,
    });

    return created;
  });

  return {
    withdrawal: serializeWithdrawal(withdrawal),
    activeSession,
  };
}

async function getBranchAvailableCash(branchId) {
  // Find minimum cash setting
  const minCashSetting = await prisma.systemSetting.findFirst({
    where: { key: "cash_minimum_outlet", scope: "GLOBAL" },
  });
  const minCash = Number(minCashSetting?.value || 50000);

  // Lazy require to avoid circular dependency
  const { getBranchCashBalance } = require("../cash-sessions/cashSession.service");
  const available = await getBranchCashBalance(branchId);

  return {
    available,
    minCash,
    withdrawable: Math.max(0, available - minCash),
  };
}

async function createWithdrawalByManagement(user, payload) {
  const { branchId, amount, note } = payload;
  if (!branchId || !(amount > 0)) {
    const error = new Error("Branch dan nominal wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  // Check available cash vs minimum cash
  const cashInfo = await getBranchAvailableCash(branchId);
  if (cashInfo.withdrawable !== null && Number(amount) > cashInfo.withdrawable) {
    const error = new Error(
      `Penarikan tidak bisa diproses. Kas tersedia: Rp ${Number(cashInfo.available || 0).toLocaleString("id-ID")}, ` +
      `minimal kas: Rp ${cashInfo.minCash.toLocaleString("id-ID")}, ` +
      `maksimal penarikan: Rp ${cashInfo.withdrawable.toLocaleString("id-ID")}`
    );
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date();

  const withdrawal = await prisma.$transaction(async (tx) => {
    const activeSession = await tx.cashSession.findFirst({
      where: { branchId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const created = await tx.cashWithdrawal.create({
      data: {
        withdrawalNumber: buildWithdrawalNumber(createdAt),
        branchId,
        cashSessionId: activeSession?.id || null,
        requestedById: user.id,
        amount,
        note: note || null,
        status: "REQUESTED",
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "CREATE_WITHDRAWAL",
      entity: "CashWithdrawal",
      entityId: created.id,
      description: `Manajemen membuat penarikan cash Rp ${amount.toLocaleString("id-ID")} di ${created.branch?.name || branchId}`,
      metadata: { amount, branchId },
      branchId,
      performedById: user.id,
      client: tx,
    });

    return tx.cashWithdrawal.findUnique({
      where: { id: created.id },
      include: includeWithdrawalRelations(),
    });
  });

  return {
    withdrawal: serializeWithdrawal(withdrawal),
  };
}

async function generateOtpForWithdrawal(user, withdrawalId, branchContext) {
  const withdrawal = await prisma.cashWithdrawal.findFirst({
    where: {
      id: withdrawalId,
      branchId: branchContext?.branchId || user.branchId || undefined,
      status: "REQUESTED",
    },
  });

  if (!withdrawal) {
    const error = new Error("Penarikan tidak ditemukan atau sudah diproses");
    error.statusCode = 404;
    throw error;
  }

  const otpCode = generateOtpCode();
  const otpSalt = crypto.randomBytes(8).toString("hex");
  const otpHash = hashOtp(otpCode, otpSalt, withdrawal.id);
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cashWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "OTP_ISSUED",
        otpHash,
        otpSalt,
        otpIssuedAt: new Date(),
        otpExpiresAt,
        issuedById: user.id,
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "GENERATE_OTP",
      entity: "CashWithdrawal",
      entityId: result.id,
      description: `Crew membuat OTP untuk penarikan ${result.withdrawalNumber}`,
      metadata: { withdrawalNumber: result.withdrawalNumber, amount: Number(result.amount || 0) },
      branchId: result.branchId,
      performedById: user.id,
      client: tx,
    });

    return result;
  });

  return {
    withdrawal: serializeWithdrawal(updated),
    otpExpiresAt,
  };
}

async function issueCashWithdrawalOtp(user, withdrawalId, branchContext) {
  const withdrawal = await prisma.cashWithdrawal.findFirst({
    where: {
      id: withdrawalId,
      ...(branchContext?.branchId ? { branchId: branchContext.branchId } : {}),
    },
    include: includeWithdrawalRelations(),
  });

  if (!withdrawal) {
    const error = new Error("Setoran cash tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (withdrawal.status === "COMPLETED") {
    const error = new Error("Setoran cash sudah selesai");
    error.statusCode = 409;
    throw error;
  }

  if (withdrawal.status === "CANCELLED") {
    const error = new Error("Setoran cash sudah dibatalkan");
    error.statusCode = 409;
    throw error;
  }

  const otpCode = generateOtpCode();
  const otpSalt = crypto.randomBytes(8).toString("hex");
  const otpHash = hashOtp(otpCode, otpSalt, withdrawal.id);
  const otpIssuedAt = new Date();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cashWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "OTP_ISSUED",
        otpHash,
        otpSalt,
        otpIssuedAt,
        otpExpiresAt,
        issuedById: user.id,
        cancelledAt: null,
        cancelReason: null,
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "ISSUE_OTP",
      entity: "CashWithdrawal",
      entityId: result.id,
      description: `Owner menerbitkan OTP untuk setoran cash ${result.withdrawalNumber}`,
      metadata: {
        withdrawalNumber: result.withdrawalNumber,
        amount: Number(result.amount || 0),
        otpExpiresAt,
      },
      branchId: result.branchId,
      performedById: user.id,
      client: tx,
    });

    return result;
  });

  return {
    withdrawal: serializeWithdrawal(updated),
    otpCode,
    otpExpiresAt,
  };
}

async function verifyCashWithdrawalOtp(user, withdrawalId, payload, branchContext) {
  const otp = String(payload.otp || "").trim();
  if (!otp) {
    const error = new Error("OTP wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const withdrawal = await prisma.cashWithdrawal.findFirst({
    where: {
      id: withdrawalId,
      ...(branchContext?.branchId ? { branchId: branchContext.branchId } : {}),
    },
    include: includeWithdrawalRelations(),
  });

  if (!withdrawal) {
    const error = new Error("Setoran cash tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (withdrawal.status === "COMPLETED") {
    return { withdrawal: serializeWithdrawal(withdrawal) };
  }

  if (withdrawal.status !== "OTP_ISSUED") {
    const error = new Error("OTP belum diterbitkan");
    error.statusCode = 409;
    throw error;
  }

  if (withdrawal.otpExpiresAt && withdrawal.otpExpiresAt < new Date()) {
    await prisma.cashWithdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "EXPIRED" },
    });
    const error = new Error("OTP sudah kedaluwarsa.");
    error.statusCode = 409;
    throw error;
  }

  const expectedHash = hashOtp(otp, withdrawal.otpSalt || "", withdrawal.id);
  if (expectedHash !== withdrawal.otpHash) {
    const error = new Error("OTP tidak sesuai");
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cashWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "COMPLETED",
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "COMPLETE",
      entity: "CashWithdrawal",
      entityId: result.id,
      description: `${result.withdrawalNumber} — penarikan cash Rp ${Number(result.amount || 0).toLocaleString("id-ID")} selesai`,
      metadata: {
        withdrawalNumber: result.withdrawalNumber,
        amount: Number(result.amount || 0),
      },
      branchId: result.branchId,
      performedById: user.id,
      client: tx,
    });

    return result;
  });

  return {
    withdrawal: serializeWithdrawal(updated),
  };
}

async function getPendingWithdrawalsForCrew(user, branchContext) {
  const branchId = branchContext?.branchId || user.branchId;
  if (!branchId) return { items: [] };

  const withdrawals = await prisma.cashWithdrawal.findMany({
    where: {
      branchId,
      status: { in: ["OTP_ISSUED", "REQUESTED"] },
    },
    include: includeWithdrawalRelations(),
    orderBy: { createdAt: "desc" },
  });

  return {
    items: withdrawals.map(serializeWithdrawal),
  };
}

async function cancelCashWithdrawal(user, withdrawalId, payload, branchContext) {
  const withdrawal = await prisma.cashWithdrawal.findFirst({
    where: {
      id: withdrawalId,
      ...(branchContext?.branchId ? { branchId: branchContext.branchId } : {}),
    },
    include: includeWithdrawalRelations(),
  });

  if (!withdrawal) {
    const error = new Error("Setoran cash tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (withdrawal.status === "COMPLETED") {
    const error = new Error("Setoran cash yang sudah selesai tidak bisa dibatalkan");
    error.statusCode = 409;
    throw error;
  }

  const cancelReason = payload.cancelReason ? String(payload.cancelReason).trim() : null;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cashWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason,
      },
      include: includeWithdrawalRelations(),
    });

    await createAuditLog({
      action: "CANCEL",
      entity: "CashWithdrawal",
      entityId: result.id,
      description: `Setoran cash ${result.withdrawalNumber} dibatalkan`,
      metadata: {
        withdrawalNumber: result.withdrawalNumber,
        amount: Number(result.amount || 0),
        cancelReason,
      },
      branchId: result.branchId,
      performedById: user.id,
      client: tx,
    });

    return result;
  });

  return {
    withdrawal: serializeWithdrawal(updated),
  };
}

module.exports = {
  buildWithdrawalWhere,
  cancelCashWithdrawal,
  createWithdrawalByManagement,
  generateOtpCode,
  generateOtpForWithdrawal,
  getBranchAvailableCash,
  getCompletedWithdrawalTotalBySession,
  getPendingWithdrawalsForCrew,
  getWithdrawalDashboard,
  hashOtp,
  issueCashWithdrawalOtp,
  listCashWithdrawals,
  listMyCashWithdrawals,
  requestCashWithdrawal,
  summarizeWithdrawals,
  verifyCashWithdrawalOtp,
};
