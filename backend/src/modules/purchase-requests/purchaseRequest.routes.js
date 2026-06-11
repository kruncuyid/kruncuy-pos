const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./purchaseRequest.controller");

router.use(requireAuth);

router.get("/", requirePermission("purchasing-request:read"), ctrl.list);
router.get("/:id", requirePermission("purchasing-request:read"), ctrl.getById);
router.post("/", requirePermission("purchasing-request:write"), ctrl.create);
router.post("/:id/submit", requirePermission("purchasing-request:write"), ctrl.submit);
router.post("/:id/approve", requirePermission("purchasing-request:write"), ctrl.approve);
router.post("/:id/reject", requirePermission("purchasing-request:write"), ctrl.reject);

module.exports = router;
