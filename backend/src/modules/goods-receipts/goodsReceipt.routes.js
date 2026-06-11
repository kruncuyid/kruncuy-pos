const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./goodsReceipt.controller");

router.use(requireAuth);

router.get("/", requirePermission("goods-receipt:read"), ctrl.list);
router.get("/:id", requirePermission("goods-receipt:read"), ctrl.getById);
router.post("/", requirePermission("goods-receipt:write"), ctrl.create);

module.exports = router;
