const test = require("node:test");
const assert = require("node:assert/strict");
const { getPrisma } = require("./helpers/setup");

test("inventory: list items returns data", async () => {
  const inventoryService = require("../src/modules/inventory/inventory.service");
  const result = await inventoryService.listInventoryItems({ page: 1, limit: 10 });
  assert.ok(result.data);
  assert.ok(Array.isArray(result.data));
  assert.ok(result.meta);
  assert.equal(result.meta.page, 1);
});

test("inventory: branch stock exists for seed data", async () => {
  const p = getPrisma();
  const branch = await p.branch.findFirst();
  const stocks = await p.branchInventoryItem.findMany({
    where: { branchId: branch.id, isActive: true },
    include: { inventoryItem: true },
  });

  assert.ok(stocks.length > 0);
  assert.ok(stocks.some((s) => Number(s.currentStock) > 0));
});

test("inventory: menu recipe consumption logic", async () => {
  const p = getPrisma();
  const recipe = await p.menuRecipe.findFirst({
    where: { isActive: true },
    include: { items: true },
  });

  if (recipe) {
    assert.ok(recipe.items.length > 0);
    assert.ok(recipe.items.every((i) => Number(i.qtyPerUnit) > 0));
  }
});
