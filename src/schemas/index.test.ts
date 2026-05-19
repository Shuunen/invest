import { readFileSync } from "node:fs";
import { join } from "node:path";
import { invariant } from "es-toolkit";
import { jsonParse } from "../utils/json";
import { safeImportJson, parseAppData, computeScore, computeDataScore, AppDataSchema, SettingsSchema, type AppData, type Asset, type PortfolioEntry } from "./index";

const sampleRaw = readFileSync(join(process.cwd(), "data/sample.json"), "utf8");

describe("AppDataSchema", () => {
  it("parses sample.json without errors", () => {
    expect.hasAssertions();
    const result = safeImportJson(sampleRaw);
    expect(result).not.toHaveProperty("error");
  });

  it("rejects invalid JSON", () => {
    expect.hasAssertions();
    const result = safeImportJson("not json");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Invalid JSON/u);
  });

  it("rejects empty string", () => {
    expect.hasAssertions();
    const result = safeImportJson("");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Invalid JSON/u);
  });

  it("rejects portfolio entry referencing unknown ISIN", () => {
    expect.hasAssertions();
    const valid = AppDataSchema.parse(jsonParse(sampleRaw));
    const [firstPortfolio] = valid.portfolios;
    invariant(firstPortfolio, "Expected at least one portfolio");
    const invalidData: AppData = {
      ...valid,
      portfolios: [
        {
          ...firstPortfolio,
          entries: [...firstPortfolio.entries, { amount: 0, inPEA: false, isin: "XX0000000000", notes: "", positionValue: 100, targetAmount: 0 }],
        },
        ...valid.portfolios.slice(1),
      ],
    };
    const result = AppDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown ISIN/u);
  });
});

describe("safeImportJson", () => {
  it("returns schema error when valid JSON fails Zod validation", () => {
    expect.hasAssertions();
    // theme must be "light" or "dark" — passing an invalid enum value triggers Zod failure
    const result = safeImportJson(JSON.stringify({ assets: [], portfolios: [], settings: { theme: "invalid" } }));
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Schema error at/u);
  });
});

describe("parseAppData", () => {
  it("returns parsed data for valid input", () => {
    expect.hasAssertions();
    const data = parseAppData(jsonParse(sampleRaw));
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBeGreaterThan(0);
    expect(Array.isArray(data.portfolios)).toBe(true);
    expect(data.settings.theme).toBeTypeOf("string");
  });

  it("throws for invalid input", () => {
    expect.hasAssertions();
    // theme must be "light" or "dark" — passing an invalid enum value triggers a Zod throw
    expect(() => parseAppData({ assets: [], portfolios: [], settings: { theme: "invalid" } })).toThrow(/invalid_value/u);
  });
});

describe("SettingsSchema", () => {
  it("coerces null lastExportedAt to undefined", () => {
    expect.hasAssertions();
    // JSON payloads use null for absent values; the schema must coerce to undefined
    const result = SettingsSchema.parse(jsonParse('{"lastExportedAt":null}'));
    expect(result.lastExportedAt).toBeUndefined();
  });
});

const baseAsset: Asset = {
  availableForPlan: true,
  availableOnBroker: true,
  dismissedSimilarities: [],
  fees: 0.2,
  geoAllocation: {},
  isAccumulating: true,
  isin: "IE00B4L5Y983",
  name: "Test Asset",
  performance1y: undefined,
  performance3y: undefined,
  performance5y: undefined,
  price: undefined,
  provider: "",
  riskReward1y: undefined,
  riskReward3y: undefined,
  riskReward5y: undefined,
  sectorAllocation: {},
  tickers: [],
};

const fullAsset: Asset = {
  ...baseAsset,
  geoAllocation: { europe: 0.4, us: 0.6 },
  performance1y: 10,
  performance3y: 20,
  performance5y: 30,
  price: 100,
  riskReward1y: 1,
  riskReward3y: 1.5,
  riskReward5y: 2,
  sectorAllocation: { financials: 0.3, technology: 0.7 },
};

const fullEntry: PortfolioEntry = {
  amount: 1,
  amountUpdatedAt: undefined,
  inPEA: false,
  isin: fullAsset.isin,
  notes: "",
  positionValue: 0,
  targetAmount: 0,
};

describe("computeDataScore", () => {
  it("returns 0 when no optional fields are populated", () => {
    expect.hasAssertions();
    expect(computeDataScore(baseAsset)).toBe(0);
  });

  it("returns 100 when all scored data fields are defined and updatedAt is fresh", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(100);
  });

  it("returns partial score when updatedAt is stale (older than 30 days)", () => {
    expect.hasAssertions();
    const staleDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(); // 60 days ago
    // 5 scored fields + 0.5 (stale updatedAt) + 1 (fresh amountUpdatedAt within 90 days) = 6.5/7 = 92.86 → rounds to 93
    expect(computeDataScore({ ...fullAsset, updatedAt: staleDate }, { ...fullEntry, amountUpdatedAt: staleDate })).toBe(93);
  });

  it("includes amountUpdatedAt and amount in total when an entry is provided", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    // 5 scored fields + 1 (fresh updatedAt) + 1 amount + 1 fresh amountUpdatedAt = 8/8 = 100
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(100);
  });

  it("penalizes missing amountUpdatedAt in portfolio context", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    // 5 scored fields + 1 (fresh updatedAt) + 0 (no amountUpdatedAt) = 6/7 = 85.71 → scales with allocations (x1.0) and rounds to 86
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, fullEntry)).toBe(86);
  });

  it("gives partial credit for stale amountUpdatedAt in portfolio context", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const staleAmount = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(); // 120 days ago
    // 5 scored fields + 1 (fresh updatedAt) + 0.5 (stale amountUpdatedAt) = 6.5/7 = 92.86 → scales with allocations (x1.0) and rounds to 93
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, { ...fullEntry, amountUpdatedAt: staleAmount })).toBe(93);
  });

  it("returns 0 when allocations are empty (no allocation data at all)", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithNoAllocations = {
      ...fullAsset,
      geoAllocation: {},
      sectorAllocation: {},
      updatedAt: freshDate,
    };

    // coverage = (0 + 0) / 2 = 0 → score is 0 regardless of other fields
    expect(computeDataScore(assetWithNoAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(0);
  });

  it("reduces score when allocation totals are below 100%", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithPartialAllocations = {
      ...fullAsset,
      geoAllocation: { us: 0.8 },
      sectorAllocation: { technology: 0.6 },
      updatedAt: freshDate,
    };

    // Base score is 100, then scaled by allocation coverage average: (0.8 + 0.6) / 2 = 0.7
    expect(computeDataScore(assetWithPartialAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(70);
  });

  it("does not penalize score when allocations reach or exceed 100%", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithCompleteAllocations = {
      ...fullAsset,
      geoAllocation: { europe: 0.4, us: 0.6 },
      sectorAllocation: { financials: 0.4, technology: 0.7 },
      updatedAt: freshDate,
    };

    expect(computeDataScore(assetWithCompleteAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(100);
  });
});

describe("computeScore", () => {
  it("returns undefined when performance3y is missing", () => {
    expect.hasAssertions();
    const asset = AppDataSchema.parse(jsonParse(sampleRaw)).assets.find(entry => entry.performance3y === undefined);
    expect(asset).toBeDefined();
    invariant(asset, "Expected to find an ISIN with undefined performance3y");
    expect(computeScore(asset)).toBeUndefined();
  });

  it("returns undefined when riskReward3y is missing but performance3y is defined", () => {
    expect.hasAssertions();
    const base = AppDataSchema.parse(jsonParse(sampleRaw)).assets.find(entry => entry.performance3y !== undefined);
    invariant(base, "Expected to find an ISIN with performance3y defined");
    expect(computeScore({ ...base, riskReward3y: undefined })).toBeUndefined();
  });

  it("returns a number for fully populated ISINs", () => {
    expect.hasAssertions();
    const data = AppDataSchema.parse(jsonParse(sampleRaw));
    // oxlint-disable-next-line vitest/no-conditional-in-test
    const complete = data.assets.find(entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined);
    expect(complete).toBeDefined();
    invariant(complete, "Expected to find a fully populated ISIN");
    const score = computeScore(complete);
    expect(score).toBeTypeOf("number");
  });

  it("matches weighted formula for fully populated data", () => {
    expect.hasAssertions();
    const asset: Asset = {
      availableForPlan: true,
      availableOnBroker: true,
      dismissedSimilarities: [],
      fees: 0.3,
      geoAllocation: {},
      isAccumulating: true,
      isin: "TESTFULL",
      name: "Complete Inputs",
      performance1y: 80,
      performance3y: 120,
      performance5y: 150,
      price: 100,
      provider: "Test",
      riskReward1y: 2,
      riskReward3y: 1.5,
      riskReward5y: 1.2,
      sectorAllocation: {},
      tickers: [],
    };

    invariant(asset.performance1y !== undefined, "Expected performance1y to be defined");
    invariant(asset.performance3y !== undefined, "Expected performance3y to be defined");
    invariant(asset.performance5y !== undefined, "Expected performance5y to be defined");
    invariant(asset.riskReward1y !== undefined, "Expected riskReward1y to be defined");
    invariant(asset.riskReward3y !== undefined, "Expected riskReward3y to be defined");
    invariant(asset.riskReward5y !== undefined, "Expected riskReward5y to be defined");

    const avgPerf = asset.performance1y * 0.2 + asset.performance3y * 0.5 + asset.performance5y * 0.3;
    const avgRisk = asset.riskReward1y * 0.2 + asset.riskReward3y * 0.5 + asset.riskReward5y * 0.3;

    const expected = avgPerf + avgRisk * 5 - asset.fees * 10;
    expect(computeScore(asset)).toBeCloseTo(expected, 10);
  });

  it("handles score with only 3y and risk data (no 1y or 5y)", () => {
    expect.hasAssertions();
    // Create asset with only 3y data (1y and 5y missing)
    const assetOnly3y: Asset = {
      availableForPlan: true,
      availableOnBroker: true,
      dismissedSimilarities: [],
      fees: 0.15,
      geoAllocation: {},
      isAccumulating: true,
      isin: "TEST001",
      name: "Test Fund",
      performance1y: undefined,
      performance3y: 100,
      performance5y: undefined,
      price: 123.45,
      provider: "Test",
      riskReward1y: undefined,
      riskReward3y: 1.5,
      riskReward5y: undefined,
      sectorAllocation: {},
      tickers: [],
    };

    // Missing 1y/5y now contributes 0 instead of being normalized away
    const expected = 100 * 0.5 + 1.5 * 0.5 * 5 - 0.15 * 10;
    expect(computeScore(assetOnly3y)).toBeCloseTo(expected, 10);
  });

  it("penalizes missing 5y metrics versus complete data", () => {
    expect.hasAssertions();
    const complete: Asset = {
      availableForPlan: true,
      availableOnBroker: true,
      dismissedSimilarities: [],
      fees: 0.3,
      geoAllocation: {},
      isAccumulating: true,
      isin: "TEST002",
      name: "Complete",
      performance1y: 80,
      performance3y: 120,
      performance5y: 150,
      price: 100,
      provider: "Test",
      riskReward1y: 2,
      riskReward3y: 1.5,
      riskReward5y: 1.2,
      sectorAllocation: {},
      tickers: [],
    };

    const missing5y: Asset = { ...complete, performance5y: undefined, riskReward5y: undefined };

    const completeScore = computeScore(complete);
    const missing5yScore = computeScore(missing5y);
    expect(completeScore).toBeDefined();
    expect(missing5yScore).toBeDefined();
    invariant(completeScore !== undefined, "Expected complete score");
    invariant(missing5yScore !== undefined, "Expected missing-5y score");
    expect(completeScore).toBeGreaterThan(missing5yScore);
  });
});
