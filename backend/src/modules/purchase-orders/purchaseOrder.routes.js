const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./purchaseOrder.controller");

router.use(requireAuth);

router.get("/", requirePermission("purchasing-order:read"), ctrl.list);
router.get("/:id", requirePermission("purchasing-order:read"), ctrl.getById);
router.post("/", requirePermission("purchasing-order:write"), ctrl.create);
router.post("/:id/submit", requirePermission("purchasing-order:write"), ctrl.submit);
router.post("/:id/approve", requirePermission("purchasing-order:write"), ctrl.approve);
router.post("/:id/cancel", requirePermission("purchasing-order:write"), ctrl.cancel);

module.exports = router;
