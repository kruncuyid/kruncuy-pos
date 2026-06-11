const express = require("express");
const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const customerController = require("./customer.controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", requirePermission("master-data:read"), customerController.list);
router.get("/:id", requirePermission("master-data:read"), customerController.getById);
router.post("/", requirePermission("master-data:write"), customerController.create);
router.put("/:id", requirePermission("master-data:write"), customerController.update);
router.delete("/:id", requirePermission("master-data:write"), customerController.remove);

module.exports = router;
