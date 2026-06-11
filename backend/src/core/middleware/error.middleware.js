const env = require("../config/env");

exports.notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route tidak ditemukan: ${req.originalUrl}`,
  });
};

exports.errorHandler = (err, req, res, next) => {
  const isProduction = env.nodeEnv === "production";
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  const statusCode = err.statusCode || 500;

  const message =
    isProduction && statusCode === 500
      ? "Terjadi kesalahan server"
      : err.message || "Terjadi kesalahan server";

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
