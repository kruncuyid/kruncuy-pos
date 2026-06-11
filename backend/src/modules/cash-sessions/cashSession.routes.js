const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const cashSessionController = require("./cashSession.controller");

router.get("/active", requireAuth, requirePermission("cash-sessions:read"), cashSessionController.getActiveSession);
router.post("/open", requireAuth, requirePermission("cash-sessions:write"), cashSessionController.openSession);
router.post("/close", requireAuth, requirePermission("cash-sessions:write"), cashSessionController.closeSession);

module.exports = router;
