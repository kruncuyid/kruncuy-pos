const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const productCategoryController = require("./productCategory.controller");

router.get("/", requireAuth, requirePermission("product-categories:read"), productCategoryController.getProductCategories);
router.get("/:id", requireAuth, requirePermission("product-categories:read"), productCategoryController.getProductCategoryById);
router.post("/", requireAuth, requirePermission("product-categories:write"), productCategoryController.createProductCategory);
router.put("/:id", requireAuth, requirePermission("product-categories:write"), productCategoryController.updateProductCategory);
router.delete("/:id", requireAuth, requirePermission("product-categories:write"), productCategoryController.deleteProductCategory);

module.exports = router;
