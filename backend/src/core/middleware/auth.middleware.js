const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/prisma");

exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    // Cek apakah user masih aktif
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Akun tidak aktif. Hubungi administrator.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};
