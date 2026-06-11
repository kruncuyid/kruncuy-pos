import { describe, expect, it } from "vitest";
import { ERP_REPORTS } from "./reportCatalog";
import { REPORT_VIEW_CONFIG, buildReportMetrics, getReportViewConfig } from "./reportViewConfig";

describe("reportViewConfig", () => {
  it("has view config for every dynamic ERP report except sales-recap", () => {
    const dynamicReports = ERP_REPORTS.filter((report) => report.key !== "sales-recap");

    for (const report of dynamicReports) {
      const config = getReportViewConfig(report.key);
      expect(config.columns.length, `${report.key} columns`).toBeGreaterThan(0);
      expect(config.metrics.length, `${report.key} metrics`).toBeGreaterThan(0);
    }
  });

  it("builds metrics from summary values", () => {
    const metrics = buildReportMetrics(
      {
        totalSales: 100000,
        totalTransactions: 12,
        totalDays: 5,
        averageDailySales: 20000,
      },
      "daily-sales-recap"
    );

    expect(metrics).toHaveLength(4);
    expect(metrics[0].value).toContain("100.000");
  });

  it("contains all expected report keys", () => {
    expect(Object.keys(REPORT_VIEW_CONFIG)).toHaveLength(28);
    expect(REPORT_VIEW_CONFIG["audit-log"]).toBeTruthy();
    expect(REPORT_VIEW_CONFIG["branch-product-coverage"]).toBeTruthy();
  });
});
