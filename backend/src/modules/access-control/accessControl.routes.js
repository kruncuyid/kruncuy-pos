const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const accessControlController = require("./accessControl.controller");

router.get("/matrix", requireAuth, requirePermission("access-control:read"), accessControlController.getMatrix);
router.post("/sync-catalog", requireAuth, requirePermission("access-control:write"), accessControlController.syncCatalog);
router.put("/roles/:roleCode/permissions", requireAuth, requirePermission("access-control:write"), accessControlController.updateRolePermissions);

module.exports = router;
