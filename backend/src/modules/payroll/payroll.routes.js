const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./payroll.controller");

router.use(requireAuth);

router.get("/", requirePermission("payroll:read"), ctrl.list);
router.get("/calculate", requirePermission("payroll:write"), ctrl.calculate);
router.get("/:id", requirePermission("payroll:read"), ctrl.getById);
router.post("/", requirePermission("payroll:write"), ctrl.create);
router.post("/:id/approve", requirePermission("payroll:write"), ctrl.approve);
router.post("/:id/pay", requirePermission("payroll:write"), ctrl.pay);
router.delete("/:id", requirePermission("payroll:write"), ctrl.remove);

module.exports = router;
