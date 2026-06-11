const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const branchAssignmentController = require("./branchAssignment.controller");

router.use(requireAuth);

router.get("/", requirePermission("branch-assignments:read"), branchAssignmentController.getAssignments);
router.post("/", requirePermission("branch-assignments:write"), branchAssignmentController.createAssignment);
router.patch("/:id/deactivate", requirePermission("branch-assignments:write"), branchAssignmentController.deactivateAssignment);
router.patch("/:id/activate", requirePermission("branch-assignments:write"), branchAssignmentController.activateAssignment);
router.put("/:id", requirePermission("branch-assignments:write"), branchAssignmentController.updateAssignment);
router.post("/quick-assign", requirePermission("branch-assignments:write"), branchAssignmentController.quickAssign);

module.exports = router;
