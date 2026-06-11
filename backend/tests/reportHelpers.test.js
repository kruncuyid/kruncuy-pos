const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDateRangeFromQuery,
  buildPaymentSummary,
  formatDayKey,
  sumTransactions,
} = require("../src/modules/reports/reportHelpers");

test("buildDateRangeFromQuery swaps invalid ranges", () => {
  const range = buildDateRangeFromQuery({
    startDate: "2026-06-10",
    endDate: "2026-06-01",
  });

  // Dates are compared as local time; start > end triggers swap
  const startStr = range.start.toISOString().slice(0, 10);
  const endStr = range.end.toISOString().slice(0, 10);

  // startDate was later, endDate was earlier, so they should be swapped
  assert.ok(startStr <= endStr, "start should be ≤ end after swap");
  assert.ok(
    startStr === "2026-06-01" || startStr === "2026-05-31" || startStr === "2026-06-02",
    `unexpected start: ${startStr}`
  );
  assert.ok(
    endStr === "2026-06-10" || endStr === "2026-06-09" || endStr === "2026-06-11",
    `unexpected end: ${endStr}`
  );
});

test("sumTransactions aggregates sales and pcs", () => {
  const result = sumTransactions([
    { totalAmount: 10000, totalPcs: 2 },
    { totalAmount: 5000, totalPcs: 1 },
  ]);

  assert.equal(result.totalSales, 15000);
  assert.equal(result.totalPcs, 3);
});

test("buildPaymentSummary groups by payment method", () => {
  const result = buildPaymentSummary([
    { paymentMethod: "CASH", totalAmount: 10000 },
    { paymentMethod: "QRIS", totalAmount: 7000 },
    { paymentMethod: "CASH", totalAmount: 3000 },
  ]);

  assert.equal(result.CASH, 13000);
  assert.equal(result.QRIS, 7000);
});

test("formatDayKey returns YYYY-MM-DD", () => {
  assert.equal(formatDayKey("2026-06-08T10:15:00.000Z"), "2026-06-08");
});
