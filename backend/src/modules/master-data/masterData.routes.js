const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const masterDataController = require("./masterData.controller");

router.get("/reference-data", requireAuth, requirePermission("master-data:read"), masterDataController.getReferenceData);

module.exports = router;
