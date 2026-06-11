const prisma = require("../../core/config/prisma");

async function listWarehouses() {
  return prisma.warehouse.findMany({
    include: {
      branch: true,
      stocks: {
        include: {
          inventoryItem: true,
        },
        orderBy: {
          inventoryItem: {
            name: "asc",
          },
        },
      },
    },
    orderBy: [
      {
        isActive: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
}

async function getWarehouseById(id) {
  return prisma.warehouse.findUnique({
    where: { id },
    include: {
      branch: true,
      stocks: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

async function createWarehouse(payload) {
  return prisma.warehouse.create({
    data: {
      name: payload.name,
      code: payload.code,
      address: payload.address || null,
      branchId: payload.branchId || null,
      isActive: payload.isActive ?? true,
    },
    include: {
      branch: true,
      stocks: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

async function updateWarehouse(id, payload) {
  return prisma.warehouse.update({
    where: { id },
    data: {
      name: payload.name,
      code: payload.code,
      address: payload.address || null,
      branchId: payload.branchId || null,
      isActive: payload.isActive ?? true,
    },
    include: {
      branch: true,
      stocks: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

async function listWarehouseStocks(warehouseId) {
  return prisma.warehouseStock.findMany({
    where: { warehouseId },
    include: {
      warehouse: true,
      inventoryItem: true,
    },
    orderBy: {
      inventoryItem: {
        name: "asc",
      },
    },
  });
}

async function upsertWarehouseStocks(warehouseId, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const item of items) {
      if (!item.inventoryItemId) continue;

      const result = await tx.warehouseStock.upsert({
        where: {
          warehouseId_inventoryItemId: {
            warehouseId,
            inventoryItemId: item.inventoryItemId,
          },
        },
        update: {
          currentStock: item.currentStock ?? 0,
          minStock: item.minStock ?? null,
          maxStock: item.maxStock ?? null,
          isActive: item.isActive ?? true,
        },
        create: {
          warehouseId,
          inventoryItemId: item.inventoryItemId,
          currentStock: item.currentStock ?? 0,
          minStock: item.minStock ?? null,
          maxStock: item.maxStock ?? null,
          isActive: item.isActive ?? true,
        },
        include: {
          warehouse: true,
          inventoryItem: true,
        },
      });

      results.push(result);
    }

    return results;
  });
}

module.exports = {
  listWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  listWarehouseStocks,
  upsertWarehouseStocks,
};
