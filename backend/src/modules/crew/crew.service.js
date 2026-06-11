const prisma = require("../../core/config/prisma");
const { getEffectiveBranchForUser, getTodayRange } = require("../../core/services/branchAccess.service");
const { getCompletedWithdrawalTotalBySession } = require("../cash-withdrawals/cashWithdrawal.service");
const depotTransferService = require("../depot-transfers/depotTransfer.service");

const BONUS_PER_ATTENDANCE = 0;
const BONUS_PER_PCS = 250;
const BONUS_PER_EXTRA_SAUCE = 250;

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function parseMonthInput(monthInput) {
  if (!monthInput || typeof monthInput !== "string") {
    return new Date();
  }

  const normalized = monthInput.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return new Date();
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(year, monthIndex, 1);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function toDayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getDayStatus({ totalSales, corePcs, targetMinPcs }) {
  if (!Number(totalSales || 0)) {
    return "NO_SALES";
  }

  if (Number(corePcs || 0) >= Number(targetMinPcs || 0)) {
    return "TARGET_HIT";
  }

  return "BELOW_TARGET";
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

async function getBranchOfToday(user, branchContext) {
  const effective = await getEffectiveBranchForUser(user, branchContext?.branchId || null);
  return effective;
}

async function getTodayBranchSales(user, branchContext) {
  const effective = await getBranchOfToday(user, branchContext);

  if (!effective.branchId) {
    return {
      scope: effective.scope,
      branch: null,
      summary: {
        totalTransactions: 0,
        totalSales: 0,
        totalPcs: 0,
        totalCash: 0,
        totalCashEnd: 0,
        paymentBreakdown: {},
      },
      items: [],
      latestSession: null,
    };
  }

  const { start, end } = getTodayRange();

  const [transactions, latestSession] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        branchId: effective.branchId,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETED",
      },
      include: {
        items: true,
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.cashSession.findFirst({
      where: {
        branchId: effective.branchId,
        openedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        outletExpenses: true,
      },
      orderBy: {
        openedAt: "desc",
      },
    }),
  ]);

  const totalSales = transactions.reduce((sum, trx) => sum + trx.totalAmount, 0);
  const totalPcs = transactions.reduce((sum, trx) => sum + trx.totalPcs, 0);
  const paymentBreakdown = transactions.reduce(
    (acc, trx) => {
      const method = String(trx.paymentMethod || "UNKNOWN").toUpperCase();
      const amount = Number(trx.totalAmount || 0);

      if (!acc[method]) {
        acc[method] = 0;
      }

      acc[method] += amount;
      return acc;
    },
    {
      CASH: 0,
      QRIS: 0,
      GOFOOD: 0,
      GRABFOOD: 0,
      SHOPEEFOOD: 0,
    }
  );

  const cashSalesTotal = Number(paymentBreakdown.CASH || 0);
  const openingCash = Number(latestSession?.openingCash || 0);
  const expenseTotal = Array.isArray(latestSession?.outletExpenses)
    ? latestSession.outletExpenses
        .filter((expense) => expense.status === "POSTED")
        .reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0)
    : 0;
  const withdrawalTotal = await getCompletedWithdrawalTotalBySession(latestSession?.id);
  const totalCashEnd =
    latestSession?.status === "CLOSED"
      ? Number(latestSession?.expectedCash ?? latestSession?.closingCash ?? 0)
      : openingCash + cashSalesTotal - expenseTotal - withdrawalTotal;

  return {
    scope: effective.scope,
    branch: effective.branch,
    summary: {
      totalTransactions: transactions.length,
      totalSales,
      totalPcs,
      totalCash: cashSalesTotal,
      totalCashEnd,
      paymentBreakdown,
    },
    items: transactions,
    latestSession,
  };
}

async function getAttendanceGate(user, branchContext) {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();
  const activeSession = await prisma.cashSession.findFirst({
    where: {
      userId: user.id,
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

  const gateBranchId = activeSession?.branchId || effective.branchId;

  if (!gateBranchId) {
    return {
      branch: null,
      openingStockOpnameCompleted: false,
      closingStockOpnameCompleted: false,
      openingStockOpname: null,
      closingStockOpname: null,
      attendanceToday: null,
      activeSession: null,
      canOpenShift: false,
      canCloseShift: false,
    };
  }

  const [openingStockOpname, closingStockOpname, attendanceToday] = await Promise.all([
    prisma.stockOpname.findFirst({
      where: {
        branchId: gateBranchId,
        kind: "OPENING",
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        performedBy: true,
        branch: true,
      },
    }),
    prisma.stockOpname.findFirst({
      where: {
        branchId: gateBranchId,
        kind: "CLOSING",
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        performedBy: true,
        branch: true,
      },
    }),
    prisma.crewAttendance.findFirst({
      where: {
        userId: user.id,
        branchId: gateBranchId,
        attendanceDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        branch: true,
        user: true,
      },
    }),
  ]);

  return {
    branch: activeSession?.branch || effective.branch,
    openingStockOpnameCompleted: !!openingStockOpname?.isCompleted,
    closingStockOpnameCompleted: !!closingStockOpname?.isCompleted,
    openingStockOpname,
    closingStockOpname,
    attendanceToday,
    activeSession,
    shiftOpen: !!activeSession,
    canOpenShift: !!openingStockOpname?.isCompleted && !activeSession,
    canCloseShift: !!activeSession && !!closingStockOpname?.isCompleted,
  };
}

async function getStockOpnameForm(user, branchContext, kind = "OPENING") {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();

  if (!effective.branchId) {
    return {
      branch: null,
      date: start,
      items: [],
      existing: null,
    };
  }

  const isOpening = kind === "OPENING";
  const [activeSessionCount, completedSalesCount] = isOpening
    ? await Promise.all([
        prisma.cashSession.count({
          where: {
            branchId: effective.branchId,
            status: "OPEN",
            openedAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.transaction.count({
          where: {
            branchId: effective.branchId,
            status: "COMPLETED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
      ])
    : [0, 0];

  if (isOpening && (activeSessionCount > 0 || completedSalesCount > 0)) {
    const error = new Error(
      "Opening stock opname sudah terkunci karena shift sudah berjalan atau sudah ada sales hari ini."
    );
    error.statusCode = 409;
    throw error;
  }

  const [branchItems, existing] = await Promise.all([
    prisma.branchInventoryItem.findMany({
      where: {
        branchId: effective.branchId,
        isActive: true,
        isOpnameRequired: true,
        inventoryItem: {
          isActive: true,
          isOpnameRequired: true,
        },
      },
      include: {
        inventoryItem: true,
      },
    }),
    prisma.stockOpname.findFirst({
      where: {
        branchId: effective.branchId,
        kind,
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    }),
  ]);

  branchItems.sort((a, b) => {
    const typeCompare = String(a.inventoryItem.type).localeCompare(String(b.inventoryItem.type));
    if (typeCompare !== 0) return typeCompare;
    return String(a.inventoryItem.name).localeCompare(String(b.inventoryItem.name));
  });

  return {
    branch: effective.branch,
    kind,
    date: start,
    items: branchItems.map((branchItem) => {
      const opnameItem = existing?.items?.find(
        (item) => item.inventoryItemId === branchItem.inventoryItemId
      );

      return {
        branchInventoryItemId: branchItem.id,
        inventoryItemId: branchItem.inventoryItemId,
        inventoryItem: branchItem.inventoryItem,
        currentStock: Number(branchItem.currentStock || 0),
        minStock: branchItem.minStock ? Number(branchItem.minStock) : null,
        maxStock: branchItem.maxStock ? Number(branchItem.maxStock) : null,
        isOpnameRequired: branchItem.isOpnameRequired,
        countedQty: opnameItem ? Number(opnameItem.countedQty || 0) : "",
        notes: opnameItem?.notes || "",
      };
    }),
    existing,
  };
}

async function getMonthlyCrewPerformance(user, query = {}) {
  const baseDate = parseMonthInput(query.month);
  const { start, end } = getMonthRange(baseDate);

  // Resolve branch for bonus settings (failsafe when called without branchContext)
  let userBranchId = null;
  try {
    const effective = await getEffectiveBranchForUser(user);
    userBranchId = effective?.branchId || null;
  } catch (_) { /* branch fallback */ }

  const targetMinPcs = Math.max(1, Number(await getSystemSettingValue("crew_bonus_min_pcs", 25, userBranchId)));
  const bonusPerPcs = Math.max(0, Number(await getSystemSettingValue("crew_bonus_per_pcs", BONUS_PER_PCS, userBranchId)));
  const bonusPerExtraSauce = Math.max(
    0,
    Number(await getSystemSettingValue("crew_bonus_extra_sauce", BONUS_PER_EXTRA_SAUCE, userBranchId))
  );

  const [transactions, attendances] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        cashierId: user.id,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETED",
      },
      include: {
        branch: true,
        items: true,
      },
    }),
    prisma.crewAttendance.findMany({
      where: {
        userId: user.id,
        attendanceDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        branch: true,
      },
    }),
  ]);

  const attendanceMap = new Map();
  for (const item of attendances) {
    const dayKey = toDayKey(item.attendanceDate);
    attendanceMap.set(dayKey, (attendanceMap.get(dayKey) || 0) + 1);
  }

  const dailyMap = new Map();
  const getDailyBucket = (dateKey) => {
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        branches: new Set(),
        totalTransactions: 0,
        totalSales: 0,
        totalPcs: 0,
        extraSaucePcs: 0,
        corePcs: 0,
        attendanceCount: 0,
      });
    }

    return dailyMap.get(dateKey);
  };

  for (const trx of transactions) {
    const dayKey = toDayKey(trx.createdAt);
    const bucket = getDailyBucket(dayKey);
    bucket.branches.add(trx.branch?.name || "-");
    const extraSaucePcs = Array.isArray(trx.items)
      ? trx.items.reduce((sum, item) => {
          const name = String(item.productName || item.product?.name || "").toLowerCase();
          const isExtraSauce = name.includes("sauce") || name.includes("saos") || name.includes("sos");
          return sum + (isExtraSauce ? Number(item.pcs || 0) : 0);
        }, 0)
      : 0;

    bucket.totalTransactions += 1;
    bucket.totalSales += Number(trx.totalAmount || 0);
    bucket.totalPcs += Number(trx.totalPcs || 0);
    bucket.extraSaucePcs += extraSaucePcs;
    bucket.corePcs += Math.max(0, Number(trx.totalPcs || 0) - extraSaucePcs);
  }

  for (const [dayKey, count] of attendanceMap.entries()) {
    const bucket = getDailyBucket(dayKey);
    bucket.attendanceCount = count;
  }

  const totalPcs = transactions.reduce((sum, trx) => sum + trx.totalPcs, 0);
  const totalSales = transactions.reduce((sum, trx) => sum + trx.totalAmount, 0);
  const totalTransactions = transactions.length;
  const attendanceCount = attendances.filter((item) => item.checkInAt).length;

  const calendarDays = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayKey = toDayKey(cursor);
    const bucket = dailyMap.get(dayKey) || {
      date: dayKey,
      branches: new Set(),
      totalTransactions: 0,
      totalSales: 0,
      totalPcs: 0,
      extraSaucePcs: 0,
      corePcs: 0,
      attendanceCount: attendanceMap.get(dayKey) || 0,
    };

    const dateObj = new Date(dayKey);
    const day = {
      ...bucket,
      branches: Array.from(bucket.branches || []),
      dayOfMonth: dateObj.getDate(),
      label: dateObj.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" }),
      status: getDayStatus({
        totalSales: bucket.totalSales,
        corePcs: bucket.corePcs,
        targetMinPcs,
      }),
    };

    calendarDays.push(day);
    cursor.setDate(cursor.getDate() + 1);
  }

  const pcsBonus = calendarDays.reduce(
    (sum, day) => sum + Math.max(0, Number(day.corePcs || 0) - targetMinPcs) * bonusPerPcs,
    0
  );
  const extraSauceBonus = calendarDays.reduce(
    (sum, day) => sum + Number(day.extraSaucePcs || 0) * bonusPerExtraSauce,
    0
  );
  const estimatedBonus = pcsBonus + extraSauceBonus;

  return {
    period: {
      month: start.toISOString().slice(0, 7),
      start,
      end,
      monthInput: start.toISOString().slice(0, 7),
    },
    metrics: {
      attendanceCount,
      totalTransactions,
      totalPcs,
      totalSales,
      estimatedBonus,
      bonusBreakdown: {
        pcsBonus,
        extraSauceBonus,
      },
    },
    calendar: {
      targetMinPcs,
      bonusPerPcs,
      bonusPerExtraSauce,
      days: calendarDays,
    },
  };
}

async function getCrewDashboard(user, branchContext) {
  const [todaySales, attendanceGate, monthlyPerformance] = await Promise.all([
    getTodayBranchSales(user, branchContext),
    getAttendanceGate(user, branchContext),
    getMonthlyCrewPerformance(user),
  ]);

  return {
    todaySales,
    attendanceGate,
    monthlyPerformance,
  };
}

async function completeStockOpname(user, payload, branchContext) {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();
  const kind = payload.kind === "CLOSING" ? "CLOSING" : "OPENING";
  const isOpening = kind === "OPENING";

  if (!effective.branchId) {
    const error = new Error("Branch tidak ditemukan");
    error.statusCode = 400;
    throw error;
  }

  const [existing, activeSessionCount, completedSalesCount] = await Promise.all([
    prisma.stockOpname.findFirst({
      where: {
        branchId: effective.branchId,
        kind,
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
    }),
    isOpening
      ? prisma.cashSession.count({
          where: {
            branchId: effective.branchId,
            status: "OPEN",
            openedAt: {
              gte: start,
              lte: end,
            },
          },
        })
      : Promise.resolve(0),
    isOpening
      ? prisma.transaction.count({
          where: {
            branchId: effective.branchId,
            status: "COMPLETED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        })
      : Promise.resolve(0),
  ]);

  if (isOpening && (activeSessionCount > 0 || completedSalesCount > 0)) {
    const error = new Error(
      "Opening stock opname sudah terkunci karena shift sudah berjalan atau sudah ada sales hari ini."
    );
    error.statusCode = 409;
    throw error;
  }

  if (isOpening && existing?.isCompleted) {
    const error = new Error("Opening stock opname hari ini sudah selesai dan tidak bisa diubah lagi.");
    error.statusCode = 409;
    throw error;
  }

  const requiredItems = await prisma.branchInventoryItem.findMany({
    where: {
      branchId: effective.branchId,
      isActive: true,
      isOpnameRequired: true,
      inventoryItem: {
        isActive: true,
        isOpnameRequired: true,
      },
    },
    include: {
      inventoryItem: true,
    },
  });

  const incomingItems = Array.isArray(payload.items) ? payload.items : [];
  const itemMap = new Map(
    incomingItems.map((item) => [item.inventoryItemId, item])
  );

  for (const branchItem of requiredItems) {
    if (!itemMap.has(branchItem.inventoryItemId)) {
      const error = new Error(`Item opname belum lengkap: ${branchItem.inventoryItem.name}`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validasi: jika closing dan oilLitersOpened > 0, wajib isi liter
  if (kind === "CLOSING") {
    const oilLiters = payload.oilLitersOpened !== undefined && payload.oilLitersOpened !== null ? Number(payload.oilLitersOpened) : null;
    if (oilLiters !== null && oilLiters <= 0) {
      const error = new Error("Jika buka minyak baru, liter minyak wajib diisi dan harus lebih dari 0");
      error.statusCode = 400;
      throw error;
    }
  }

  const now = new Date();
  const data = {
    branchId: effective.branchId,
    performedById: user.id,
    opnameDate: start,
    kind,
    isCompleted: true,
    notes: payload.notes || null,
    oilLitersOpened: kind === "CLOSING" ? (payload.oilLitersOpened !== undefined && payload.oilLitersOpened !== null ? Number(payload.oilLitersOpened) : null) : undefined,
    gasChanged: kind === "CLOSING" ? (payload.gasChanged !== undefined && payload.gasChanged !== null ? Boolean(payload.gasChanged) : null) : undefined,
  };

  return prisma.$transaction(async (tx) => {
    const opname = existing
      ? await tx.stockOpname.update({
          where: { id: existing.id },
          data,
        })
      : await tx.stockOpname.create({
          data,
        });

    await tx.stockOpnameItem.deleteMany({
      where: { stockOpnameId: opname.id },
    });

    for (const branchItem of requiredItems) {
      const incoming = itemMap.get(branchItem.inventoryItemId);
      const countedQty = Number(incoming.countedQty ?? 0);
      const systemQty = Number(branchItem.currentStock || 0);
      const varianceQty = countedQty - systemQty;

      await tx.stockOpnameItem.create({
        data: {
          stockOpnameId: opname.id,
          branchInventoryItemId: branchItem.id,
          inventoryItemId: branchItem.inventoryItemId,
          systemQty,
          countedQty,
          varianceQty,
          notes: incoming.notes || null,
        },
      });

      await tx.branchInventoryItem.update({
        where: { id: branchItem.id },
        data: {
          currentStock: countedQty,
          lastOpnameAt: now,
        },
      });

      if (varianceQty !== 0) {
        await tx.inventoryMovement.create({
          data: {
            branchId: effective.branchId,
            inventoryItemId: branchItem.inventoryItemId,
            performedById: user.id,
            type: "OPNAME",
            quantity: varianceQty,
            referenceType: "STOCK_OPNAME",
            referenceId: opname.id,
            notes: incoming.notes || null,
          },
        });
      }
    }

    // Inventory movement untuk minyak (consumption)
    if (kind === "CLOSING" && data.oilLitersOpened !== null && data.oilLitersOpened > 0) {
      const oilItem = await tx.inventoryItem.findUnique({ where: { code: "RAW_MINYAK" } });
      if (oilItem) {
        const branchOil = await tx.branchInventoryItem.findFirst({ where: { branchId: effective.branchId, inventoryItemId: oilItem.id } });
        await tx.inventoryMovement.create({
          data: { branchId: effective.branchId, inventoryItemId: oilItem.id, performedById: user.id, type: "CONSUMPTION", quantity: -Number(data.oilLitersOpened), referenceType: "STOCK_OPNAME", referenceId: opname.id, notes: `Buka minyak baru ${data.oilLitersOpened} liter` },
        });
        if (branchOil) {
          await tx.branchInventoryItem.update({ where: { id: branchOil.id }, data: { currentStock: { decrement: Number(data.oilLitersOpened) } } });
        }
      }
    }

    // Inventory movement untuk gas (consumption)
    if (kind === "CLOSING" && data.gasChanged === true) {
      const gasItem = await tx.inventoryItem.findUnique({ where: { code: "RAW_GAS" } });
      if (gasItem) {
        const branchGas = await tx.branchInventoryItem.findFirst({ where: { branchId: effective.branchId, inventoryItemId: gasItem.id } });
        await tx.inventoryMovement.create({
          data: { branchId: effective.branchId, inventoryItemId: gasItem.id, performedById: user.id, type: "CONSUMPTION", quantity: -1, referenceType: "STOCK_OPNAME", referenceId: opname.id, notes: "Ganti tabung gas 1 buah" },
        });
        if (branchGas) {
          await tx.branchInventoryItem.update({ where: { id: branchGas.id }, data: { currentStock: { decrement: 1 } } });
        }
      }
    }

    return tx.stockOpname.findUnique({
      where: { id: opname.id },
      include: {
        branch: true,
        performedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

async function checkInAttendance(user, payload, branchContext) {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();

  if (!effective.branchId) {
    const error = new Error("Branch tidak ditemukan");
    error.statusCode = 400;
    throw error;
  }

  const stockOpname = await prisma.stockOpname.findFirst({
    where: {
      branchId: effective.branchId,
      kind: "OPENING",
      opnameDate: {
        gte: start,
        lte: end,
      },
    },
  });

  if (!stockOpname?.isCompleted) {
    const error = new Error("Attendance hanya bisa dilakukan setelah stock opname harian selesai");
    error.statusCode = 400;
    throw error;
  }

  const activeSession = await prisma.cashSession.findFirst({
    where: {
      userId: user.id,
      branchId: effective.branchId,
      status: "OPEN",
    },
  });

  if (!activeSession) {
    const error = new Error("Attendance hanya bisa dilakukan setelah shift dibuka");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.crewAttendance.findFirst({
    where: {
      userId: user.id,
      branchId: effective.branchId,
      attendanceDate: {
        gte: start,
        lte: end,
      },
    },
  });

  if (existing?.checkInAt) {
    return existing;
  }

  if (existing) {
    return prisma.crewAttendance.update({
      where: { id: existing.id },
      data: {
        checkInAt: new Date(),
        status: "PRESENT",
        notes: payload.notes || null,
      },
      include: {
        branch: true,
        user: true,
      },
    });
  }

  return prisma.crewAttendance.create({
    data: {
      branchId: effective.branchId,
      userId: user.id,
      attendanceDate: start,
      checkInAt: new Date(),
      status: "PRESENT",
      notes: payload.notes || null,
    },
    include: {
      branch: true,
      user: true,
    },
  });
}

async function checkOutAttendance(user, payload, branchContext) {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();

  if (!effective.branchId) {
    const error = new Error("Branch tidak ditemukan");
    error.statusCode = 400;
    throw error;
  }

  const attendance = await prisma.crewAttendance.findFirst({
    where: {
      userId: user.id,
      branchId: effective.branchId,
      attendanceDate: {
        gte: start,
        lte: end,
      },
    },
  });

  if (!attendance) {
    const error = new Error("Belum ada absensi hari ini. Silakan check-in terlebih dahulu.");
    error.statusCode = 400;
    throw error;
  }

  if (attendance.checkOutAt) {
    return attendance;
  }

  return prisma.crewAttendance.update({
    where: { id: attendance.id },
    data: {
      checkOutAt: new Date(),
      notes: payload.notes || undefined,
    },
    include: {
      branch: true,
      user: true,
    },
  });
}

async function getDepotApprovalQueue(user, branchContext, filters = {}) {
  const [attendanceGate, depotTransfers] = await Promise.all([
    getAttendanceGate(user, branchContext),
    depotTransferService.listDepotTransfers(user, branchContext, {
      status: typeof filters.status === "string" && filters.status.trim() ? filters.status.trim() : "PENDING_APPROVAL",
      query: filters.query || "",
      branchId: filters.branchId || "",
    }),
  ]);

  return {
    attendanceGate,
    ...depotTransfers,
  };
}

async function approveDepotTransferForCrew(user, transferId, payload, branchContext) {
  return depotTransferService.approveDepotTransfer(user, transferId, payload, branchContext);
}

async function recordReturWaste(user, branchContext, payload) {
  const branchId = branchContext?.branchId || user.branchId;
  if (!branchId) {
    const e = new Error("Branch belum dipilih");
    e.statusCode = 400;
    throw e;
  }

  const { inventoryItemId, qty, reason } = payload;
  if (!inventoryItemId || !qty || !reason) {
    const e = new Error("Item, jumlah, dan alasan retur wajib diisi");
    e.statusCode = 400;
    throw e;
  }

  const branchItem = await prisma.branchInventoryItem.findFirst({
    where: { branchId, inventoryItemId, isActive: true },
  });

  if (!branchItem) {
    const e = new Error("Item tidak ditemukan di branch ini");
    e.statusCode = 404;
    throw e;
  }

  return prisma.$transaction(async (tx) => {
    await tx.branchInventoryItem.update({
      where: { id: branchItem.id },
      data: { currentStock: { decrement: Math.abs(qty) } },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        branchId,
        inventoryItemId,
        performedById: user.id,
        type: "WASTE",
        quantity: -Math.abs(qty),
        referenceType: "CREW_RETUR",
        notes: `Retur: ${reason}`,
      },
    });

    return movement;
  });
}

function buildStockMovementBucket() {
  return {
    purchaseIn: 0,
    transferIn: 0,
    saleOut: 0,
    transferOut: 0,
    wasteOut: 0,
    adjustmentIn: 0,
    adjustmentOut: 0,
    movementCount: 0,
    latestMovementAt: null,
    latestMovementType: null,
  };
}

async function getOutletStockOverview(user, branchContext, query = {}) {
  const effective = await getBranchOfToday(user, branchContext);
  const { start, end } = getTodayRange();
  const branchId = effective.branchId;
  const typeFilter = typeof query.type === "string" ? query.type.trim().toUpperCase() : "ALL";
  const validTypes = new Set(["RAW_MATERIAL", "PACKAGING", "UTILITY", "SUPPLY"]);
  const inventoryTypeFilter = validTypes.has(typeFilter) ? typeFilter : null;

  if (!branchId) {
    return {
      branch: null,
      dateRange: { start, end },
      stockOpname: {
        opening: null,
        closing: null,
      },
      summary: {
        itemsTracked: 0,
        openingTotal: 0,
        incomingTotal: 0,
        outgoingTotal: 0,
        wasteReturTotal: 0,
        endingTotal: 0,
        movementCount: 0,
      },
      items: [],
      recentMovements: [],
      filter: {
        type: inventoryTypeFilter || "ALL",
      },
    };
  }

  const branchItems = await prisma.branchInventoryItem.findMany({
    where: {
      branchId,
      isActive: true,
      isOpnameRequired: true,
      inventoryItem: {
        isActive: true,
        isOpnameRequired: true,
        ...(inventoryTypeFilter ? { type: inventoryTypeFilter } : {}),
      },
    },
    include: {
      inventoryItem: true,
    },
    orderBy: [
      {
        inventoryItem: {
          type: "asc",
        },
      },
      {
        inventoryItem: {
          name: "asc",
        },
      },
    ],
  });

  const itemIds = branchItems.map((item) => item.inventoryItemId);

  const [openingStockOpname, closingStockOpname, movements] = await Promise.all([
    prisma.stockOpname.findFirst({
      where: {
        branchId,
        kind: "OPENING",
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    }),
    prisma.stockOpname.findFirst({
      where: {
        branchId,
        kind: "CLOSING",
        opnameDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    }),
    itemIds.length
      ? prisma.inventoryMovement.findMany({
          where: {
            branchId,
            inventoryItemId: {
              in: itemIds,
            },
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        })
      : Promise.resolve([]),
  ]);

  const openingMap = new Map(
    (openingStockOpname?.items || []).map((item) => [item.inventoryItemId, Number(item.countedQty || 0)])
  );

  const movementMap = new Map();

  for (const movement of movements) {
    const bucket = movementMap.get(movement.inventoryItemId) || buildStockMovementBucket();
    const qty = Number(movement.quantity || 0);
    const absQty = Math.abs(qty);

    bucket.movementCount += 1;
    bucket.latestMovementAt = movement.createdAt;
    bucket.latestMovementType = movement.type;

    switch (movement.type) {
      case "PURCHASE":
        bucket.purchaseIn += absQty;
        break;
      case "TRANSFER_IN":
        bucket.transferIn += absQty;
        break;
      case "SALE":
        bucket.saleOut += absQty;
        break;
      case "TRANSFER_OUT":
        bucket.transferOut += absQty;
        break;
      case "WASTE":
        bucket.wasteOut += absQty;
        break;
      case "ADJUSTMENT":
        if (qty >= 0) {
          bucket.adjustmentIn += absQty;
        } else {
          bucket.adjustmentOut += absQty;
        }
        break;
      default:
        break;
    }

    movementMap.set(movement.inventoryItemId, bucket);
  }

  const items = branchItems.map((branchItem) => {
    const currentStock = Number(branchItem.currentStock || 0);
    const movementBucket = movementMap.get(branchItem.inventoryItemId) || buildStockMovementBucket();
    const incomingTotal = movementBucket.purchaseIn + movementBucket.transferIn + movementBucket.adjustmentIn;
    const outgoingTotal = movementBucket.saleOut + movementBucket.adjustmentOut;
    const wasteReturTotal = movementBucket.wasteOut + movementBucket.transferOut;
    const netMovement = incomingTotal - outgoingTotal - wasteReturTotal;
    const openingTotal = openingMap.has(branchItem.inventoryItemId)
      ? Number(openingMap.get(branchItem.inventoryItemId) || 0)
      : currentStock - netMovement;
    const endingTotal = currentStock;
    const expectedEnding = openingTotal + netMovement;
    const variance = endingTotal - expectedEnding;

    return {
      branchInventoryItemId: branchItem.id,
      inventoryItemId: branchItem.inventoryItemId,
      name: branchItem.inventoryItem.name,
      code: branchItem.inventoryItem.code,
      unit: branchItem.inventoryItem.unit,
      type: branchItem.inventoryItem.type,
      minStock: branchItem.minStock ? Number(branchItem.minStock) : 0,
      isOpnameRequired: branchItem.isOpnameRequired,
      openingTotal,
      incomingTotal,
      outgoingTotal,
      wasteReturTotal,
      endingTotal,
      expectedEnding,
      variance,
      currentStock,
      movementCount: movementBucket.movementCount,
      latestMovementAt: movementBucket.latestMovementAt,
      latestMovementType: movementBucket.latestMovementType,
    };
  });

  const summary = items.reduce(
    (acc, item) => {
      acc.itemsTracked += 1;
      acc.openingTotal += Number(item.openingTotal || 0);
      acc.incomingTotal += Number(item.incomingTotal || 0);
      acc.outgoingTotal += Number(item.outgoingTotal || 0);
      acc.wasteReturTotal += Number(item.wasteReturTotal || 0);
      acc.endingTotal += Number(item.endingTotal || 0);
      acc.movementCount += Number(item.movementCount || 0);
      return acc;
    },
    {
      itemsTracked: 0,
      openingTotal: 0,
      incomingTotal: 0,
      outgoingTotal: 0,
      wasteReturTotal: 0,
      endingTotal: 0,
      movementCount: 0,
    }
  );

  const recentMovements = movements.slice(-8).reverse();

  return {
    branch: effective.branch,
    dateRange: { start, end },
    stockOpname: {
      opening: openingStockOpname,
      closing: closingStockOpname,
    },
    summary,
    items,
    recentMovements,
    filter: {
      type: inventoryTypeFilter || "ALL",
    },
  };
}

async function getCrewBranches(user) {
  const now = new Date();
  const assignments = await prisma.branchAssignment.findMany({
    where: { userId: user.id, isActive: true, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
    include: { branch: true },
    orderBy: { updatedAt: "desc" },
  });
  return assignments.map(a => a.branch).filter(Boolean);
}

module.exports = {
  getCrewDashboard,
  getTodayBranchSales,
  getMonthlyCrewPerformance,
  getAttendanceGate,
  getStockOpnameForm,
  completeStockOpname,
  checkInAttendance,
  checkOutAttendance,
  getDepotApprovalQueue,
  approveDepotTransferForCrew,
  getOutletStockOverview,
  recordReturWaste,
  getCrewBranches,
};
