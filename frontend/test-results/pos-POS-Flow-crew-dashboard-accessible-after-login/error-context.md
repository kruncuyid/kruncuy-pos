# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.js >> POS Flow >> crew dashboard accessible after login
- Location: e2e\pos.spec.js:5:3

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
  4  | test.describe("POS Flow", () => {
  5  |   test("crew dashboard accessible after login", async ({ page }) => {
  6  |     await page.goto("/login");
> 7  |     await page.fill("#username", "crew");
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill("#password", "crew@2026");
  9  |     await page.getByRole("button", { name: "Masuk" }).click();
  10 |     await expect(page).toHaveURL(/\/crew/, { timeout: 15000 });
  11 | 
  12 |     await expect(page.locator("#root")).toBeVisible();
  13 |   });
  14 | });
  15 | 
```