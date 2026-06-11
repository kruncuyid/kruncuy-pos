const express = require("express");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const controller = require("./notification.controller");

const router = express.Router();
router.use(requireAuth);
router.get("/", requirePermission("reports:read"), controller.getNotifications);

module.exports = router;
