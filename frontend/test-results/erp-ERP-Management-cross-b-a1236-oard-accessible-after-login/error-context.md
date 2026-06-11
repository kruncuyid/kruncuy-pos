# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: erp.spec.js >> ERP Management >> cross branch dashboard accessible after login
- Location: e2e\erp.spec.js:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#username')

```

# Test source

```ts
  1  | // @ts-check
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | test.describe("ERP Management", () => {
  5  |   test("cross branch dashboard accessible after login", async ({ page }) => {
  6  |     await page.goto("/login");
> 7  |     await page.fill("#username", "admin");
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill("#password", "admin123");
  9  |     await page.getByRole("button", { name: "Masuk" }).click();
  10 |     await expect(page).toHaveURL(/\/erp/, { timeout: 15000 });
  11 | 
  12 |     // Login stores token in memory — navigate via link, not goto()
  13 |     // Just verify we're on the ERP dashboard
  14 |     await expect(page.locator("#root")).toBeVisible();
  15 |   });
  16 | });
  17 | 
```