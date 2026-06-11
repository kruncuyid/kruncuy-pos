const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const erpController = require("./erp.controller");

router.get("/navigation", requireAuth, requirePermission("erp:navigation:read"), erpController.getNavigation);
router.get("/attendance", requireAuth, requirePermission("erp:attendance:read"), erpController.getAttendanceOverview);
router.get("/performance", requireAuth, requirePermission("erp:performance:read"), erpController.getPerformanceOverview);
router.get("/cash-sessions", requireAuth, requirePermission("erp:cash-sessions:read"), erpController.getCashSessionsOverview);
router.get("/cross-branch", requireAuth, requirePermission("reports:read"), erpController.getCrossBranchDashboard);

module.exports = router;
