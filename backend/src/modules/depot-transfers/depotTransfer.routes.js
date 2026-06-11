const express = require("express");
const controller = require("./depotTransfer.controller");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");

const router = express.Router();
router.use(requireAuth);

router.get("/", requirePermission("depot-transfers:read"), controller.list);
router.get("/summary", requirePermission("depot-transfers:read"), controller.summary);
router.get("/:id", requirePermission("depot-transfers:read"), controller.detail);
router.post("/", requirePermission("depot-transfers:write"), controller.create);
router.post("/:id/approve", requirePermission("depot-transfers:approve"), controller.approve);
router.post("/:id/void", requirePermission("depot-transfers:write"), controller.voidTransfer);

module.exports = router;
