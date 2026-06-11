import { describe, expect, it } from "vitest";
import {
  formatCellValue,
  formatCurrency,
  getMonthToDateDefaults,
  paymentTone,
} from "./reportFormatters";

describe("reportFormatters", () => {
  it("formats currency in IDR style", () => {
    const result = formatCurrency(15000);
    expect(result).toContain("15.000");
    expect(result).toContain("Rp");
  });

  it("formats cell values by type", () => {
    const currencyResult = formatCellValue(12000, "currency");
    expect(currencyResult).toContain("12.000");

    expect(formatCellValue(42, "number")).toBe("42");
    expect(formatCellValue(null, "text")).toBe("-");
  });

  it("maps payment tone for known methods", () => {
    expect(paymentTone("CASH")).toBe("success");
    expect(paymentTone("QRIS")).toBe("info");
    expect(paymentTone("VOID")).toBe("danger");
  });

  it("returns month-to-date defaults", () => {
    const defaults = getMonthToDateDefaults();
    expect(defaults.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(defaults.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(defaults.startDate <= defaults.endDate).toBe(true);
  });
});
