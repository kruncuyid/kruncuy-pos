const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const transactionController = require("./transaction.controller");

router.get("/", requireAuth, requirePermission("transactions:read"), transactionController.getTransactions);
router.get("/today", requireAuth, requirePermission("transactions:read"), transactionController.getTodayTransactions);
router.get("/:id", requireAuth, requirePermission("transactions:read"), transactionController.getTransactionById);
router.post("/", requireAuth, requirePermission("transactions:write"), transactionController.createTransaction);
router.post("/:id/void", requireAuth, requirePermission("transactions:write"), transactionController.voidTransaction);

module.exports = router;
