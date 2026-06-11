const prisma = require("../../core/config/prisma");
const accessControlService = require("../../core/services/accessControl.service");
const { createAuditLog } = require("../../core/services/auditLog.service");
const {
  createPurchaseLot,
  recordCostHistory,
  getLatestUnitCost,
} = require("../../core/services/inventoryCost.service");

function toDecimal(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatQty(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(3);
}

const crypto = require("crypto");

function buildTransferNumber() {
  const now = new Date();
  const dateStamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `DT-${dateStamp}-${random}`;
}

async function resolveBranchScope(user, branchContext) {
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);
  const branchId = branchContext?.branchId || user.branchId || null;

  return {
    hasGlobalAccess,
    branchId,
  };
}

function resolveApprovalBranch(branchContext, transferTargetBranchId, hasGlobalAccess) {
  if (hasGlobalAccess) {
    return transferTargetBranchId;
  }

  if (branchContext?.branchId && branchContext.branchId === transferTargetBranchId) {
    return transferTargetBranchId;
  }

  return null;
}

async function resolveOpenCashSession(client, branchId, userId, cashSessionId = null) {
  if (!branchId) return null;

  if (cashSessionId) {
    return client.cashSession.findFirst({
      where: {
        id: cashSessionId,
        branchId,
        userId,
        status: "OPEN",
      },
    });
  }

  return client.cashSession.findFirst({
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

async function getDepotTransferById(id) {
  return prisma.depotTransfer.findUnique({
    where: { id },
    include: {
      sourceWarehouse: {
        include: {
          branch: true,
          stocks: {
            include: {
              inventoryItem: true,
            },
          },
        },
      },
      sourceBranch: true,
      targetBranch: true,
      createdBy: true,
      approvedBy: true,
      approvedCashSession: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

async function buildListWhere(user, branchContext, filters = {}) {
  const { hasGlobalAccess, branchId } = await resolveBranchScope(user, branchContext);
  const and = [];

  const status = typeof filters.status === "string" ? filters.status.trim().toUpperCase() : "";
  if (status) {
    and.push({ status });
  }

  const keyword = typeof filters.query === "string" ? filters.query.trim() : "";
  if (keyword) {
    and.push({
      OR: [
        { transferNumber: { contains: keyword, mode: "insensitive" } },
        { note: { contains: keyword, mode: "insensitive" } },
        { approvalNote: { contains: keyword, mode: "insensitive" } },
        { sourceWarehouse: { name: { contains: keyword, mode: "insensitive" } } },
        { sourceWarehouse: { code: { contains: keyword, mode: "insensitive" } } },
        { targetBranch: { name: { contains: keyword, mode: "insensitive" } } },
        { createdBy: { name: { contains: keyword, mode: "insensitive" } } },
      ],
    });
  }

  const explicitBranchId = typeof filters.branchId === "string" ? filters.branchId.trim() : "";
  const effectiveBranchId = explicitBranchId || (!hasGlobalAccess ? branchId : "");

  if (!hasGlobalAccess && !effectiveBranchId) {
    return {
      AND: [{ id: "__no_branch__" }],
    };
  }

  if (effectiveBranchId) {
    and.push({
      OR: [
        { sourceBranchId: effectiveBranchId },
        { targetBranchId: effectiveBranchId },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

async function listDepotTransfers(user, branchContext, filters = {}) {
  const where = await buildListWhere(user, branchContext, filters);

  const [transfers, totals] = await Promise.all([
    prisma.depotTransfer.findMany({
      where,
      include: {
        sourceWarehouse: {
          include: {
            branch: true,
          },
        },
        sourceBranch: true,
        targetBranch: true,
        createdBy: true,
        approvedBy: true,
        approvedCashSession: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    }),
    prisma.depotTransfer.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    }),
  ]);

  const summary = totals.reduce(
    (acc, item) => {
      acc.total += item._count._all;
      acc[item.status.toLowerCase()] = item._count._all;
      return acc;
    },
    {
      total: 0,
      draft: 0,
      pending_approval: 0,
      approved: 0,
      void: 0,
    }
  );

  summary.pendingApproval = summary.pending_approval;

  return {
    transfers,
    summary,
  };
}

async function createDepotTransfer(user, payload, branchContext) {
  let sourceWarehouseId = payload.sourceWarehouseId || null;
  let targetBranchId = payload.targetBranchId || branchContext?.branchId || user.branchId || null;
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!items.length) {
    const error = new Error("Minimal ada 1 item transfer");
    error.statusCode = 400;
    throw error;
  }

  if (!sourceWarehouseId) {
    const fallbackWarehouse = await prisma.warehouse.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!fallbackWarehouse) {
      const error = new Error("Depot sumber tidak ditemukan");
      error.statusCode = 400;
      throw error;
    }

    sourceWarehouseId = fallbackWarehouse.id;
  }

  const [sourceWarehouse, targetBranch] = await Promise.all([
    prisma.warehouse.findUnique({
      where: { id: sourceWarehouseId },
      include: {
        branch: true,
        stocks: {
          include: {
            inventoryItem: true,
          },
        },
      },
    }),
    prisma.branch.findUnique({ where: { id: targetBranchId } }),
  ]);

  if (!sourceWarehouse || !sourceWarehouse.isActive) {
    const error = new Error("Source warehouse tidak valid atau tidak aktif");
    error.statusCode = 400;
    throw error;
  }

  if (!targetBranchId) {
    targetBranchId = branchContext?.branchId || user.branchId || null;
  }

  if (!targetBranchId) {
    const error = new Error("Target branch tidak ditemukan");
    error.statusCode = 400;
    throw error;
  }

  if (!targetBranch || !targetBranch.isActive) {
    const error = new Error("Target branch tidak valid atau tidak aktif");
    error.statusCode = 400;
    throw error;
  }

  const inventoryIds = [...new Set(items.map((item) => item.inventoryItemId).filter(Boolean))];
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      id: { in: inventoryIds },
      isActive: true,
      isOpnameRequired: true,
    },
  });

  const itemMap = new Map(inventoryItems.map((item) => [item.id, item]));
  const warehouseStockMap = new Map(
    sourceWarehouse.stocks.map((stock) => [stock.inventoryItemId, Number(stock.currentStock || 0)])
  );

  for (const item of items) {
    const inventoryItem = itemMap.get(item.inventoryItemId);
    if (!inventoryItem) {
      const error = new Error("Ada item transfer yang tidak valid atau tidak masuk stock opname");
      error.statusCode = 400;
      throw error;
    }

    const qty = toDecimal(item.qty);
    if (qty <= 0) {
      const error = new Error("Qty transfer harus lebih besar dari 0");
      error.statusCode = 400;
      throw error;
    }

    const availableStock = warehouseStockMap.get(item.inventoryItemId) ?? 0;
    if (availableStock < qty) {
      const error = new Error(
        `Stok depot tidak cukup untuk item ${inventoryItem.name}. Stok tersedia ${formatQty(availableStock)}, diminta ${formatQty(qty)}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const transferNumber = buildTransferNumber();

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.depotTransfer.create({
      data: {
        transferNumber,
        sourceWarehouseId,
        sourceBranchId: sourceWarehouse.branchId || null,
        targetBranchId,
        createdById: user.id,
        transferDate: payload.transferDate ? new Date(payload.transferDate) : new Date(),
        status: "PENDING_APPROVAL",
        note: payload.note || null,
      },
    });

    for (const item of items) {
      const inventoryItem = itemMap.get(item.inventoryItemId);

      await tx.depotTransferItem.create({
        data: {
          depotTransferId: transfer.id,
          inventoryItemId: inventoryItem.id,
          itemName: inventoryItem.name,
          unit: inventoryItem.unit,
          qty: toDecimal(item.qty),
          notes: item.notes || null,
        },
      });
    }

    await createAuditLog({
      client: tx,
      action: "CREATE",
      entity: "DEPOT_TRANSFER",
      entityId: transfer.id,
      description: `Transfer depo ${sourceWarehouse.name} ke ${targetBranch.name} dibuat`,
      metadata: {
        transferNumber,
        sourceWarehouseId,
        sourceBranchId: sourceWarehouse.branchId || null,
        targetBranchId,
        itemCount: items.length,
      },
      branchId: sourceWarehouse.branchId || null,
      performedById: user.id,
    });

    return tx.depotTransfer.findUnique({
      where: { id: transfer.id },
      include: {
        sourceWarehouse: {
          include: {
            branch: true,
          },
        },
        sourceBranch: true,
        targetBranch: true,
        createdBy: true,
        approvedBy: true,
        approvedCashSession: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

async function approveDepotTransfer(user, transferId, payload, branchContext) {
  const transfer = await prisma.depotTransfer.findUnique({
    where: { id: transferId },
    include: {
      sourceWarehouse: {
        include: {
          branch: true,
          stocks: {
            include: {
              inventoryItem: true,
            },
          },
        },
      },
      sourceBranch: true,
      targetBranch: true,
      createdBy: true,
      approvedBy: true,
      approvedCashSession: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!transfer) {
    const error = new Error("Transfer depo tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status === "VOID") {
    const error = new Error("Transfer yang sudah void tidak bisa di-approve");
    error.statusCode = 400;
    throw error;
  }

  if (transfer.status === "APPROVED") {
    const error = new Error("Transfer sudah di-approve");
    error.statusCode = 400;
    throw error;
  }

  if (transfer.status !== "PENDING_APPROVAL" && transfer.status !== "DRAFT") {
    const error = new Error("Status transfer tidak valid untuk approval");
    error.statusCode = 400;
    throw error;
  }

  const { hasGlobalAccess } = await resolveBranchScope(user, branchContext);
  const approvalBranchId = resolveApprovalBranch(branchContext, transfer.targetBranchId, hasGlobalAccess);

  if (!approvalBranchId) {
    const error = new Error("Approval harus dilakukan oleh cashier yang sedang shift di branch tujuan");
    error.statusCode = 403;
    throw error;
  }

  const cashSession = await resolveOpenCashSession(
    prisma,
    transfer.targetBranchId,
    user.id,
    payload.cashSessionId || null
  );

  if (!cashSession) {
    const error = new Error("Approval hanya bisa dilakukan saat shift aktif di branch tujuan");
    error.statusCode = 400;
    throw error;
  }

  const sourceInventoryIds = transfer.items.map((item) => item.inventoryItemId);
  const sourceStocks = await prisma.warehouseStock.findMany({
    where: {
      warehouseId: transfer.sourceWarehouseId,
      inventoryItemId: {
        in: sourceInventoryIds,
      },
    },
  });
  const sourceStockMap = new Map(sourceStocks.map((row) => [row.inventoryItemId, Number(row.currentStock || 0)]));

  for (const item of transfer.items) {
    const currentStock = sourceStockMap.get(item.inventoryItemId) ?? 0;
    const requestedQty = toDecimal(item.qty);

    if (currentStock < requestedQty) {
      const error = new Error(
        `Stok depot tidak cukup untuk item ${item.itemName}. Stok tersedia ${formatQty(currentStock)}, diminta ${formatQty(requestedQty)}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const approvalNote = payload.approvalNote || null;

  return prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.depotTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "APPROVED",
        approvedById: user.id,
        approvedCashSessionId: cashSession.id,
        approvedAt: new Date(),
        approvalNote,
      },
    });

    for (const item of transfer.items) {
      const qty = toDecimal(item.qty);
      const costBranch = transfer.sourceWarehouse?.branchId || transfer.targetBranchId;
      const unitCost = await getLatestUnitCost(tx, costBranch, item.inventoryItemId);
      const totalCost = Math.round(unitCost * qty);

      await tx.warehouseStock.upsert({
        where: {
          warehouseId_inventoryItemId: {
            warehouseId: transfer.sourceWarehouseId,
            inventoryItemId: item.inventoryItemId,
          },
        },
        update: {
          currentStock: {
            decrement: qty,
          },
          isActive: true,
          lastAdjustmentAt: new Date(),
        },
        create: {
          warehouseId: transfer.sourceWarehouseId,
          inventoryItemId: item.inventoryItemId,
          currentStock: -qty,
          isActive: true,
          lastAdjustmentAt: new Date(),
        },
      });

      await tx.branchInventoryItem.upsert({
        where: {
          branchId_inventoryItemId: {
            branchId: transfer.targetBranchId,
            inventoryItemId: item.inventoryItemId,
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
          branchId: transfer.targetBranchId,
          inventoryItemId: item.inventoryItemId,
          currentStock: qty,
          isOpnameRequired: true,
          isActive: true,
        },
      });

      const lot = await createPurchaseLot(tx, {
        branchId: transfer.targetBranchId,
        inventoryItemId: item.inventoryItemId,
        performedById: user.id,
        sourceType: "TRANSFER",
        sourceId: transfer.id,
        sourceItemId: item.id,
        purchasedQty: qty,
        unitCost,
        totalCost,
        note: item.notes || approvalNote || null,
      });

      if (costBranch) {
        await recordCostHistory(tx, {
          branchId: costBranch,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          sourceType: "TRANSFER",
          sourceId: transfer.id,
          sourceItemId: item.id,
          movementType: "OUT",
          quantity: qty,
          unitCost,
          totalCost,
          resultingUnitCost: unitCost,
          note: item.notes || approvalNote || null,
        });
      }

      await recordCostHistory(tx, {
        branchId: transfer.targetBranchId,
        inventoryItemId: item.inventoryItemId,
        itemPurchaseLotId: lot.id,
        performedById: user.id,
        sourceType: "TRANSFER",
        sourceId: transfer.id,
        sourceItemId: item.id,
        movementType: "IN",
        quantity: qty,
        unitCost,
        totalCost,
        resultingUnitCost: unitCost,
        note: item.notes || approvalNote || null,
      });

      await tx.warehouseMovement.create({
        data: {
          warehouseId: transfer.sourceWarehouseId,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          type: "TRANSFER_OUT",
          quantity: qty * -1,
          referenceType: "DEPOT_TRANSFER",
          referenceId: transfer.id,
          notes: item.notes || `DT: ${transfer.transferNumber}`,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          branchId: transfer.targetBranchId,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          type: "TRANSFER_IN",
          quantity: qty,
          referenceType: "DEPOT_TRANSFER",
          referenceId: transfer.id,
          notes: item.notes || `DT: ${transfer.transferNumber}`,
        },
      });
    }

    await createAuditLog({
      client: tx,
      action: "APPROVE",
      entity: "DEPOT_TRANSFER",
      entityId: transfer.id,
      description: `Transfer depo ${transfer.transferNumber} di-approve`,
      metadata: {
        approvedById: user.id,
        approvedCashSessionId: cashSession.id,
        targetBranchId: transfer.targetBranchId,
      },
      branchId: transfer.sourceWarehouse.branchId,
      performedById: user.id,
    });

    return tx.depotTransfer.findUnique({
      where: { id: updatedTransfer.id },
      include: {
        sourceWarehouse: {
          include: {
            branch: true,
          },
        },
        sourceBranch: true,
        targetBranch: true,
        createdBy: true,
        approvedBy: true,
        approvedCashSession: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

async function voidDepotTransfer(user, transferId, branchContext, reason = null) {
  const transfer = await prisma.depotTransfer.findUnique({
    where: { id: transferId },
    include: {
      sourceWarehouse: {
        include: {
          branch: true,
        },
      },
      sourceBranch: true,
      targetBranch: true,
      createdBy: true,
      approvedBy: true,
      approvedCashSession: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!transfer) {
    const error = new Error("Transfer depo tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status === "APPROVED") {
    const error = new Error("Transfer yang sudah approved tidak bisa di-void dari halaman ini");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.depotTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "VOID",
        voidReason: reason || null,
        approvalNote: transfer.approvalNote || null,
      },
    });

    await createAuditLog({
      client: tx,
      action: "VOID",
      entity: "DEPOT_TRANSFER",
      entityId: transfer.id,
      description: reason
        ? `Transfer depo ${transfer.transferNumber} di-void: ${reason}`
        : `Transfer depo ${transfer.transferNumber} di-void`,
      metadata: {
        previousStatus: transfer.status,
        voidReason: reason || null,
      },
      branchId: transfer.sourceWarehouse?.branchId || transfer.sourceBranchId || null,
      performedById: user.id,
    });

    return updated;
  });
}

async function getSummary(user, branchContext) {
  const where = await buildListWhere(user, branchContext);

  const [total, draft, pendingApproval, approved, voided] = await Promise.all([
    prisma.depotTransfer.count({ where }),
    prisma.depotTransfer.count({ where: { ...where, status: "DRAFT" } }),
    prisma.depotTransfer.count({ where: { ...where, status: "PENDING_APPROVAL" } }),
    prisma.depotTransfer.count({ where: { ...where, status: "APPROVED" } }),
    prisma.depotTransfer.count({ where: { ...where, status: "VOID" } }),
  ]);

  return {
    total,
    draft,
    pendingApproval,
    approved,
    voided,
  };
}

module.exports = {
  listDepotTransfers,
  getDepotTransferById,
  createDepotTransfer,
  approveDepotTransfer,
  voidDepotTransfer,
  getSummary,
};
