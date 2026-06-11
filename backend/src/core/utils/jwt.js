const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const REFRESH_SECRET = env.jwtSecret + "-refresh";

exports.signToken = (payload, expiresIn) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: expiresIn || env.jwtExpiresIn,
  });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

exports.signRefreshToken = (userId) => {
  const jti = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ id: userId, jti }, REFRESH_SECRET, { expiresIn: "30d" });
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

exports.requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = exports.verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};
