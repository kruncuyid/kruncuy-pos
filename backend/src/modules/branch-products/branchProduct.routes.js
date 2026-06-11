const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const branchProductController = require("./branchProduct.controller");

router.get("/", requireAuth, requirePermission("branch-products:read"), branchProductController.getBranchProducts);
router.get("/catalog", requireAuth, requirePermission("branch-products:read"), branchProductController.getBranchPricingCatalog);
router.get("/variants", requireAuth, requirePermission("branch-products:read"), branchProductController.getBranchMenuVariants);
router.get("/branch/:branchId", requireAuth, requirePermission("branch-products:read"), branchProductController.getProductsByBranch);
router.get("/variants/:id", requireAuth, requirePermission("branch-products:read"), branchProductController.getBranchMenuVariantById);
router.get("/:id", requireAuth, requirePermission("branch-products:read"), branchProductController.getBranchProductById);

router.post("/", requireAuth, requirePermission("branch-products:write"), branchProductController.createBranchProduct);
router.post("/variants", requireAuth, requirePermission("branch-products:write"), branchProductController.createBranchMenuVariant);
router.post("/bulk/products", requireAuth, requirePermission("branch-products:write"), branchProductController.bulkApplyBranchProducts);
router.post("/bulk/variants", requireAuth, requirePermission("branch-products:write"), branchProductController.bulkApplyBranchMenuVariants);
router.put("/variants/:id", requireAuth, requirePermission("branch-products:write"), branchProductController.updateBranchMenuVariant);
router.put("/:id", requireAuth, requirePermission("branch-products:write"), branchProductController.updateBranchProduct);
router.delete("/:id", requireAuth, requirePermission("branch-products:write"), branchProductController.deleteBranchProduct);
router.delete("/variants/:id", requireAuth, requirePermission("branch-products:write"), branchProductController.deleteBranchMenuVariant);

module.exports = router;
