import { readFileSync } from "node:fs";
import path from "node:path";
import { invariant } from "es-toolkit";
import { jsonParse } from "../utils/json.ts";
import { AppDataSchema, parseAppData, safeImportJson, type AppData } from "./app-data.ts";
import { maxIsins } from "./asset.ts";
import { maxPortfolios } from "./portfolio.ts";

const sampleRaw = readFileSync(path.join(process.cwd(), "data/sample.json"), "utf8");

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
          entries: [...firstPortfolio.entries, { amount: 0, inPEA: false, isin: "XX0000000000", notes: "", targetAmount: 0 }],
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

describe("parseAppData", () => {
  it("returns parsed data for valid input", () => {
    expect.hasAssertions();
    const data = parseAppData(jsonParse(sampleRaw));
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBeGreaterThan(0);
    expect(Array.isArray(data.portfolios)).toBe(true);
    expect(data.settings.theme).toBeTypeOf("string");
  });
});

describe("safeImportJson error message format", () => {
  it("joins multiple schema errors with newlines", () => {
    expect.hasAssertions();
    // Two violations: invalid theme AND negative targetAmount on a portfolio entry
    const bad = {
      assets: [],
      portfolios: [
        {
          broker: "Broker",
          entries: [{ isin: "IE00B4L5Y983", targetAmount: -1 }],
          id: "87b67f15-e6f2-480b-8388-5440cc1c7423",
          name: "P",
        },
      ],
      settings: { theme: "invalid" },
    };
    const result = safeImportJson(JSON.stringify(bad));
    expect(result).toHaveProperty("error");
    const { error } = result as { error: string };
    // Should contain at least two lines (newline-separated)
    expect(error.split("\n").length).toBeGreaterThanOrEqual(2);
    expect(error).toMatch(/Schema error at/u);
  });
});

describe("AppDataSchema uniqueness constraints", () => {
  const validSettings = {};
  const asset1 = { availableForPlan: true, availableOnBroker: true, fees: 0.2, isAccumulating: true, isin: "IE00B4L5Y983", name: "Fund A" };
  const asset2 = { availableForPlan: true, availableOnBroker: true, fees: 0.1, isAccumulating: false, isin: "LU0629460089", name: "Fund B" };
  const portfolio1 = { broker: "Broker A", entries: [], id: "87b67f15-e6f2-480b-8388-5440cc1c7423", name: "P1" };
  const portfolio2 = { broker: "Broker B", entries: [], id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", name: "P2" };

  it("rejects two assets with the same ISIN", () => {
    expect.hasAssertions();
    const result = AppDataSchema.safeParse({ assets: [asset1, { ...asset2, isin: asset1.isin }], portfolios: [], settings: validSettings });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const dupeIssue = result.error.issues.find(issue => issue.message.includes("Duplicate ISIN"));
    expect(dupeIssue).toBeDefined();
  });

  it("accepts two assets with distinct ISINs", () => {
    expect.hasAssertions();
    const result = AppDataSchema.safeParse({ assets: [asset1, asset2], portfolios: [], settings: validSettings });
    expect(result.success).toBe(true);
  });

  it("rejects two portfolios with the same ID", () => {
    expect.hasAssertions();
    const result = AppDataSchema.safeParse({ assets: [], portfolios: [portfolio1, { ...portfolio2, id: portfolio1.id }], settings: validSettings });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const dupeIssue = result.error.issues.find(issue => issue.message.includes("Duplicate portfolio ID"));
    expect(dupeIssue).toBeDefined();
  });

  it("accepts two portfolios with distinct IDs", () => {
    expect.hasAssertions();
    const result = AppDataSchema.safeParse({ assets: [asset1], portfolios: [portfolio1, portfolio2], settings: validSettings });
    expect(result.success).toBe(true);
  });
});

describe("AppDataSchema limits", () => {
  it("rejects more than maxPortfolios portfolios", () => {
    expect.hasAssertions();
    const tooManyPortfolios = Array.from({ length: maxPortfolios + 1 }, (_val, idx) => ({
      broker: "Broker",
      entries: [],
      id: `87b67f15-e6f2-480b-${String(idx).padStart(4, "0")}-5440cc1c7423`,
      name: `Portfolio ${idx}`,
    }));
    const result = AppDataSchema.safeParse({ assets: [], portfolios: tooManyPortfolios, settings: {} });
    expect(result.success).toBe(false);
  });

  it("rejects more than maxIsins ISINs", () => {
    expect.hasAssertions();
    const tooManyIsins = Array.from({ length: maxIsins + 1 }, (_val, idx) => ({
      availableForPlan: false,
      availableOnBroker: false,
      fees: 0,
      isAccumulating: false,
      isin: `US${String(idx).padStart(9, "0")}${idx % 10}`,
      name: `Fund ${idx}`,
    }));
    const result = AppDataSchema.safeParse({ assets: tooManyIsins, portfolios: [], settings: {} });
    expect(result.success).toBe(false);
  });
});
