const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const crewController = require("./crew.controller");

router.use(requireAuth);

router.get("/dashboard", requirePermission("reports:read"), crewController.getDashboard);
router.get("/sales/today", requirePermission("reports:read"), crewController.getTodaySales);
router.get("/performance/monthly", requirePermission("reports:read"), crewController.getMonthlyPerformance);
router.get("/attendance/gate", requirePermission("cash-sessions:read"), crewController.getAttendanceGate);
router.get("/stock-opname/form", requirePermission("inventory:read"), crewController.getStockOpnameForm);
router.post("/stock-opname/complete", requirePermission("inventory:stock-opname:write"), crewController.completeStockOpname);
router.get("/stock-outlet", requirePermission("inventory:read"), crewController.getOutletStockOverview);
router.post("/attendance/check-in", requirePermission("cash-sessions:write"), crewController.checkIn);
router.post("/attendance/check-out", requirePermission("cash-sessions:write"), crewController.checkOut);
router.get("/depot-approvals", requirePermission("depot-transfers:read"), crewController.getDepotApprovals);
router.post("/depot-approvals/:id/approve", requirePermission("depot-transfers:approve"), crewController.approveDepotTransfer);
router.post("/retur", requirePermission("inventory:write"), crewController.submitRetur);
router.get("/my-branches", crewController.getMyBranches);

module.exports = router;
