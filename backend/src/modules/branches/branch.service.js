const prisma = require("../../core/config/prisma");

exports.getBranches = async () => {
  return prisma.branch.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });
};

exports.getBranchById = async (id) => {
  return prisma.branch.findUnique({
    where: { id },
  });
};

exports.createBranch = async (payload) => {
  return prisma.branch.create({
    data: {
      name: payload.name,
      code: payload.code,
      address: payload.address || null,
      isActive: payload.isActive ?? true,
    },
  });
};

exports.updateBranch = async (id, payload) => {
  return prisma.branch.update({
    where: { id },
    data: {
      lat: payload.lat !== undefined ? Number(payload.lat) : undefined,
      lng: payload.lng !== undefined ? Number(payload.lng) : undefined,
      name: payload.name,
      code: payload.code,
      address: payload.address,
      isActive: payload.isActive,
    },
  });
};

exports.deleteBranch = async (id) => {
  return prisma.branch.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};
