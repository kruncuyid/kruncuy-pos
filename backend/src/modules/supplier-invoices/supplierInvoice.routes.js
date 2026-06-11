const express = require("express");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const ctrl = require("./supplierInvoice.controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", requirePermission("purchasing:read"), ctrl.list);
router.get("/:id", requirePermission("purchasing:read"), ctrl.getById);
router.post("/", requirePermission("purchasing:write"), ctrl.create);
router.put("/:id", requirePermission("purchasing:write"), ctrl.update);
router.delete("/:id", requirePermission("purchasing:write"), ctrl.remove);

// Payments nested under invoice
router.get("/:id/payments", requirePermission("purchasing:read"), ctrl.listPayments);
router.post("/:id/payments", requirePermission("purchasing:write"), ctrl.createPayment);

module.exports = router;
