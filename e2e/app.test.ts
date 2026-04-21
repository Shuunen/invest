import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => indexedDB.deleteDatabase("invest-app"));
});

test("page loads without uncaught errors", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", err => pageErrors.push(err));

  await page.goto("/");

  expect(pageErrors).toHaveLength(0);
});

test("page title is correct", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Invest — Portfolio Tracker");
});

test("root element mounts and renders content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).toBeAttached();
  await expect(page.locator("#root")).not.toBeEmpty();
});

test("page has correct viewport meta", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    "width=device-width, initial-scale=1.0",
  );
});
