import { readFileSync } from "node:fs";
import { join } from "node:path";
import { invariant } from "es-toolkit";
import { safeImportJson, parseAppData, computeScore, AppDataSchema, SettingsSchema, type AppData } from "./index";

const sampleRaw = readFileSync(join(process.cwd(), "data/sample.json"), "utf8");

describe("AppDataSchema", () => {
  it("parses sample.json without errors", () => {
    const result = safeImportJson(sampleRaw);
    expect(result).not.toHaveProperty("error");
  });

  it("rejects invalid JSON", () => {
    const result = safeImportJson("not json");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Invalid JSON/);
  });

  it("rejects empty string", () => {
    const result = safeImportJson("");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Invalid JSON/);
  });

  it("rejects portfolio entry referencing unknown ISIN", () => {
    const valid = AppDataSchema.parse(JSON.parse(sampleRaw));
    const [firstPortfolio] = valid.portfolios;
    invariant(firstPortfolio, "Expected at least one portfolio");
    const invalidData: AppData = {
      ...valid,
      portfolios: [
        {
          ...firstPortfolio,
          entries: [...firstPortfolio.entries, { inPEA: false, isin: "XX0000000000", notes: "", positionValue: 100, targetAmount: 0 }],
        },
        ...valid.portfolios.slice(1),
      ],
    };
    const result = AppDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown ISIN/);
  });
});

describe("safeImportJson", () => {
  it("returns schema error when valid JSON fails Zod validation", () => {
    // theme must be "light" or "dark" — passing an invalid enum value triggers Zod failure
    const result = safeImportJson(JSON.stringify({ assets: [], portfolios: [], settings: { theme: "invalid" } }));
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/Schema error at/);
  });
});

describe("parseAppData", () => {
  it("returns parsed data for valid input", () => {
    const data = parseAppData(JSON.parse(sampleRaw));
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBeGreaterThan(0);
    expect(Array.isArray(data.portfolios)).toBe(true);
    expect(data.settings.theme).toBeTypeOf("string");
  });

  it("throws for invalid input", () => {
    // theme must be "light" or "dark" — passing an invalid enum value triggers a Zod throw
    expect(() => parseAppData({ assets: [], portfolios: [], settings: { theme: "invalid" } })).toThrow(/invalid_value/);
  });
});

describe("SettingsSchema", () => {
  it("coerces null lastExportedAt to undefined", () => {
    // JSON payloads use null for absent values; the schema must coerce to undefined
    const result = SettingsSchema.parse(JSON.parse('{"lastExportedAt":null}'));
    expect(result.lastExportedAt).toBeUndefined();
  });
});

describe("computeScore", () => {
  it("returns undefined when performance3y is missing", () => {
    const asset = AppDataSchema.parse(JSON.parse(sampleRaw)).assets.find(entry => entry.performance3y === undefined);
    expect(asset).toBeDefined();
    invariant(asset, "Expected to find an ISIN with undefined performance3y");
    expect(computeScore(asset)).toBeUndefined();
  });

  it("returns undefined when riskReward3y is missing but performance3y is defined", () => {
    const base = AppDataSchema.parse(JSON.parse(sampleRaw)).assets.find(entry => entry.performance3y !== undefined);
    invariant(base, "Expected to find an ISIN with performance3y defined");
    expect(computeScore({ ...base, riskReward3y: undefined })).toBeUndefined();
  });

  it("returns a number for fully populated ISINs", () => {
    const data = AppDataSchema.parse(JSON.parse(sampleRaw));
    const complete = data.assets.find(entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined);
    expect(complete).toBeDefined();
    invariant(complete, "Expected to find a fully populated ISIN");
    const score = computeScore(complete);
    expect(score).toBeTypeOf("number");
  });

  it("matches formula: perf3y + risk3y*5 - fees*10", () => {
    const asset = AppDataSchema.parse(JSON.parse(sampleRaw)).assets.find(entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined);
    invariant(asset, "Expected to find an ISIN with all required fields");
    invariant(asset.performance3y !== undefined, "Expected performance3y to be defined");
    invariant(asset.riskReward3y !== undefined, "Expected riskReward3y to be defined");
    const expected = asset.performance3y + asset.riskReward3y * 5 - asset.fees * 10;
    expect(computeScore(asset)).toBeCloseTo(expected, 10);
  });
});
