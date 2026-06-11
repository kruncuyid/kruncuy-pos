const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const inventoryController = require("./inventory.controller");

router.use(requireAuth, requirePermission("inventory:read"));

router.get("/items", inventoryController.getInventoryItems);
router.post("/items", requirePermission("inventory:write"), inventoryController.createInventoryItem);
router.patch("/items/:id", requirePermission("inventory:write"), inventoryController.updateInventoryItem);
router.get("/branches/:branchId/items", inventoryController.getBranchInventory);
router.put("/branches/:branchId/items", requirePermission("inventory:write"), inventoryController.updateBranchInventory);
router.get("/menu-recipes", inventoryController.getMenuRecipes);
router.put("/menu-recipes/:productId", requirePermission("inventory:write"), inventoryController.upsertMenuRecipe);

module.exports = router;
