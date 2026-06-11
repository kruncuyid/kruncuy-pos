const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "test-secret-kruncuy-2026";

let prisma;

/**
 * Get or create shared Prisma client for tests.
 */
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Generate a test JWT token for a given user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/**
 * Create a test user for auth tests.
 */
async function createTestUser(overrides = {}) {
  const p = getPrisma();
  const password = await bcrypt.hash("testpass123", 10);
  return p.user.upsert({
    where: { email: overrides.email || "test@kruncuy.id" },
    update: {
      name: overrides.name || "Test User",
      username: overrides.username || "testuser",
      password,
      role: overrides.role || "CREW",
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
    create: {
      name: overrides.name || "Test User",
      username: overrides.username || "testuser",
      email: overrides.email || "test@kruncuy.id",
      password,
      role: overrides.role || "CREW",
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Clean up test data.
 */
async function cleanup(entities = []) {
  const p = getPrisma();
  for (const entity of entities) {
    await p[entity].deleteMany({ where: { email: { contains: "test@" } } }).catch(() => {});
  }
}

module.exports = { getPrisma, generateToken, createTestUser, cleanup, JWT_SECRET };
