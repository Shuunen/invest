import { type Page, test, expect } from "@playwright/test";
import sampleJson from "../data/sample.json" with { type: "json" };

const PORTFOLIO_ID = sampleJson.portfolios[0].id;
const PORTFOLIO_NAME = sampleJson.portfolios[0].name;
const PORTFOLIO_ASSETS = sampleJson.portfolios[0].entries.map(entry => sampleJson.assets.find(ast => ast.isin === entry.isin)).filter(Boolean);

async function importSampleData(page: Page) {
  await page.goto("/");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import data" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("data/sample.json");
}

async function expectPortfolioAssetsVisible(page: Page) {
  await expect(page.getByRole("heading", { name: PORTFOLIO_NAME })).toBeVisible();
  await expect(page.getByRole("link", { name: PORTFOLIO_NAME })).toBeVisible();
  const assetNames = PORTFOLIO_ASSETS.map(ast => ast?.name).filter(Boolean);
  await expect(page.getByRole("cell", { exact: true, name: assetNames[0] })).toBeVisible();
  await expect(page.getByRole("cell", { exact: true, name: assetNames[1] })).toBeVisible();
}

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
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", "width=device-width, initial-scale=1.0");
});

test("portfolio page shows assets and survives a reload", async ({ page }) => {
  await importSampleData(page);
  await page.goto(`/portfolios/${PORTFOLIO_ID}`);

  await expectPortfolioAssetsVisible(page);

  // Reload the page — data must survive
  await page.reload();

  await expectPortfolioAssetsVisible(page);
});
