const prisma = require("../../core/config/prisma");

exports.getProductCategories = async () => {
  return prisma.productCategory.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
};

exports.getProductCategoryById = async (id) => {
  return prisma.productCategory.findUnique({
    where: { id },
  });
};

exports.createProductCategory = async (payload) => {
  return prisma.productCategory.create({
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
      sortOrder: Number(payload.sortOrder || 0),
      isActive: payload.isActive ?? true,
    },
  });
};

exports.updateProductCategory = async (id, payload) => {
  return prisma.productCategory.update({
    where: { id },
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      sortOrder:
        payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
      isActive: payload.isActive,
    },
  });
};

exports.deleteProductCategory = async (id) => {
  return prisma.productCategory.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};
