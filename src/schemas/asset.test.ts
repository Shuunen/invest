import { readFileSync } from "node:fs";
import path from "node:path";
import { invariant } from "es-toolkit";
import { jsonParse } from "../utils/json.ts";
import { AppDataSchema } from "./app-data.ts";
import { AssetSchema, computeScore, type Asset } from "./asset.ts";

const sampleRaw = readFileSync(path.join(process.cwd(), "data/sample.json"), "utf8");

// Shared minimal asset fixture — all optional fields omitted (they have defaults or are nullable)
const validAsset = {
  availableForPlan: true,
  availableOnBroker: true,
  comments: "",
  fees: 0.2,
  isAccumulating: true,
  isin: "IE00B4L5Y983",
  name: "Core MSCI World",
};

describe("AssetSchema rejections", () => {
  it("rejects an empty isin", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, isin: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative fees", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, fees: -0.1 });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects geoAllocation with unknown country key", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, geoAllocation: { unknownCountry: 1 } });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown country/iu);
  });

  it("rejects sectorAllocation with unknown sector key", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, sectorAllocation: { unknownSector: 0.5 } });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown sector/iu);
  });
});

describe("AssetSchema happy paths", () => {
  it("coerces absent nullable performance/risk fields to undefined", () => {
    expect.hasAssertions();
    const result = AssetSchema.parse(validAsset);
    expect(result.performance3y).toBeUndefined();
    expect(result.riskReward3y).toBeUndefined();
  });

  it("accepts valid geoAllocation with known country keys", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, geoAllocation: { france: 0.4, us: 0.6 } });
    expect(result.success).toBe(true);
  });

  it("accepts valid sectorAllocation with known sector keys", () => {
    expect.hasAssertions();
    const result = AssetSchema.safeParse({ ...validAsset, sectorAllocation: { financials: 0.5, technology: 0.5 } });
    expect(result.success).toBe(true);
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
      comments: "",
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
    const assetOnly3y: Asset = {
      availableForPlan: true,
      availableOnBroker: true,
      comments: "",
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
      comments: "",
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
