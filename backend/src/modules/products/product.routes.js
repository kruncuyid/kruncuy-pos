const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const productController = require("./product.controller");

router.get("/", requireAuth, requirePermission("products:read"), productController.getProducts);
router.get("/:id", requireAuth, requirePermission("products:read"), productController.getProductById);
router.post("/", requireAuth, requirePermission("products:write"), productController.createProduct);
router.put("/:id", requireAuth, requirePermission("products:write"), productController.updateProduct);
router.delete("/:id", requireAuth, requirePermission("products:write"), productController.deleteProduct);

module.exports = router;
