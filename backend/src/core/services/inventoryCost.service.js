function toDecimalString(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric.toFixed(3) : "0.000";
}

function toInt(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

async function createPurchaseLot(client, {
  branchId,
  inventoryItemId,
  performedById = null,
  sourceType,
  sourceId = null,
  sourceItemId = null,
  purchasedQty,
  unitCost,
  totalCost,
  note = null,
}) {
  return client.itemPurchaseLot.create({
    data: {
      branchId,
      inventoryItemId,
      performedById,
      sourceType,
      sourceId,
      sourceItemId,
      purchasedQty: toDecimalString(purchasedQty),
      remainingQty: toDecimalString(purchasedQty),
      unitCost: toInt(unitCost),
      totalCost: toInt(totalCost),
      note,
      isActive: true,
    },
  });
}

async function recordCostHistory(client, {
  branchId,
  inventoryItemId,
  itemPurchaseLotId = null,
  performedById = null,
  sourceType,
  sourceId = null,
  sourceItemId = null,
  movementType,
  quantity,
  unitCost = null,
  totalCost,
  resultingUnitCost = null,
  note = null,
}) {
  return client.inventoryCostHistory.create({
    data: {
      branchId,
      inventoryItemId,
      itemPurchaseLotId,
      performedById,
      sourceType,
      sourceId,
      sourceItemId,
      movementType,
      quantity: toDecimalString(quantity),
      unitCost: unitCost === null || unitCost === undefined ? null : toInt(unitCost),
      totalCost: toInt(totalCost),
      resultingUnitCost:
        resultingUnitCost === null || resultingUnitCost === undefined ? null : toInt(resultingUnitCost),
      note,
    },
  });
}

async function voidPurchaseLots(client, {
  branchId,
  sourceType,
  sourceId,
  voidSourceType,
  sourceItemId = null,
  inventoryItemId = null,
  performedById = null,
  note = null,
}) {
  const lots = await client.itemPurchaseLot.findMany({
    where: {
      branchId,
      sourceType,
      sourceId,
      ...(sourceItemId ? { sourceItemId } : {}),
      ...(inventoryItemId ? { inventoryItemId } : {}),
      isActive: true,
    },
  });

  if (!lots.length) {
    return [];
  }

  await client.itemPurchaseLot.updateMany({
    where: {
      id: { in: lots.map((lot) => lot.id) },
    },
    data: {
      isActive: false,
      remainingQty: "0.000",
    },
  });

  for (const lot of lots) {
    await recordCostHistory(client, {
      branchId,
      inventoryItemId: lot.inventoryItemId,
      itemPurchaseLotId: lot.id,
      performedById,
      sourceType: voidSourceType || "MANUAL_ADJUSTMENT",
      sourceId,
      sourceItemId: lot.sourceItemId,
      movementType: "OUT",
      quantity: lot.remainingQty,
      unitCost: lot.unitCost,
      totalCost: lot.totalCost,
      resultingUnitCost: lot.unitCost,
      note,
    });
  }

  return lots;
}

async function getLatestUnitCost(client, branchId, inventoryItemId) {
  const [latestHistory, latestLot] = await Promise.all([
    client.inventoryCostHistory.findFirst({
      where: {
        branchId,
        inventoryItemId,
        resultingUnitCost: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    client.itemPurchaseLot.findFirst({
      where: {
        branchId,
        inventoryItemId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (latestHistory?.resultingUnitCost !== null && latestHistory?.resultingUnitCost !== undefined) {
    return Number(latestHistory.resultingUnitCost || 0);
  }

  if (latestLot?.unitCost !== null && latestLot?.unitCost !== undefined) {
    return Number(latestLot.unitCost || 0);
  }

  return 0;
}

module.exports = {
  createPurchaseLot,
  recordCostHistory,
  voidPurchaseLots,
  getLatestUnitCost,
};
