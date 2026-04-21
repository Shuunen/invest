import { readFileSync } from "node:fs";
import { join } from "node:path";
import { invariant } from "es-toolkit";
import { safeImportJson, computeScore, AppDataSchema, type AppData } from "./index";

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

  it("rejects portfolio entry referencing unknown ISIN", () => {
    const valid = AppDataSchema.parse(JSON.parse(sampleRaw));
    const [firstPortfolio] = valid.portfolios;
    invariant(firstPortfolio, "Expected at least one portfolio");
    const invalidData: AppData = {
      ...valid,
      portfolios: [
        {
          ...firstPortfolio,
          entries: [
            ...firstPortfolio.entries,
            { inPEA: false, isin: "XX0000000000", notes: "", positionValue: 100, targetAmount: 0 },
          ],
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

describe("computeScore", () => {
  it("returns undefined when performance3y is missing", () => {
    const isin = AppDataSchema.parse(JSON.parse(sampleRaw)).isins.find(entry => entry.performance3y === undefined);
    expect(isin).toBeDefined();
    invariant(isin, "Expected to find an ISIN with undefined performance3y");
    expect(computeScore(isin)).toBeUndefined();
  });

  it("returns a number for fully populated ISINs", () => {
    const data = AppDataSchema.parse(JSON.parse(sampleRaw));
    const complete = data.isins.find(entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined);
    expect(complete).toBeDefined();
    invariant(complete, "Expected to find a fully populated ISIN");
    const score = computeScore(complete);
    expect(score).toBeTypeOf("number");
  });

  it("matches formula: perf3y + risk3y*5 - fees*10", () => {
    const isin = AppDataSchema.parse(JSON.parse(sampleRaw)).isins.find(
      entry => entry.performance3y !== undefined && entry.riskReward3y !== undefined,
    );
    invariant(isin, "Expected to find an ISIN with all required fields");
    invariant(isin.performance3y !== undefined, "Expected performance3y to be defined");
    invariant(isin.riskReward3y !== undefined, "Expected riskReward3y to be defined");
    const expected = isin.performance3y + isin.riskReward3y * 5 - isin.fees * 10;
    expect(computeScore(isin)).toBeCloseTo(expected, 10);
  });
});
