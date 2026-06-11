require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET wajib diisi di environment variables. Generate dengan: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

module.exports = env;
