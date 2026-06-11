const prisma = require("../../core/config/prisma");

function getDistanceFromLatLng(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveBranchId(user, branchContext) {
  return branchContext?.branchId || user.branchId || null;
}

/**
 * Hitung saldo kas aktual suatu branch.
 *
 * Logic: Cari session terakhir (open atau closed).
 * - Jika OPEN: openingCash + cashSales(session ini) - withdrawals(session ini) - expenses(session ini)
 * - Jika CLOSED: expectedCash atau closingCash dari session terakhir
 * - Jika tidak ada session: 0
 *
 * Tidak menjumlah semua session karena openingCash shift baru adalah carry-over
 * dari shift sebelumnya (bukan cash baru).
 */
async function getBranchCashBalance(branchId) {
  if (!branchId) return 0;

  const latestSession = await prisma.cashSession.findFirst({
    where: { branchId },
    orderBy: { openedAt: "desc" },
    include: {
      transactions: {
        where: { status: "COMPLETED", paymentMethod: "CASH" },
        select: { totalAmount: true },
      },
      outletExpenses: {
        where: { status: "POSTED" },
        select: { totalAmount: true },
      },
    },
  });

  if (!latestSession) return 0;

  if (latestSession.status === "CLOSED") {
    // Pakai expectedCash atau closingCash yang sudah tersimpan saat close
    return Number(latestSession.expectedCash ?? latestSession.closingCash ?? 0);
  }

  // Session masih OPEN — hitung realtime
  const cashSalesTotal = latestSession.transactions.reduce(
    (sum, t) => sum + Number(t.totalAmount || 0), 0
  );
  const expenseTotal = latestSession.outletExpenses.reduce(
    (sum, e) => sum + Number(e.totalAmount || 0), 0
  );


  const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
  const withdrawalTotal = await getCompletedWithdrawalTotalBySession(latestSession.id);

  return Number(latestSession.openingCash || 0) + cashSalesTotal - expenseTotal - withdrawalTotal;
}

/**
 * Hitung carry-over balance dari session terakhir yang closed.
 * Ini digunakan sebagai opening balance default untuk session baru.
 */
async function getLastCarryOverBalance(branchId) {
  if (!branchId) return 0;

  const lastClosedSession = await prisma.cashSession.findFirst({
    where: { branchId, status: "CLOSED" },
    orderBy: { closedAt: "desc" },
  });

  if (!lastClosedSession) return 0;

  // expectedCash dari session terakhir = sisa cash aktual
  // Jika closingCash diinput, pakai closingCash (lebih akurat karena fisik)
  // Jika tidak, pakai expectedCash
  if (lastClosedSession.closingCash !== null && lastClosedSession.closingCash !== undefined) {
    return Number(lastClosedSession.closingCash);
  }
  if (lastClosedSession.expectedCash !== null && lastClosedSession.expectedCash !== undefined) {
    return Number(lastClosedSession.expectedCash);
  }

  // Fallback: hitung manual
  const cashTransactions = await prisma.transaction.findMany({
    where: {
      branchId,
      cashSessionId: lastClosedSession.id,
      status: "COMPLETED",
      paymentMethod: "CASH",
    },
    select: { totalAmount: true },
  });
  const expenses = await prisma.outletExpense.findMany({
    where: {
      branchId,
      cashSessionId: lastClosedSession.id,
      status: "POSTED",
    },
    select: { totalAmount: true },
  });
  // Lazy require to avoid circular dependency
  const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
  const withdrawals = await getCompletedWithdrawalTotalBySession(lastClosedSession.id);

  const cashSales = cashTransactions.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.totalAmount || 0), 0);

  return Number(lastClosedSession.openingCash || 0) + cashSales - expenseTotal - withdrawals;
}

async function getActiveSessionForUser(userId) {
  return prisma.cashSession.findFirst({
    where: {
      userId,
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
}

async function getActiveSessionForBranch(branchId) {
  return prisma.cashSession.findFirst({
    where: {
      branchId,
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
}

async function getOpeningStockOpname(branchId, date) {
  return prisma.stockOpname.findFirst({
    where: {
      branchId,
      opnameDate: date,
      kind: "OPENING",
      isCompleted: true,
    },
  });
}

async function getClosingStockOpname(branchId, date) {
  return prisma.stockOpname.findFirst({
    where: {
      branchId,
      opnameDate: date,
      kind: "CLOSING",
      isCompleted: true,
    },
  });
}

exports.getActiveSession = async (user, branchContext) => {
  const branchId = resolveBranchId(user, branchContext);
  const activeSession = await getActiveSessionForUser(user.id);

  if (!activeSession) {
    return null;
  }

  if (branchId && activeSession.branchId !== branchId) {
    return activeSession;
  }

  return activeSession;
};

exports.openSession = async (user, payload, branchContext) => {
  const branchId = resolveBranchId(user, branchContext);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!branchId) {
    const error = new Error("Branch belum dipilih");
    error.statusCode = 400;
    throw error;
  }

  // Cek setting GPS — owner bisa nonaktifkan global/per branch
  let gpsRequired = true;
  try {
    const branchSetting = await prisma.systemSetting.findFirst({
      where: { key: "gps_required_openshift", branchId, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    if (branchSetting) {
      gpsRequired = branchSetting.value !== "false";
    } else {
      const globalSetting = await prisma.systemSetting.findFirst({
        where: { key: "gps_required_openshift", branchId: null, isActive: true },
        orderBy: { updatedAt: "desc" },
      });
      if (globalSetting) gpsRequired = globalSetting.value !== "false";
    }
  } catch { /* default: required */ }


  if (gpsRequired) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { lat: true, lng: true, name: true } });
    if (branch?.lat && branch?.lng) {
      const userLat = Number(payload.lat);
      const userLng = Number(payload.lng);
      if (isNaN(userLat) || isNaN(userLng) || !userLat || !userLng) {
        const e = new Error("Aktifkan GPS. Kami tidak menemukan lokasi Anda.");
        e.statusCode = 400; throw e;
      }
      const d = getDistanceFromLatLng(userLat, userLng, branch.lat, branch.lng);
      if (d > 20) {
        const e = new Error("Anda berada " + Math.round(d) + "m dari " + branch.name + ". Maksimal 20m.");
        e.statusCode = 400; throw e;
      }
    }
  }

  const activeSession = await getActiveSessionForUser(user.id);
  if (activeSession) {
    return activeSession;
  }

  const branchActiveSession = await getActiveSessionForBranch(branchId);
  if (branchActiveSession) {
    const error = new Error("Branch ini sudah memiliki shift aktif");
    error.statusCode = 400;
    throw error;
  }

  // Setiap shift dimulai dari 0 — tidak ada carry-over dari shift sebelumnya.
  // Crew bisa set openingCash manual via payload jika perlu.
  const openingCash = Number(payload.openingCash || 0);

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.create({
      data: {
        userId: user.id,
        branchId,
        openingCash,
        status: "OPEN",
      },
      include: {
        branch: true,
        user: true,
      },
    });

    await tx.crewAttendance.upsert({
      where: {
        userId_attendanceDate: {
          userId: user.id,
          attendanceDate: today,
        },
      },
      update: {
        branchId,
        checkInAt: new Date(),
        status: "PRESENT",
      },
      create: {
        branchId,
        userId: user.id,
        attendanceDate: today,
        checkInAt: new Date(),
        status: "PRESENT",
      },
    });

    return session;
  });
};

exports.closeSession = async (user, payload, branchContext) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeSession = await prisma.cashSession.findFirst({
    where: {
      userId: user.id,
      status: "OPEN",
    },
    include: {
      transactions: true,
      outletExpenses: true,
      branch: true,
      user: true,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (!activeSession) {
    const error = new Error("Tidak ada shift aktif");
    error.statusCode = 400;
    throw error;
  }

  const branchId = activeSession.branchId;
  const cashTransactions = activeSession.transactions.filter(
    (trx) => trx.paymentMethod === "CASH" && trx.status === "COMPLETED"
  );

  const expenseTotal = activeSession.outletExpenses
    .filter((expense) => expense.status === "POSTED")
    .reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
  const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
  const withdrawalTotal = await getCompletedWithdrawalTotalBySession(activeSession.id);

  const expectedCash =
    activeSession.openingCash +
    cashTransactions.reduce((sum, trx) => sum + trx.totalAmount, 0) -
    expenseTotal -
    withdrawalTotal;

  const closingCash = Number(payload.closingCash || 0);
  const cashDifference = closingCash - expectedCash;

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.update({
      where: {
        id: activeSession.id,
      },
      data: {
        closingCash,
        expectedCash,
        status: "CLOSED",
        closedAt: new Date(),
      },
      include: {
        branch: true,
        user: true,
        transactions: true,
      },
    });

    await tx.crewAttendance.updateMany({
      where: {
        userId: user.id,
        branchId,
        attendanceDate: today,
      },
      data: {
        checkOutAt: new Date(),
      },
    });

    return {
      ...session,
      cashDifference,
    };
  });
};

exports.getBranchCashBalance = getBranchCashBalance;
