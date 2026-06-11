const prisma = require("../../core/config/prisma");
const accessControlService = require("../../core/services/accessControl.service");
const { createAuditLog } = require("../../core/services/auditLog.service");
const {
  createPurchaseLot,
  recordCostHistory,
  voidPurchaseLots,
} = require("../../core/services/inventoryCost.service");

function resolveBranchId(user, branchContext, payload = {}) {
  return branchContext?.branchId || payload.branchId || user.branchId || null;
}

async function resolveOpenCashSession(branchId, userId, cashSessionId = null) {
  if (cashSessionId) {
    return prisma.cashSession.findFirst({
      where: {
        id: cashSessionId,
        branchId,
      },
    });
  }

  return prisma.cashSession.findFirst({
    where: {
      branchId,
      userId,
      status: "OPEN",
    },
    orderBy: {
      openedAt: "desc",
    },
  });
}

async function listOutletExpenses(user, branchContext, query = {}) {
  let branchId = query.branchId || resolveBranchId(user, branchContext);
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);
  if (!hasGlobalAccess && !branchId) {
    branchId = resolveBranchId(user, branchContext);
  }

  const where = {
    ...(branchId ? { branchId } : {}),
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
  };
  if (query.search) {
    where.OR = [{ note: { contains: query.search, mode: "insensitive" } }];
  }

  return prisma.outletExpense.findMany({
    where,
    include: {
      branch: true,
      cashSession: true,
      createdBy: true,
      approvedBy: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
    orderBy: {
      expenseDate: "desc",
    },
  });
}

async function getOutletExpenseById(id) {
  return prisma.outletExpense.findUnique({
    where: { id },
    include: {
      branch: true,
      cashSession: true,
      createdBy: true,
      approvedBy: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

function isValidUrl(str) {
  if (!str) return true; // opsional
  return /^https?:\/\/.+/.test(str);
}

async function createOutletExpense(user, payload, branchContext) {
  const branchId = resolveBranchId(user, branchContext, payload);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!branchId) {
    const error = new Error("Branch wajib dipilih untuk outlet expense");
    error.statusCode = 400;
    throw error;
  }

  if (!items.length) {
    const error = new Error("Minimal ada 1 item expense");
    error.statusCode = 400;
    throw error;
  }

  if (payload.receiptPhotoUrl && !isValidUrl(payload.receiptPhotoUrl)) {
    const error = new Error("URL foto struk tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const cashSession = await resolveOpenCashSession(branchId, user.id, payload.cashSessionId || null);
  if (!cashSession) {
    const error = new Error("Outlet expense hanya bisa dibuat pada shift aktif");
    error.statusCode = 400;
    throw error;
  }

  const inventoryIds = [...new Set(items.map((item) => item.inventoryItemId).filter(Boolean))];
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      id: { in: inventoryIds },
      isActive: true,
      isPurchasable: true,
    },
  });

  const itemMap = new Map(inventoryItems.map((item) => [item.id, item]));

  for (const item of items) {
    const inventoryItem = itemMap.get(item.inventoryItemId);
    if (!inventoryItem) {
      const error = new Error("Ada item expense yang tidak valid atau tidak boleh dibeli");
      error.statusCode = 400;
      throw error;
    }
  }

  const totalAmount = Number(
    payload.totalAmount ??
      items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
  );

  return prisma.$transaction(async (tx) => {
    const expense = await tx.outletExpense.create({
      data: {
        branchId,
        cashSessionId: cashSession.id,
        createdById: user.id,
        expenseDate: payload.expenseDate ? new Date(payload.expenseDate) : new Date(),
        totalAmount,
        receiptPhotoUrl: payload.receiptPhotoUrl || "",
        note: payload.note || null,
        status: "REQUESTED",
      },
    });

    for (const item of items) {
      const inventoryItem = itemMap.get(item.inventoryItemId);
      const qty = Number(item.qty || 0);
      const lineTotal = Number(item.totalAmount || 0);

      const expenseItem = await tx.outletExpenseItem.create({
        data: {
          outletExpenseId: expense.id,
          inventoryItemId: inventoryItem.id,
          itemName: inventoryItem.name,
          unit: inventoryItem.unit,
          qty,
          totalAmount: lineTotal,
          notes: item.notes || null,
        },
      });

    }

    await createAuditLog({
      client: tx,
      action: "CREATE",
      entity: "OUTLET_EXPENSE",
      entityId: expense.id,
      description: `Outlet expense dibuat sebesar Rp ${totalAmount}`,
      metadata: {
        totalAmount,
        itemCount: items.length,
      },
      branchId,
      performedById: user.id,
    });

    return tx.outletExpense.findUnique({
      where: { id: expense.id },
      include: {
        branch: true,
        cashSession: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

async function approveOutletExpense(user, expenseId, branchContext, payload = {}) {
  const expense = await prisma.outletExpense.findUnique({
    where: { id: expenseId },
    include: {
      branch: true,
      cashSession: true,
      createdBy: true,
      approvedBy: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!expense) {
    const error = new Error("Outlet expense tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const branchId = resolveBranchId(user, branchContext, expense);
  if (branchId && expense.branchId !== branchId && !accessControlService.canAccessAllBranches(user.role)) {
    const error = new Error("Expense bukan milik branch aktif");
    error.statusCode = 403;
    throw error;
  }

  if (expense.status === "VOID") {
    const error = new Error("Outlet expense yang sudah void tidak bisa di-approve");
    error.statusCode = 400;
    throw error;
  }

  if (expense.status === "POSTED") {
    const error = new Error("Outlet expense sudah di-approve");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.outletExpense.update({
      where: { id: expense.id },
      data: {
        status: "POSTED",
        approvedById: user.id,
        approvedAt: new Date(),
        approvalNote: payload.approvalNote || null,
      },
    });

    for (const item of expense.items) {
      const inventoryItem = item.inventoryItem;
      const qty = Number(item.qty || 0);
      const lineTotal = Number(item.totalAmount || 0);

      if (!inventoryItem?.isOpnameRequired) {
        continue;
      }

      await tx.branchInventoryItem.upsert({
        where: {
          branchId_inventoryItemId: {
            branchId: expense.branchId,
            inventoryItemId: inventoryItem.id,
          },
        },
        update: {
          currentStock: {
            increment: qty,
          },
          isOpnameRequired: true,
          isActive: true,
        },
        create: {
          branchId: expense.branchId,
          inventoryItemId: inventoryItem.id,
          currentStock: qty,
          isOpnameRequired: true,
          isActive: true,
        },
      });

      const unitCost = qty > 0 ? Math.round(lineTotal / qty) : lineTotal;

      const lot = await createPurchaseLot(tx, {
        branchId: expense.branchId,
        inventoryItemId: inventoryItem.id,
        performedById: user.id,
        sourceType: "OUTLET_EXPENSE",
        sourceId: expense.id,
        sourceItemId: item.id,
        purchasedQty: qty,
        unitCost,
        totalCost: lineTotal,
        note: item.notes || payload.approvalNote || null,
      });

      await recordCostHistory(tx, {
        branchId: expense.branchId,
        inventoryItemId: inventoryItem.id,
        itemPurchaseLotId: lot.id,
        performedById: user.id,
        sourceType: "OUTLET_EXPENSE",
        sourceId: expense.id,
        sourceItemId: item.id,
        movementType: "IN",
        quantity: qty,
        unitCost,
        totalCost: lineTotal,
        resultingUnitCost: unitCost,
        note: item.notes || payload.approvalNote || null,
      });

      await tx.inventoryMovement.create({
        data: {
          branchId: expense.branchId,
          inventoryItemId: inventoryItem.id,
          performedById: user.id,
          type: "PURCHASE",
          quantity: qty,
          referenceType: "OUTLET_EXPENSE",
          referenceId: expense.id,
          notes: item.notes || payload.approvalNote || null,
        },
      });
    }

    await createAuditLog({
      client: tx,
      action: "APPROVE",
      entity: "OUTLET_EXPENSE",
      entityId: expense.id,
      description: `Outlet expense ${expense.id} di-approve`,
      metadata: {
        approvedById: user.id,
        branchId: expense.branchId,
      },
      branchId: expense.branchId,
      performedById: user.id,
    });

    return tx.outletExpense.findUnique({
      where: { id: updated.id },
      include: {
        branch: true,
        cashSession: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

async function voidOutletExpense(user, expenseId, branchContext, reason = null) {
  const expense = await prisma.outletExpense.findUnique({
    where: { id: expenseId },
    include: {
      items: true,
    },
  });

  if (!expense) {
    const error = new Error("Outlet expense tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const branchId = resolveBranchId(user, branchContext, expense);

  if (branchId && expense.branchId !== branchId) {
    const error = new Error("Expense bukan milik branch aktif");
    error.statusCode = 403;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.outletExpense.update({
      where: { id: expense.id },
      data: {
        status: "VOID",
        note: reason ? `${expense.note || ""}${expense.note ? " | " : ""}VOID: ${reason}` : expense.note,
      },
      include: {
        branch: true,
        cashSession: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (expense.status === "POSTED") {
      await voidPurchaseLots(tx, {
        branchId: expense.branchId,
        sourceType: "OUTLET_EXPENSE",
        voidSourceType: "VOID_OUTLET_EXPENSE",
        sourceId: expense.id,
        performedById: user.id,
        note: reason || null,
      });

      for (const item of expense.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (inventoryItem?.isOpnameRequired) {
          await tx.branchInventoryItem.updateMany({
            where: {
              branchId: expense.branchId,
              inventoryItemId: item.inventoryItemId,
            },
            data: {
              currentStock: {
                decrement: Number(item.qty || 0),
              },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              branchId: expense.branchId,
              inventoryItemId: item.inventoryItemId,
              performedById: user.id,
              type: "ADJUSTMENT",
              quantity: -Number(item.qty || 0),
              referenceType: "OUTLET_EXPENSE_VOID",
              referenceId: expense.id,
              notes: reason || null,
            },
          });
        }
      }
    }

    await createAuditLog({
      client: tx,
      action: "VOID",
      entity: "OUTLET_EXPENSE",
      entityId: expense.id,
      description: reason ? `Outlet expense di-void: ${reason}` : "Outlet expense di-void",
      metadata: {
        previousStatus: expense.status,
      },
      branchId: expense.branchId,
      performedById: user.id,
    });

    return updated;
  });
}

async function getSummary(user, branchContext) {
  const branchId = resolveBranchId(user, branchContext);
  const where = {
    ...(branchId ? { branchId } : {}),
  };

  const [requested, posted, voided, total] = await Promise.all([
    prisma.outletExpense.aggregate({
      where: {
        ...where,
        status: "REQUESTED",
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),
    prisma.outletExpense.aggregate({
      where: {
        ...where,
        status: "POSTED",
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),
    prisma.outletExpense.aggregate({
      where: {
        ...where,
        status: "VOID",
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),
    prisma.outletExpense.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),
  ]);

  return {
    branchId,
      totalExpenses: total._count,
      requestedExpenses: requested._count,
      postedExpenses: posted._count,
      voidedExpenses: voided._count,
      totalRequestedAmount: Number(requested._sum.totalAmount || 0),
      totalPostedAmount: Number(posted._sum.totalAmount || 0),
      totalVoidedAmount: Number(voided._sum.totalAmount || 0),
      totalAmount: Number(total._sum.totalAmount || 0),
  };
}

module.exports = {
  listOutletExpenses,
  getOutletExpenseById,
  createOutletExpense,
  approveOutletExpense,
  voidOutletExpense,
  getSummary,
};
