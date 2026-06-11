const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const purchasingController = require("./purchasing.controller");

router.get("/outlet-expenses", requireAuth, requirePermission("purchasing:read"), purchasingController.listOutletExpenses);
router.get("/outlet-expenses/summary", requireAuth, requirePermission("purchasing:read"), purchasingController.getSummary);
router.get("/outlet-expenses/:id", requireAuth, requirePermission("purchasing:read"), purchasingController.getOutletExpenseById);
router.post("/outlet-expenses", requireAuth, requirePermission("purchasing:write"), purchasingController.createOutletExpense);
router.post("/outlet-expenses/:id/approve", requireAuth, requirePermission("purchasing:write"), purchasingController.approveOutletExpense);
router.post("/outlet-expenses/:id/void", requireAuth, requirePermission("purchasing:write"), purchasingController.voidOutletExpense);

module.exports = router;
