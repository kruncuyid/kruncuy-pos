const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const cashWithdrawalController = require("./cashWithdrawal.controller");

const router = express.Router();
router.use(requireAuth);

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Terlalu banyak percobaan verifikasi OTP. Coba lagi 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/dashboard", requirePermission("cash-withdrawals:read"), cashWithdrawalController.getDashboard);
router.get("/mine", requirePermission("cash-withdrawals:read"), cashWithdrawalController.listMyWithdrawals);
router.get("/pending-otp", requirePermission("cash-withdrawals:read"), cashWithdrawalController.getPendingOtp);
router.get("/branch-cash/:branchId", requirePermission("cash-withdrawals:read"), cashWithdrawalController.getBranchCashInfo);
router.get("/", requirePermission("cash-withdrawals:read"), cashWithdrawalController.listWithdrawals);
router.post("/create", requirePermission("cash-withdrawals:issue"), cashWithdrawalController.createFromErp);
router.post("/request", requirePermission("cash-withdrawals:write"), cashWithdrawalController.requestWithdrawal);
router.post("/:id/issue-otp", requirePermission("cash-withdrawals:issue"), cashWithdrawalController.issueOtp);
router.post("/:id/generate-otp", requirePermission("cash-withdrawals:write"), cashWithdrawalController.generateOtp);
router.post("/:id/verify", otpVerifyLimiter, requirePermission("cash-withdrawals:write"), cashWithdrawalController.verifyOtp);
router.post("/:id/cancel", requirePermission("cash-withdrawals:issue"), cashWithdrawalController.cancelWithdrawal);

module.exports = router;
