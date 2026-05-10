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
  performance1y: 10,
  performance3y: 20,
  performance5y: 30,
  price: 100,
  riskReward1y: 1,
  riskReward3y: 1.5,
  riskReward5y: 2,
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
    // 5 scored fields + 0.5 (stale updatedAt) + 1 amount + 0.5 stale amountUpdatedAt = 7.5/8 = 93.75 → rounds to 94
    expect(computeDataScore({ ...fullAsset, updatedAt: staleDate }, { ...fullEntry, amountUpdatedAt: staleDate })).toBe(94);
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
    // 5 scored fields + 1 (fresh updatedAt) + 1 amount + 0 (no amountUpdatedAt) = 7/8 = 87.5 → rounds to 88
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, fullEntry)).toBe(88);
  });

  it("gives partial credit for stale amountUpdatedAt in portfolio context", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const staleAmount = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(); // 120 days ago
    // 5 scored fields + 1 (fresh updatedAt) + 1 amount + 0.5 (stale amountUpdatedAt) = 7.5/8 = 93.75 → rounds to 94
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, { ...fullEntry, amountUpdatedAt: staleAmount })).toBe(94);
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

  it("matches formula: perf3y + risk3y*5 - fees*10", () => {
    expect.hasAssertions();
    // oxlint-disable-next-line vitest/no-conditional-in-test
    const asset = AppDataSchema.parse(jsonParse(sampleRaw)).assets.find(entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined);
    invariant(asset, "Expected to find an ISIN with all required fields");
    invariant(asset.performance3y !== undefined, "Expected performance3y to be defined");
    invariant(asset.riskReward3y !== undefined, "Expected riskReward3y to be defined");
    const expected = asset.performance3y + asset.riskReward3y * 5 - asset.fees * 10;
    expect(computeScore(asset)).toBeCloseTo(expected, 10);
  });
});
