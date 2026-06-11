const prisma = require("../../core/config/prisma");
const { parsePagination } = require("../../core/utils/pagination");

exports.list = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.phone) where.phone = { contains: query.phone };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.getById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, invoiceNumber: true, totalAmount: true, totalPcs: true,
          paymentMethod: true, status: true, createdAt: true,
          branch: { select: { id: true, name: true } },
          cashier: { select: { id: true, name: true } },
          items: { select: { id: true, productName: true, qty: true, price: true, subtotal: true } },
        },
      },
    },
  });

  if (!customer) {
    const e = new Error("Customer tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }

  return customer;
};

exports.create = async (payload) => {
  const { name, phone, email, notes } = payload;
  if (!name || !name.trim()) {
    const e = new Error("Nama customer wajib diisi");
    e.statusCode = 400;
    throw e;
  }

  return prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
};

exports.update = async (id, payload) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    const e = new Error("Customer tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }

  return prisma.customer.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone?.trim() || null } : {}),
      ...(payload.email !== undefined ? { email: payload.email?.trim() || null } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes?.trim() || null } : {}),
    },
  });
};

exports.remove = async (id) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    const e = new Error("Customer tidak ditemukan");
    e.statusCode = 404;
    throw e;
  }

  // Customers with transactions cannot be deleted (FK constraint)
  return prisma.customer.delete({ where: { id } });
};
