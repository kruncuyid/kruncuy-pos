const prisma = require("../../core/config/prisma");

function generatePRNumber() {
  const d = new Date();
  return `PR-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(Date.now()).slice(-5)}`;
}

exports.list = async (user, branchContext, query = {}) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.branchId) where.branchId = query.branchId;
  else if (branchContext?.branchId) where.branchId = branchContext.branchId;

  return prisma.purchaseRequest.findMany({
    where,
    include: { branch: true, requestedBy: true, approvedBy: true, items: { include: { inventoryItem: true } } },
    orderBy: { createdAt: "desc" },
  });
};

exports.getById = async (id) => {
  const pr = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: { branch: true, requestedBy: true, approvedBy: true, items: { include: { inventoryItem: true } } },
  });
  if (!pr) { const e = new Error("PR tidak ditemukan"); e.statusCode = 404; throw e; }
  return pr;
};

exports.create = async (user, payload) => {
  const { items = [], notes } = payload;
  if (!items.length) { const e = new Error("Minimal 1 item"); e.statusCode = 400; throw e; }

  return prisma.$transaction(async (tx) => {
    const pr = await tx.purchaseRequest.create({
      data: {
        prNumber: generatePRNumber(),
        branchId: user.branchId,
        requestedById: user.id,
        notes,
        items: {
          create: items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            qty: item.qty || 0,
            unit: item.unit || "pcs",
            notes: item.notes,
          })),
        },
      },
      include: { items: { include: { inventoryItem: true } }, branch: true, requestedBy: true },
    });
    return pr;
  });
};

exports.submit = async (id, user) => {
  const pr = await exports.getById(id);
  if (pr.status !== "DRAFT") { const e = new Error("Hanya DRAFT yang bisa disubmit"); e.statusCode = 400; throw e; }
  return prisma.purchaseRequest.update({ where: { id }, data: { status: "SUBMITTED" } });
};

exports.approve = async (id, user, payload = {}) => {
  const pr = await exports.getById(id);
  if (pr.status !== "SUBMITTED") { const e = new Error("Hanya SUBMITTED yang bisa diapprove"); e.statusCode = 400; throw e; }
  return prisma.purchaseRequest.update({
    where: { id },
    data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date(), approvalNote: payload.approvalNote },
  });
};

exports.reject = async (id, user, payload = {}) => {
  return prisma.purchaseRequest.update({
    where: { id },
    data: { status: "REJECTED", approvedById: user.id, approvedAt: new Date(), approvalNote: payload.approvalNote },
  });
};
