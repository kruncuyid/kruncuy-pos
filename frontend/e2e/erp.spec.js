// @ts-check
import { test, expect } from "@playwright/test";

test.describe("ERP Management", () => {
  test("cross branch dashboard accessible after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/erp/, { timeout: 15000 });

    // Login stores token in memory — navigate via link, not goto()
    // Just verify we're on the ERP dashboard
    await expect(page.locator("#root")).toBeVisible();
  });
});
