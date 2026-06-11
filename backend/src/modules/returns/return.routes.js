const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./return.controller");

router.use(requireAuth);

router.get("/", requirePermission("returns:read"), ctrl.list);
router.get("/:id", requirePermission("returns:read"), ctrl.getById);
router.post("/", requirePermission("returns:write"), ctrl.create);
router.post("/:id/approve", requirePermission("returns:write"), ctrl.approve);

module.exports = router;
