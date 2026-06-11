const prisma = require("../../core/config/prisma");

async function listInventoryItems(query = {}) {
  const { parsePagination } = require("../../core/utils/pagination");
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (query.type) where.type = query.type;
  if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      include: {
        branchInventoryItems: {
          include: { branch: { select: { id: true, name: true } } },
        },
        recipeItems: { select: { id: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createInventoryItem(payload) {
  return prisma.inventoryItem.create({
    data: {
      name: payload.name,
      code: payload.code,
      unit: payload.unit,
      type: payload.type,
      description: payload.description || null,
      isActive: payload.isActive ?? true,
      isPurchasable: payload.isPurchasable ?? true,
      isOpnameRequired: payload.isOpnameRequired ?? true,
    },
  });
}

async function updateInventoryItem(id, payload) {
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      name: payload.name,
      code: payload.code,
      unit: payload.unit,
      type: payload.type,
      description: payload.description || null,
      isActive: payload.isActive ?? true,
      isPurchasable: payload.isPurchasable ?? true,
      isOpnameRequired: payload.isOpnameRequired ?? true,
    },
  });
}

async function listBranchInventory(branchId) {
  return prisma.branchInventoryItem.findMany({
    where: {
      branchId,
    },
    include: {
      branch: true,
      inventoryItem: true,
    },
    orderBy: {
      inventoryItem: {
        name: "asc",
      },
    },
  });
}

async function upsertBranchInventory(branchId, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const item of items) {
      if (!item.inventoryItemId) continue;

      const result = await tx.branchInventoryItem.upsert({
        where: {
          branchId_inventoryItemId: {
            branchId,
            inventoryItemId: item.inventoryItemId,
          },
        },
        update: {
          currentStock: item.currentStock ?? 0,
          minStock: item.minStock ?? null,
          maxStock: item.maxStock ?? null,
          isOpnameRequired: item.isOpnameRequired ?? true,
          isActive: item.isActive ?? true,
        },
        create: {
          branchId,
          inventoryItemId: item.inventoryItemId,
          currentStock: item.currentStock ?? 0,
          minStock: item.minStock ?? null,
          maxStock: item.maxStock ?? null,
          isOpnameRequired: item.isOpnameRequired ?? true,
          isActive: item.isActive ?? true,
        },
        include: {
          branch: true,
          inventoryItem: true,
        },
      });

      results.push(result);
    }

    return results;
  });
}

async function listMenuRecipes() {
  return prisma.menuRecipe.findMany({
    include: {
      product: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });
}

async function upsertMenuRecipe(productId, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return prisma.$transaction(async (tx) => {
    const recipe = await tx.menuRecipe.upsert({
      where: {
        productId,
      },
      update: {
        version: payload.version || 1,
        yieldQty: payload.yieldQty ?? 1,
        notes: payload.notes || null,
        isActive: payload.isActive ?? true,
      },
      create: {
        productId,
        version: payload.version || 1,
        yieldQty: payload.yieldQty ?? 1,
        notes: payload.notes || null,
        isActive: payload.isActive ?? true,
      },
    });

    await tx.menuRecipeItem.deleteMany({
      where: {
        recipeId: recipe.id,
      },
    });

    for (const item of items) {
      const invId = item.inventoryItemId || null;
      const subId = item.subRecipeId || null;
      if (!invId && !subId) continue;

      // Resolve subRecipeId from product to actual menuRecipe
      let resolvedSubId = subId;
      if (subId) {
        const subRecipe = await tx.menuRecipe.findUnique({ where: { productId: subId } });
        if (!subRecipe) continue;
        resolvedSubId = subRecipe.id;
      }

      await tx.menuRecipeItem.create({
        data: {
          recipeId: recipe.id,
          inventoryItemId: invId,
          subRecipeId: resolvedSubId,
          qtyPerUnit: item.qtyPerUnit ?? 0,
          notes: item.notes || null,
        },
      });
    }

    return tx.menuRecipe.findUnique({
      where: { id: recipe.id },
      include: {
        product: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  });
}

module.exports = {
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  listBranchInventory,
  upsertBranchInventory,
  listMenuRecipes,
  upsertMenuRecipe,
};
