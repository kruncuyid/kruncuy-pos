const express = require("express");
const controller = require("./warehouse.controller");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");

const router = express.Router();
router.use(requireAuth);

router.get("/", requirePermission("inventory:read"), controller.list);
router.get("/:id", requirePermission("inventory:read"), controller.detail);
router.post("/", requirePermission("inventory:write"), controller.create);
router.patch("/:id", requirePermission("inventory:write"), controller.update);
router.get("/:warehouseId/stocks", requirePermission("inventory:read"), controller.listStocks);
router.put("/:warehouseId/stocks", requirePermission("inventory:write"), controller.upsertStocks);

module.exports = router;
