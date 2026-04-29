import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Page, test, expect } from "@playwright/test";
import sampleJson from "../data/sample.json" with { type: "json" };

const PORTFOLIO_ID = sampleJson.portfolios[0].id;
const PORTFOLIO_NAME = sampleJson.portfolios[0].name;
const PORTFOLIO_ASSETS = sampleJson.portfolios[0].entries.map(entry => sampleJson.assets.find(ast => ast.isin === entry.isin)).filter((ast): ast is (typeof sampleJson.assets)[number] => ast !== undefined);

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
  const [first, second] = PORTFOLIO_ASSETS.map(ast => ast.name);
  await expect(page.getByRole("cell", { exact: true, name: first })).toBeVisible();
  await expect(page.getByRole("cell", { exact: true, name: second })).toBeVisible();
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

test("creates a new portfolio via the + button", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "New portfolio" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create portfolio" })).toBeVisible();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Work Savings");
  await dialog.getByRole("textbox", { name: "Broker" }).fill("Degiro");
  await page.getByRole("button", { name: "Create" }).click();

  // Modal closes and we navigate to the new portfolio page
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Work Savings" })).toBeVisible();

  // The portfolio nav link appears
  await expect(page.getByRole("link", { name: "Work Savings" })).toBeVisible();
});

test("portfolio nav links appear for each imported portfolio", async ({ page }) => {
  await importSampleData(page);

  await expect(page.getByRole("link", { name: PORTFOLIO_NAME })).toBeVisible();
  await page.getByRole("link", { name: PORTFOLIO_NAME }).click();
  await expect(page.getByRole("heading", { name: PORTFOLIO_NAME })).toBeVisible();
});

test("can edit portfolio assets via the asset picker", async ({ page }) => {
  await importSampleData(page);
  await page.goto(`/portfolios/${PORTFOLIO_ID}`);

  const initialAssetNames = PORTFOLIO_ASSETS.map(ast => ast.name);
  await expect(page.getByRole("cell", { exact: true, name: initialAssetNames[0] })).toBeVisible();

  // Open the asset picker
  await page.getByRole("button", { name: "Edit assets" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Deselect the first asset
  const firstCheckbox = page.getByRole("row", { name: initialAssetNames[0] }).getByRole("checkbox");
  await firstCheckbox.uncheck();

  // Confirm changes
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // The deselected asset should no longer appear in the table
  await expect(page.getByRole("cell", { exact: true, name: initialAssetNames[0] })).not.toBeVisible();
});

test("export includes portfolio data", async ({ page }) => {
  await importSampleData(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const download = await downloadPromise;

  const exportPath = join(tmpdir(), `invest-export-test-${Date.now()}.json`);
  await download.saveAs(exportPath);
  const content = await fs.readFile(exportPath, "utf8");
  await fs.unlink(exportPath);

  const exported = JSON.parse(content) as { portfolios: { id: string; name: string }[] };
  expect(exported.portfolios).toHaveLength(1);
  expect(exported.portfolios[0].id).toBe(PORTFOLIO_ID);
  expect(exported.portfolios[0].name).toBe(PORTFOLIO_NAME);
});
