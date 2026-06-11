# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\e2e\auth.spec.js >> Authentication >> unauthenticated user redirected to login
- Location: frontend\e2e\auth.spec.js:36:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/erp", waiting until "load"

```

# Test source

```ts
  1  | // @ts-check
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | test.describe("Authentication", () => {
  5  |   test("login page loads correctly", async ({ page }) => {
  6  |     await page.goto("/login");
  7  |     await expect(page.locator(".kr-input").first()).toBeVisible();
  8  |     await expect(page.getByText("Masuk ke kasir")).toBeVisible();
  9  |   });
  10 | 
  11 |   test("login with valid admin credentials redirects to ERP", async ({ page }) => {
  12 |     await page.goto("/login");
  13 |     await page.fill("#username", "admin");
  14 |     await page.fill("#password", "admin123");
  15 |     await page.getByRole("button", { name: "Masuk" }).click();
  16 |     await expect(page).toHaveURL(/\/erp($|\/)/, { timeout: 15000 });
  17 |   });
  18 | 
  19 |   test("login with valid crew credentials redirects to crew", async ({ page }) => {
  20 |     await page.goto("/login");
  21 |     await page.fill("#username", "crew");
  22 |     await page.fill("#password", "crew@2026");
  23 |     await page.getByRole("button", { name: "Masuk" }).click();
  24 |     await expect(page).toHaveURL(/\/crew($|\/)/, { timeout: 15000 });
  25 |   });
  26 | 
  27 |   test("login with invalid password shows error", async ({ page }) => {
  28 |     await page.goto("/login");
  29 |     await page.fill("#username", "admin");
  30 |     await page.fill("#password", "wrongpassword");
  31 |     await page.getByRole("button", { name: "Masuk" }).click();
  32 |     // Error shown in a red-bordered div (API returns "Username atau password salah")
  33 |     await expect(page.locator(".border-red-200, .border-red-900").first()).toBeVisible({ timeout: 10000 });
  34 |   });
  35 | 
  36 |   test("unauthenticated user redirected to login", async ({ page }) => {
> 37 |     await page.goto("/erp");
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  38 |     await expect(page).toHaveURL(/\/login/);
  39 |   });
  40 | });
  41 | 
```