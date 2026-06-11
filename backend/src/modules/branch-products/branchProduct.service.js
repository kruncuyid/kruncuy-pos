const prisma = require("../../core/config/prisma");
const accessControlService = require("../../core/services/accessControl.service");

async function resolveBranchWhere(user, branchContext) {
  const branchId = branchContext?.branchId || user.branchId || null;
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);

  if (hasGlobalAccess && !branchId) {
    return {};
  }

  if (!branchId) {
    return {};
  }

  return { branchId };
}

async function resolveAccessibleBranches(user, branchContext) {
  const branchWhere = await resolveBranchWhere(user, branchContext);
  const branchId = branchWhere.branchId;

  return prisma.branch.findMany({
    where: {
      ...(branchId ? { id: branchId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

async function resolveTargetBranchIds(user, branchContext, payload) {
  const branches = await resolveAccessibleBranches(user, branchContext);
  const branchIds = branches.map((branch) => branch.id);
  const targetMode = String(payload?.targetMode || "ALL").toUpperCase();

  if (targetMode === "ALL") {
    return branchIds;
  }

  if (targetMode === "SINGLE") {
    const branchId = payload?.branchId;
    if (!branchId) {
      throw new Error("Branch wajib dipilih untuk mode outlet spesifik");
    }

    if (!branchIds.includes(branchId)) {
      throw new Error("Branch yang dipilih tidak tersedia");
    }

    return [branchId];
  }

  if (targetMode === "MULTI") {
    const selectedBranchIds = Array.isArray(payload?.branchIds)
      ? payload.branchIds.filter(Boolean)
      : [];
    const filteredBranchIds = selectedBranchIds.filter((branchId) => branchIds.includes(branchId));

    if (!filteredBranchIds.length) {
      throw new Error("Minimal satu outlet harus dipilih");
    }

    return filteredBranchIds;
  }

  throw new Error("Mode target outlet tidak valid");
}

exports.getBranchProducts = async (user, branchContext) => {
  const branchWhere = await resolveBranchWhere(user, branchContext);

  return prisma.branchProduct.findMany({
    where: branchWhere,
    include: {
      branch: true,
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

exports.getBranchPricingCatalog = async (user, branchContext) => {
  const branchWhere = await resolveBranchWhere(user, branchContext);

  const [branches, products, branchProducts, branchMenuVariants] = await Promise.all([
    prisma.branch.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: [
        {
          category: {
            sortOrder: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.branchProduct.findMany({
      where: branchWhere,
      include: {
        branch: true,
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.branchMenuVariant.findMany({
      where: branchWhere,
      include: {
        branch: true,
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  return {
    branches,
    products,
    branchProducts,
    branchMenuVariants,
  };
};

exports.getBranchMenuVariants = async (user, branchContext) => {
  const branchWhere = await resolveBranchWhere(user, branchContext);

  return prisma.branchMenuVariant.findMany({
    where: branchWhere,
    include: {
      branch: true,
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: [
      {
        branch: {
          name: "asc",
        },
      },
      {
        salesChannel: "asc",
      },
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
};

exports.getProductsByBranch = async (branchId) => {
  return prisma.branchProduct.findMany({
    where: {
      branchId,
      isActive: true,
      isAvailable: true,
      product: {
        isActive: true,
      },
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      product: {
        createdAt: "asc",
      },
    },
  });
};

exports.getBranchProductById = async (id) => {
  return prisma.branchProduct.findUnique({
    where: { id },
    include: {
      branch: true,
      product: {
        include: {
          category: true,
        },
      },
    },
  });
};

exports.getBranchMenuVariantById = async (id) => {
  return prisma.branchMenuVariant.findUnique({
    where: { id },
    include: {
      branch: true,
      product: {
        include: {
          category: true,
        },
      },
    },
  });
};

exports.createBranchProduct = async (payload) => {
  return prisma.branchProduct.create({
    data: {
      branchId: payload.branchId,
      productId: payload.productId,
      price: Number(payload.price || 0),
      isAvailable: payload.isAvailable ?? true,
      isActive: payload.isActive ?? true,
    },
  });
};

exports.createBranchMenuVariant = async (payload) => {
  return prisma.branchMenuVariant.create({
    data: {
      branchId: payload.branchId,
      productId: payload.productId,
      salesChannel: payload.salesChannel,
      onlinePlatform: payload.onlinePlatform || null,
      displayName: payload.displayName || null,
      price: payload.price !== undefined ? Number(payload.price) : null,
      pcs:
        payload.pcs !== undefined && payload.pcs !== null && payload.pcs !== ""
          ? Number(payload.pcs)
          : null,
      isAvailable: payload.isAvailable ?? true,
      isActive: payload.isActive ?? true,
      promoLabel: payload.promoLabel || null,
      sortOrder: Number(payload.sortOrder || 0),
    },
  });
};

exports.bulkApplyBranchProducts = async (user, branchContext, payload) => {
  const targetBranchIds = await resolveTargetBranchIds(user, branchContext, payload);
  const productId = payload?.productId;

  if (!productId) {
    throw new Error("Menu wajib dipilih");
  }

  const price = Number(payload?.price || 0);
  const isAvailable = payload?.isAvailable ?? true;
  const isActive = payload?.isActive ?? true;

  const records = await prisma.$transaction(
    targetBranchIds.map((branchId) =>
      prisma.branchProduct.upsert({
        where: {
          branchId_productId: {
            branchId,
            productId,
          },
        },
        create: {
          branchId,
          productId,
          price,
          isAvailable,
          isActive,
        },
        update: {
          price,
          isAvailable,
          isActive,
        },
        include: {
          branch: true,
          product: {
            include: {
              category: true,
            },
          },
        },
      })
    )
  );

  return {
    appliedCount: records.length,
    targetBranchIds,
    records,
  };
};

exports.bulkApplyBranchMenuVariants = async (user, branchContext, payload) => {
  const targetBranchIds = await resolveTargetBranchIds(user, branchContext, payload);
  const productId = payload?.productId;

  if (!productId) {
    throw new Error("Menu wajib dipilih");
  }

  const salesChannel = payload?.salesChannel || "ONLINE";
  const onlinePlatform = payload?.onlinePlatform;

  if (!onlinePlatform) {
    throw new Error("Platform online wajib dipilih");
  }

  const displayName = payload?.displayName?.trim() || null;
  const price =
    payload?.price !== undefined && payload?.price !== null && payload?.price !== ""
      ? Number(payload.price)
      : null;
  const pcs =
    payload?.pcs !== undefined && payload?.pcs !== null && payload?.pcs !== ""
      ? Number(payload.pcs)
      : null;
  const isAvailable = payload?.isAvailable ?? true;
  const isActive = payload?.isActive ?? true;
  const promoLabel = payload?.promoLabel?.trim() || null;
  const sortOrder = Number(payload?.sortOrder || 0);

  const records = await prisma.$transaction(
    targetBranchIds.map((branchId) =>
      prisma.branchMenuVariant.upsert({
        where: {
          branchId_productId_salesChannel_onlinePlatform: {
            branchId,
            productId,
            salesChannel,
            onlinePlatform,
          },
        },
        create: {
          branchId,
          productId,
          salesChannel,
          onlinePlatform,
          displayName,
          price,
          pcs,
          isAvailable,
          isActive,
          promoLabel,
          sortOrder,
        },
        update: {
          displayName,
          price,
          pcs,
          isAvailable,
          isActive,
          promoLabel,
          sortOrder,
          salesChannel,
          onlinePlatform,
        },
        include: {
          branch: true,
          product: {
            include: {
              category: true,
            },
          },
        },
      })
    )
  );

  return {
    appliedCount: records.length,
    targetBranchIds,
    records,
  };
};

exports.updateBranchProduct = async (id, payload) => {
  return prisma.branchProduct.update({
    where: { id },
    data: {
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      isAvailable: payload.isAvailable,
      isActive: payload.isActive,
    },
  });
};

exports.updateBranchMenuVariant = async (id, payload) => {
  return prisma.branchMenuVariant.update({
    where: { id },
    data: {
      displayName: payload.displayName,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      pcs:
        payload.pcs !== undefined && payload.pcs !== null && payload.pcs !== ""
          ? Number(payload.pcs)
          : undefined,
      isAvailable: payload.isAvailable,
      isActive: payload.isActive,
      promoLabel: payload.promoLabel,
      sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
      onlinePlatform: payload.onlinePlatform || null,
      salesChannel: payload.salesChannel,
    },
  });
};

exports.deleteBranchProduct = async (id) => {
  return prisma.branchProduct.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

exports.deleteBranchMenuVariant = async (id) => {
  return prisma.branchMenuVariant.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};
