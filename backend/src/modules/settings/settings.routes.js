const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const settingsController = require("./settings.controller");

router.get("/", requireAuth, requirePermission("settings:read"), settingsController.getOverview);
router.put("/system/:key", requireAuth, requirePermission("settings:write"), settingsController.upsertSystemSetting);
router.put("/feature-flags/:key", requireAuth, requirePermission("settings:write"), settingsController.upsertFeatureFlag);

module.exports = router;
