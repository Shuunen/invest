import { invariant } from "es-toolkit";
import {
  AppDataSchema,
  IsinSchema,
  MAX_ISINS,
  MAX_PORTFOLIOS,
  PortfolioEntrySchema,
  PortfolioSchema,
  SettingsSchema,
  safeImportJson,
} from "./index";

// Shared minimal ISIN fixture — all optional fields omitted (they have defaults or are nullable)
const validIsin = {
  availableForPlan: true,
  availableOnBroker: true,
  fees: 0.2,
  isAccumulating: true,
  isin: "IE00B4L5Y983",
  name: "Core MSCI World",
};

// --- IsinSchema: rejection paths ---

describe("IsinSchema rejections", () => {
  it("rejects an ISIN code with invalid format", () => {
    const result = IsinSchema.safeParse({ ...validIsin, isin: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects negative fees", () => {
    const result = IsinSchema.safeParse({ ...validIsin, fees: -0.1 });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = IsinSchema.safeParse({ ...validIsin, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects geoAllocation with unknown country key", () => {
    const result = IsinSchema.safeParse({ ...validIsin, geoAllocation: { unknownCountry: 1 } });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown country/i);
  });

  it("rejects sectorAllocation with unknown sector key", () => {
    const result = IsinSchema.safeParse({ ...validIsin, sectorAllocation: { unknownSector: 0.5 } });
    expect(result.success).toBe(false);
    invariant(result.error, "Expected validation to fail");
    const [firstIssue] = result.error.issues;
    invariant(firstIssue, "Expected at least one issue");
    expect(firstIssue.message).toMatch(/unknown sector/i);
  });
});

// --- IsinSchema: happy paths ---

describe("IsinSchema happy paths", () => {
  it("coerces absent nullable performance/risk fields to undefined", () => {
    const result = IsinSchema.parse(validIsin);
    expect(result.performance3y).toBeUndefined();
    expect(result.riskReward3y).toBeUndefined();
  });

  it("accepts valid geoAllocation with known country keys", () => {
    const result = IsinSchema.safeParse({ ...validIsin, geoAllocation: { france: 0.4, us: 0.6 } });
    expect(result.success).toBe(true);
  });

  it("accepts valid sectorAllocation with known sector keys", () => {
    const result = IsinSchema.safeParse({ ...validIsin, sectorAllocation: { financials: 0.5, technology: 0.5 } });
    expect(result.success).toBe(true);
  });
});

// --- PortfolioEntrySchema ---

describe("PortfolioEntrySchema", () => {
  const validEntry = {
    isin: "IE00B4L5Y983",
    positionValue: 1000,
    targetAmount: 500,
  };

  it("rejects an ISIN code with invalid format", () => {
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, isin: "bad-isin" });
    expect(result.success).toBe(false);
  });

  it("rejects negative positionValue", () => {
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, positionValue: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative targetAmount", () => {
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, targetAmount: -50 });
    expect(result.success).toBe(false);
  });

  it("defaults inPEA to false and notes to empty string", () => {
    const result = PortfolioEntrySchema.parse(validEntry);
    expect(result.inPEA).toBe(false);
    expect(result.notes).toBe("");
  });
});

// --- PortfolioSchema ---

describe("PortfolioSchema", () => {
  const validPortfolio = {
    id: "87b67f15-e6f2-480b-8388-5440cc1c7423",
    name: "My Portfolio",
  };

  it("rejects an invalid UUID", () => {
    const result = PortfolioSchema.safeParse({ ...validPortfolio, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = PortfolioSchema.safeParse({ ...validPortfolio, name: "" });
    expect(result.success).toBe(false);
  });

  it("defaults broker to empty string and entries to empty array", () => {
    const result = PortfolioSchema.parse(validPortfolio);
    expect(result.broker).toBe("");
    expect(result.entries).toStrictEqual([]);
  });
});

// --- SettingsSchema: additional paths ---

describe("SettingsSchema: datetime and range validation", () => {
  it("accepts a valid ISO datetime for lastExportedAt", () => {
    const result = SettingsSchema.parse({ lastExportedAt: "2024-01-15T12:00:00.000Z" });
    expect(result.lastExportedAt).toBe("2024-01-15T12:00:00.000Z");
  });

  it("rejects similarityThreshold below 0", () => {
    const result = SettingsSchema.safeParse({ similarityThreshold: -0.1 });
    expect(result.success).toBe(false);
  });

  it("rejects similarityThreshold above 1", () => {
    const result = SettingsSchema.safeParse({ similarityThreshold: 1.1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative editCount", () => {
    const result = SettingsSchema.safeParse({ editCount: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort direction", () => {
    const result = SettingsSchema.safeParse({ sort: { column: "name", direction: "up" } });
    expect(result.success).toBe(false);
  });
});

describe("SettingsSchema: default values", () => {
  it("applies scalar defaults when no fields supplied", () => {
    const result = SettingsSchema.parse({});
    expect(result.theme).toBe("light");
    expect(result.editCount).toBe(0);
    expect(result.similarityThreshold).toBe(0.85);
  });

  it("applies collection defaults when no fields supplied", () => {
    const result = SettingsSchema.parse({});
    expect(result.columnOrder).toStrictEqual([]);
    expect(result.columnVisibility).toStrictEqual({});
    expect(result.sort).toStrictEqual({ column: "score", direction: "desc" });
  });
});

// --- safeImportJson: multi-issue error message ---

describe("safeImportJson error message format", () => {
  it("joins multiple schema errors with newlines", () => {
    // Two violations: invalid theme AND negative positionValue on a portfolio entry
    const bad = {
      isins: [],
      portfolios: [
        {
          entries: [{ isin: "IE00B4L5Y983", positionValue: -1, targetAmount: 0 }],
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
    expect(error).toMatch(/Schema error at/);
  });
});

// --- AppDataSchema: array length limits ---

describe("AppDataSchema limits", () => {
  it("rejects more than MAX_PORTFOLIOS portfolios", () => {
    const tooManyPortfolios = Array.from({ length: MAX_PORTFOLIOS + 1 }, (_val, idx) => ({
      entries: [],
      id: `87b67f15-e6f2-480b-${String(idx).padStart(4, "0")}-5440cc1c7423`,
      name: `Portfolio ${idx}`,
    }));
    const result = AppDataSchema.safeParse({ isins: [], portfolios: tooManyPortfolios, settings: {} });
    expect(result.success).toBe(false);
  });

  it("rejects more than MAX_ISINS ISINs", () => {
    const tooManyIsins = Array.from({ length: MAX_ISINS + 1 }, (_val, idx) => ({
      availableForPlan: false,
      availableOnBroker: false,
      fees: 0,
      isAccumulating: false,
      isin: `US${String(idx).padStart(9, "0")}${idx % 10}`,
      name: `Fund ${idx}`,
    }));
    const result = AppDataSchema.safeParse({ isins: tooManyIsins, portfolios: [], settings: {} });
    expect(result.success).toBe(false);
  });
});
