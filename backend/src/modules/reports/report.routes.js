const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const reportController = require("./report.controller");

router.get("/daily", requireAuth, requirePermission("reports:read"), reportController.getDailyReport);
router.get("/erp/dashboard", requireAuth, requirePermission("reports:read"), reportController.getErpDashboard);
router.get("/owner/dashboard", requireAuth, requirePermission("reports:read"), reportController.getErpDashboard);
router.get("/catalog", requireAuth, requirePermission("reports:read"), reportController.getReportCatalog);
router.get("/sales-recap", requireAuth, requirePermission("reports:read"), reportController.getSalesRecap);
router.get("/:reportKey", requireAuth, requirePermission("reports:read"), reportController.getReportByKey);

module.exports = router;
