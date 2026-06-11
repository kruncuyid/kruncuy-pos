const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../core/middleware/auth.middleware");
const { requirePermission } = require("../../core/middleware/permission.middleware");
const userController = require("./user.controller");

router.get("/", requireAuth, requirePermission("users:read"), userController.getUsers);
router.get("/me", requireAuth, userController.getMe);
router.post("/", requireAuth, requirePermission("users:write"), userController.createUser);
router.put("/:id", requireAuth, requirePermission("users:write"), userController.updateUser);
router.delete("/:id", requireAuth, requirePermission("users:write"), userController.deleteUser);

module.exports = router;
