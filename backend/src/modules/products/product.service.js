const prisma = require("../../core/config/prisma");
const { parsePagination } = require("../../core/utils/pagination");

exports.getProducts = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, code: true, name: true, price: true, pcs: true, imageUrl: true, isActive: true, createdAt: true, category: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      branchProducts: true,
    },
  });
};

exports.createProduct = async (payload) => {
  return prisma.product.create({
    data: {
      name: payload.name,
      code: payload.code,
      price: Number(payload.price || 0),
      pcs: Number(payload.pcs || 0),
      categoryId: payload.categoryId,
      isActive: payload.isActive ?? true,
    },
  });
};

exports.updateProduct = async (id, payload) => {
  return prisma.product.update({
    where: { id },
    data: {
      name: payload.name,
      code: payload.code,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      pcs: payload.pcs !== undefined ? Number(payload.pcs) : undefined,
      categoryId: payload.categoryId,
      isActive: payload.isActive,
    },
  });
};

exports.deleteProduct = async (id) => {
  return prisma.product.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};
