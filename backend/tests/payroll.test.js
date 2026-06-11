const test = require("node:test");
const assert = require("node:assert/strict");
const { getPrisma } = require("./helpers/setup");

test("payroll: calculate returns expected structure", async () => {
  const payrollService = require("../src/modules/payroll/payroll.service");
  const p = getPrisma();

  const crew = await p.user.findFirst({ where: { role: "CREW" } });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await payrollService.calculate(crew.id, month, year, crew.branchId);

  assert.ok(result);
  assert.equal(result.userId, crew.id);
  assert.equal(result.periodMonth, month);
  assert.equal(result.periodYear, year);
  assert.ok(typeof result.bonusAmount === "number");
  assert.ok(typeof result.netAmount === "number");
});

test("payroll: create and approve flow", async () => {
  const payrollService = require("../src/modules/payroll/payroll.service");
  const p = getPrisma();

  const crew = await p.user.findFirst({ where: { role: "CREW" } });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Calculate
  const calc = await payrollService.calculate(crew.id, month, year, crew.branchId);

  // Create
  const created = await payrollService.create({
    userId: calc.userId,
    periodMonth: calc.periodMonth,
    periodYear: calc.periodYear,
    branchId: calc.branchId,
    baseSalary: calc.baseSalary,
    bonusAmount: calc.bonusAmount,
    overtimeAmount: calc.overtimeAmount,
    deductions: calc.deductions,
  });

  assert.ok(created.id);
  assert.equal(created.status, "DRAFT");

  // Approve
  const approved = await payrollService.approve(created.id);
  assert.equal(approved.status, "APPROVED");

  // Cleanup
  await payrollService.remove(created.id);
});
