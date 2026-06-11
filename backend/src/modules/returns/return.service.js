const prisma = require("../../core/config/prisma");
const crypto = require("crypto");
const accessControlService = require("../../core/services/accessControl.service");

function generateReturnNumber() {
  const d = new Date();
  return `RT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function buildBranchWhere(user, branchContext) {
  const branchId = branchContext?.branchId || user?.branchId || null;
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user?.role);

  if (hasGlobalAccess && !branchId) {
    return {};
  }

  if (!branchId) {
    return {};
  }

  return { branchId };
}

exports.list = async (user, branchContext, query = {}) => {
  const branchWhere = await buildBranchWhere(user, branchContext);
  const where = { ...branchWhere };
  if (query.status) where.status = query.status;
  if (query.supplierId) where.supplierId = query.supplierId;
  return prisma.purchaseReturn.findMany({
    where,
    include: { supplier: true, branch: true, returnedBy: true, items: { include: { inventoryItem: true } } },
    orderBy: { returnDate: "desc" },
  });
};

exports.getById = async (id) => {
  const ret = await prisma.purchaseReturn.findUnique({
    where: { id },
    include: { supplier: true, branch: true, returnedBy: true, items: { include: { inventoryItem: true } } },
  });
  if (!ret) { const e = new Error("Return tidak ditemukan"); e.statusCode = 404; throw e; }
  return ret;
};

exports.create = async (user, branchContext, payload) => {
  const { supplierId, purchaseOrderId, reason, items = [], notes } = payload;
  if (!supplierId || !reason || !items.length) { const e = new Error("Supplier, alasan, dan minimal 1 item wajib"); e.statusCode = 400; throw e; }

  return prisma.$transaction(async (tx) => {
    const branchId = branchContext?.branchId || user.branchId;
    const ret = await tx.purchaseReturn.create({
      data: {
        returnNumber: generateReturnNumber(),
        supplierId,
        branchId,
        purchaseOrderId: purchaseOrderId || null,
        returnedById: user.id,
        reason,
        notes,
        items: { create: items.map((i) => ({ inventoryItemId: i.inventoryItemId, qty: i.qty || 0, unit: i.unit || "pcs", unitCost: i.unitCost || 0, totalCost: (i.qty || 0) * (i.unitCost || 0), reason: i.reason })) },
      },
      include: { items: true, supplier: true },
    });

    // Decrease inventory stock
    for (const item of items) {
      const branchItem = await tx.branchInventoryItem.findFirst({
        where: { branchId, inventoryItemId: item.inventoryItemId },
      });
      if (branchItem) {
        await tx.branchInventoryItem.update({
          where: { id: branchItem.id },
          data: { currentStock: { decrement: item.qty || 0 } },
        });
      }
      await tx.inventoryMovement.create({
        data: {
          branchId,
          inventoryItemId: item.inventoryItemId,
          performedById: user.id,
          type: "WASTE",
          quantity: -(item.qty || 0),
          referenceType: "PURCHASE_RETURN",
          referenceId: ret.id,
          notes: `Return: ${reason}`,
        },
      });
    }
    return ret;
  });
};

exports.approve = async (id, payload = {}) => {
  return prisma.purchaseReturn.update({ where: { id }, data: { status: "APPROVED", notes: payload.notes } });
};
