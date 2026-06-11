const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const controller = require("./supplier.controller");

router.use(requireAuth);

router.get("/", requirePermission("suppliers:read"), controller.list);
router.get("/:id", requirePermission("suppliers:read"), controller.getById);
router.post("/", requirePermission("suppliers:write"), controller.create);
router.put("/:id", requirePermission("suppliers:write"), controller.update);
router.delete("/:id", requirePermission("suppliers:write"), controller.remove);

module.exports = router;
