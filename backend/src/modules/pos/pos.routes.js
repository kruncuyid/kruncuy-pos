const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const posController = require("./pos.controller");

router.get("/summary", requireAuth, requirePermission("transactions:read"), posController.getSummary);
router.get("/catalog", requireAuth, requirePermission("transactions:read"), posController.getCatalog);
router.post("/checkout", requireAuth, requirePermission("transactions:write"), posController.checkout);

module.exports = router;
