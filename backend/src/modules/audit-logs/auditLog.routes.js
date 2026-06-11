const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const auditLogController = require("./auditLog.controller");

router.get("/", requireAuth, requirePermission("audit-logs:read"), auditLogController.getRecentAuditLogs);

module.exports = router;
