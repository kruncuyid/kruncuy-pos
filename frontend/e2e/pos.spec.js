// @ts-check
import { test, expect } from "@playwright/test";

test.describe("POS Flow", () => {
  test("crew dashboard accessible after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", "crew");
    await page.fill("#password", "crew@2026");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/crew/, { timeout: 15000 });

    await expect(page.locator("#root")).toBeVisible();
  });
});
