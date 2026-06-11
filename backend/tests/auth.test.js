const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestUser, generateToken, cleanup, getPrisma } = require("./helpers/setup");
const { requireAuth } = require("../src/core/middleware/auth.middleware");

test("auth: valid token passes middleware", async () => {
  // Use the real JWT secret from the running app
  const jwt = require("jsonwebtoken");
  const env = require("../src/core/config/env");

  const p = getPrisma();
  const admin = await p.user.findUnique({ where: { email: "admin@kruncuy.id" } });
  const token = jwt.sign(
    { id: admin.id, role: admin.role, name: admin.name },
    env.jwtSecret,
    { expiresIn: "1h" }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  let calledNext = false;

  const res = { status: () => res, json: () => {} };
  await requireAuth(req, res, () => { calledNext = true; });

  assert.equal(calledNext, true);
  assert.equal(req.user.role, "SUPERADMIN");
});

test("auth: missing token returns 401", async () => {
  const req = { headers: {} };
  let statusCode = 0;

  await requireAuth(req, {
    status: (code) => { statusCode = code; return { json: () => {} }; },
  }, () => {});

  assert.equal(statusCode, 401);
});

test("auth: invalid token returns 401", async () => {
  const req = { headers: { authorization: "Bearer invalidtoken123" } };
  let statusCode = 0;

  await requireAuth(req, {
    status: (code) => { statusCode = code; return { json: () => {} }; },
  }, () => {});

  assert.equal(statusCode, 401);
});

test("auth: inactive user returns 401", async () => {
  const jwt = require("jsonwebtoken");
  const env = require("../src/core/config/env");

  const user = await createTestUser({ isActive: false });
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: "1h" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let statusCode = 0;

  await requireAuth(req, {
    status: (code) => { statusCode = code; return { json: () => {} }; },
  }, () => {});

  assert.equal(statusCode, 401);
  await cleanup(["user"]);
});

test("auth: login with correct password", async () => {
  const { login } = require("../src/modules/auth/auth.service");

  const result = await login({ username: "admin", password: "admin123" });
  assert.ok(result.token);
  assert.equal(result.user.role, "SUPERADMIN");
});
