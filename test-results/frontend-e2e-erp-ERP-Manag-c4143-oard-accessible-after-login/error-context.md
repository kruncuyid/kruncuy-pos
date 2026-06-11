# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\e2e\erp.spec.js >> ERP Management >> cross branch dashboard accessible after login
- Location: frontend\e2e\erp.spec.js:5:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

# Test source

```ts
  1  | // @ts-check
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | test.describe("ERP Management", () => {
  5  |   test("cross branch dashboard accessible after login", async ({ page }) => {
> 6  |     await page.goto("/login");
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  7  |     await page.fill("#username", "admin");
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