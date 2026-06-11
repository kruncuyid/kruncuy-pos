const prisma = require("../../core/config/prisma");
const crypto = require("crypto");
const { createPurchaseLot, recordCostHistory } = require("../../core/services/inventoryCost.service");

function generateGRNumber() {
  const d = new Date();
  return `GR-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

exports.list = async (query = {}) => {
  const where = {};
  if (query.purchaseOrderId) where.purchaseOrderId = query.purchaseOrderId;
  return prisma.goodsReceipt.findMany({
    where,
    include: { purchaseOrder: { include: { supplier: true, warehouse: true } }, branch: true, warehouse: true, receivedBy: true, items: { include: { inventoryItem: true } } },
    orderBy: { receivedDate: "desc" },
  });
};

exports.getById = async (id) => {
  const gr = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: { purchaseOrder: { include: { supplier: true, warehouse: true } }, branch: true, warehouse: true, receivedBy: true, items: { include: { inventoryItem: true } } },
  });
  if (!gr) { const e = new Error("GR tidak ditemukan"); e.statusCode = 404; throw e; }
  return gr;
};

exports.create = async (user, branchContext, payload) => {
  const { purchaseOrderId, items = [], notes } = payload;
  if (!purchaseOrderId || !items.length) { const e = new Error("PO dan minimal 1 item wajib"); e.statusCode = 400; throw e; }

  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });
    if (!po) { const e = new Error("PO tidak ditemukan"); e.statusCode = 404; throw e; }

    const branchId = branchContext?.branchId || user.branchId;
    const warehouseId = po.warehouseId || null;
    // When receiving to warehouse, use warehouse's branch for cost tracking
    let costBranchId = branchId;
    if (warehouseId) {
      const wh = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { branchId: true } });
      if (wh?.branchId) costBranchId = wh.branchId;
    }

    const gr = await tx.goodsReceipt.create({
      data: {
        grNumber: generateGRNumber(),
        purchaseOrderId,
        branchId: costBranchId,
        warehouseId: warehouseId,
        receivedById: user.id,
        notes,
        items: { create: items.map((i) => ({ purchaseOrderItemId: i.purchaseOrderItemId, inventoryItemId: i.inventoryItemId, qtyReceived: i.qtyReceived || 0, unitCost: i.unitCost || 0, totalCost: (i.qtyReceived || 0) * (i.unitCost || 0), unit: i.unit || "pcs" })) },
      },
      include: { items: true },
    });

    // Update qtyReceived on PO items
    for (const item of items) {
      await tx.purchaseOrderItem.update({
        where: { id: item.purchaseOrderItemId },
        data: { qtyReceived: { increment: item.qtyReceived || 0 } },
      });
    }

    // Update stock + create cost tracking
    for (const item of items) {
      const qty = item.qtyReceived || 0;
      const unitCost = item.unitCost || 0;
      if (!qty) continue;

      if (warehouseId) {
        // Receive to WAREHOUSE
        const ws = await tx.warehouseStock.findFirst({
          where: { warehouseId, inventoryItemId: item.inventoryItemId },
        });
        if (ws) {
          await tx.warehouseStock.update({
            where: { id: ws.id },
            data: { currentStock: { increment: qty } },
          });
        } else {
          await tx.warehouseStock.create({
            data: { warehouseId, inventoryItemId: item.inventoryItemId, currentStock: qty },
          });
        }
        // Warehouse movement
        await tx.warehouseMovement.create({
          data: {
            warehouseId, inventoryItemId: item.inventoryItemId, performedById: user.id,
            type: "IN", quantity: qty, referenceType: "GOODS_RECEIPT", referenceId: gr.id,
            notes: `GR: ${gr.grNumber}`,
          },
        });
      } else {
        // Receive to BRANCH (existing behavior)
        const bi = await tx.branchInventoryItem.findFirst({
          where: { branchId, inventoryItemId: item.inventoryItemId },
        });
        if (bi) {
          await tx.branchInventoryItem.update({
            where: { id: bi.id }, data: { currentStock: { increment: qty } },
          });
        } else {
          await tx.branchInventoryItem.create({
            data: { branchId, inventoryItemId: item.inventoryItemId, currentStock: qty },
          });
        }
      }

      // COST TRACKING — always create regardless of warehouse/branch
      if (unitCost > 0) {
        const lot = await createPurchaseLot(tx, {
          branchId: costBranchId,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          sourceType: "PURCHASE",
          sourceId: gr.id,
          purchasedQty: qty,  // qty = total quantity purchased
          unitCost: Math.round(unitCost),
          totalCost: Math.round(qty * unitCost),
          note: `GR: ${gr.grNumber}${warehouseId ? ' (depo)' : ''}`,
        });
        await recordCostHistory(tx, {
          branchId: costBranchId,
          inventoryItemId: item.inventoryItemId,
          movementType: "IN",
          sourceType: "PURCHASE",
          sourceId: gr.id,
          qty: qty,
          unitCost: Math.round(unitCost),
          totalCost: Math.round(qty * unitCost),
          performedById: user.id,
          itemPurchaseLotId: lot?.id || null,
          note: `GR: ${gr.grNumber}`,
        });
      }

      // Inventory movement
      await tx.inventoryMovement.create({
        data: {
          branchId: costBranchId,
          warehouseId: warehouseId || null,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          type: "PURCHASE",
          quantity: qty,
          referenceType: "GOODS_RECEIPT",
          referenceId: gr.id,
          notes: `GR: ${gr.grNumber}`,
        },
      });
    }

    // Check if PO is fully received
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId } });
    const allReceived = updatedItems.every((i) => Number(i.qtyReceived) >= Number(i.qty));
    if (allReceived) {
      await tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "RECEIVED" } });
    } else {
      await tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "PARTIALLY_RECEIVED" } });
    }

    return tx.goodsReceipt.findUnique({
      where: { id: gr.id },
      include: { purchaseOrder: { include: { supplier: true, warehouse: true } }, branch: true, warehouse: true, receivedBy: true, items: { include: { inventoryItem: true } } },
    });
  });
};
