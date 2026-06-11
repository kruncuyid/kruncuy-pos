const prisma = require("../../core/config/prisma");
const crypto = require("crypto");

function generatePONumber() {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

exports.list = async (user, branchContext, query = {}) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.supplierId) where.supplierId = query.supplierId;
  if (query.branchId) where.branchId = query.branchId;
  else if (branchContext?.branchId) where.branchId = branchContext.branchId;

  return prisma.purchaseOrder.findMany({
    where,
    include: { supplier: true, branch: true, warehouse: true, createdBy: true, approvedBy: true, purchaseRequest: true, items: { include: { inventoryItem: true } } },
    orderBy: { createdAt: "desc" },
  });
};

exports.getById = async (id) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, branch: true, warehouse: true, createdBy: true, approvedBy: true, purchaseRequest: true, items: { include: { inventoryItem: true } } },
  });
  if (!po) { const e = new Error("PO tidak ditemukan"); e.statusCode = 404; throw e; }
  return po;
};

exports.create = async (user, payload) => {
  const { supplierId, purchaseRequestId, expectedDate, items = [], notes, warehouseId } = payload;
  if (!supplierId || !items.length) { const e = new Error("Supplier dan minimal 1 item wajib diisi"); e.statusCode = 400; throw e; }

  return prisma.$transaction(async (tx) => {
    const totalAmount = items.reduce((sum, i) => sum + (Number(i.qty || 0) * Number(i.unitPrice || 0)), 0);
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber: generatePONumber(),
        supplierId,
        branchId: user.branchId || payload.branchId,
        warehouseId: warehouseId || null,
        purchaseRequestId: purchaseRequestId || null,
        createdById: user.id,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        totalAmount,
        items: { create: items.map((i) => ({ inventoryItemId: i.inventoryItemId, qty: i.qty || 0, unitPrice: i.unitPrice || 0, totalPrice: (i.qty || 0) * (i.unitPrice || 0), unit: i.unit || "pcs", notes: i.notes })) },
      },
      include: { items: true, supplier: true, warehouse: true },
    });
    if (purchaseRequestId) {
      await tx.purchaseRequest.update({ where: { id: purchaseRequestId }, data: { status: "ORDERED" } });
    }
    return po;
  });
};

exports.submit = async (id) => {
  const po = await exports.getById(id);
  if (po.status !== "DRAFT") { const e = new Error("Hanya DRAFT"); e.statusCode = 400; throw e; }
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "SENT" } });
};

exports.approve = async (id, user, payload = {}) => {
  const po = await exports.getById(id);
  if (po.status !== "SENT") { const e = new Error("Hanya SENT"); e.statusCode = 400; throw e; }
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date(), approvalNote: payload.approvalNote } });
};

exports.receive = async (id) => {
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED" } });
};

exports.cancel = async (id, payload = {}) => {
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED", notes: payload.notes } });
};
