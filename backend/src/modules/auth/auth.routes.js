const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { requireAuth } = require("../../core/middleware/auth.middleware");

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

module.exports = router;
