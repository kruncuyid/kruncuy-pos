// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".kr-input").first()).toBeVisible();
    await expect(page.getByText("Masuk ke kasir")).toBeVisible();
  });

  test("login with valid admin credentials redirects to ERP", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/erp($|\/)/, { timeout: 15000 });
  });

  test("login with valid crew credentials redirects to crew", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", "crew");
    await page.fill("#password", "crew@2026");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/crew($|\/)/, { timeout: 15000 });
  });

  test("login with invalid password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", "admin");
    await page.fill("#password", "wrongpassword");
    await page.getByRole("button", { name: "Masuk" }).click();
    // Error shown in a red-bordered div (API returns "Username atau password salah")
    await expect(page.locator(".border-red-200, .border-red-900").first()).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/erp");
    await expect(page).toHaveURL(/\/login/);
  });
});
