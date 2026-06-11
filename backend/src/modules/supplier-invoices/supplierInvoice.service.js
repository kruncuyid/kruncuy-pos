const prisma = require("../../core/config/prisma");
const { parsePagination } = require("../../core/utils/pagination");

exports.list = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.supplierId) where.supplierId = query.supplierId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { invoiceNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.startDate || query.endDate) {
    where.createdAt = {
      ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
      ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.supplierInvoice.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, invoiceNumber: true, totalAmount: true, paidAmount: true,
        dueDate: true, status: true, notes: true, createdAt: true,
        supplier: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierInvoice.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.getById = async (id) => {
  const invoice = await prisma.supplierInvoice.findUnique({
    where: { id },
    include: {
      supplier: true,
      branch: true,
      purchaseOrder: true,
      payments: true,
    },
  });
  if (!invoice) {
    const e = new Error("Invoice tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }
  return invoice;
};

exports.create = async (payload) => {
  const { supplierId, branchId, invoiceNumber, purchaseOrderId, totalAmount, dueDate, notes } = payload;
  if (!supplierId || !branchId || !invoiceNumber || !totalAmount || !dueDate) {
    const e = new Error("Supplier, branch, nomor invoice, total, dan jatuh tempo wajib");
    e.statusCode = 400;
    throw e;
  }

  return prisma.supplierInvoice.create({
    data: {
      supplierId, branchId, invoiceNumber,
      purchaseOrderId: purchaseOrderId || null,
      totalAmount: Number(totalAmount),
      dueDate: new Date(dueDate),
      notes: notes || null,
    },
  });
};

exports.update = async (id, payload) => {
  const existing = await prisma.supplierInvoice.findUnique({ where: { id } });
  if (!existing) {
    const e = new Error("Invoice tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }

  return prisma.supplierInvoice.update({
    where: { id },
    data: {
      ...(payload.totalAmount ? { totalAmount: Number(payload.totalAmount) } : {}),
      ...(payload.dueDate ? { dueDate: new Date(payload.dueDate) } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
  });
};

exports.remove = async (id) => {
  const existing = await prisma.supplierInvoice.findUnique({ where: { id } });
  if (!existing) {
    const e = new Error("Invoice tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }
  return prisma.supplierInvoice.delete({ where: { id } });
};

// === PAYMENT ===

exports.listPayments = async (invoiceId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { supplierInvoiceId: invoiceId };

  const [data, total] = await Promise.all([
    prisma.supplierPayment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
    }),
    prisma.supplierPayment.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.createPayment = async (invoiceId, payload) => {
  const invoice = await prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    const e = new Error("Invoice tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }

  const { amount, paymentMethod, notes } = payload;
  if (!amount) {
    const e = new Error("Jumlah pembayaran wajib diisi");
    e.statusCode = 400;
    throw e;
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.supplierPayment.create({
      data: {
        supplierInvoiceId: invoiceId,
        amount: Number(amount),
        paymentMethod: paymentMethod || "TRANSFER",
        notes: notes || null,
      },
    });

    // Update paid amount and status
    const totalPaid = await tx.supplierPayment.aggregate({
      where: { supplierInvoiceId: invoiceId },
      _sum: { amount: true },
    });

    const paidSoFar = totalPaid._sum.amount || 0;
    const newStatus = paidSoFar >= invoice.totalAmount ? "PAID" : "PARTIAL";

    await tx.supplierInvoice.update({
      where: { id: invoiceId },
      data: { paidAmount: paidSoFar, status: newStatus },
    });

    return payment;
  });
};
