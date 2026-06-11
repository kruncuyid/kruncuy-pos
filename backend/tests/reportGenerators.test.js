const test = require("node:test");
const assert = require("node:assert/strict");
const { REPORT_KEYS, REPORT_GENERATORS } = require("../src/modules/reports/reportGenerators");

test("all catalog report keys have generators", () => {
  for (const key of REPORT_KEYS) {
    assert.equal(typeof REPORT_GENERATORS[key], "function", `missing generator for ${key}`);
  }
});

test("report catalog contains expected groups", () => {
  assert.ok(REPORT_KEYS.includes("daily-sales-recap"));
  assert.ok(REPORT_KEYS.includes("cash-sessions"));
  assert.ok(REPORT_KEYS.includes("inventory-stock"));
  assert.ok(REPORT_KEYS.includes("crew-attendance"));
  assert.ok(REPORT_KEYS.includes("audit-log"));
  assert.equal(REPORT_KEYS.length, 28);
});
