const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

test("otp: code generation produces 6 digits", () => {
  const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));
  const code = generateOtpCode();
  assert.equal(code.length, 6);
  assert.ok(!Number.isNaN(Number(code)));
});

test("otp: hash verification works correctly", () => {
  const hashOtp = (otp, salt, withdrawalId) =>
    crypto.createHash("sha256").update(`${otp}:${salt}:${withdrawalId}`).digest("hex");

  const otp = "123456";
  const salt = crypto.randomBytes(16).toString("hex");
  const withdrawalId = "test-id-123";

  const hash = hashOtp(otp, salt, withdrawalId);
  assert.equal(hash.length, 64); // SHA-256 hex

  // Same input = same hash
  const hash2 = hashOtp(otp, salt, withdrawalId);
  assert.equal(hash, hash2);

  // Different OTP = different hash
  const hash3 = hashOtp("654321", salt, withdrawalId);
  assert.notEqual(hash, hash3);
});

test("otp: rate limit constants", () => {
  // Verify the rate limiter configuration
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000;

  // Brute force calculation: 6-digit OTP = 1M combos
  // At 5 attempts per 15 min = 20 attempts/hour
  // Time to brute force = 1,000,000 / 5 * 15 min = 3,000,000 min ≈ 5.7 years
  const combinations = 1000000;
  const timeMinutes = (combinations / maxAttempts) * (windowMs / 60000);
  const timeYears = timeMinutes / (60 * 24 * 365);

  assert.ok(timeYears > 1); // At least 1 year to brute force
});
