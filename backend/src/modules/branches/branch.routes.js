const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const branchController = require("./branch.controller");

router.get("/", requireAuth, requirePermission("branches:read"), branchController.getBranches);
router.get("/:id", requireAuth, requirePermission("branches:read"), branchController.getBranchById);
router.post("/", requireAuth, requirePermission("branches:write"), branchController.createBranch);
router.put("/:id", requireAuth, requirePermission("branches:write"), branchController.updateBranch);
router.delete("/:id", requireAuth, requirePermission("branches:write"), branchController.deleteBranch);

module.exports = router;
