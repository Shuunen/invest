import { invariant } from "es-toolkit";
import type { Asset } from "../../schemas/index.ts";
import { buildAssetFromForm, parseOptionalNumber, parseZodErrors, toFormState, type FormState } from "./form-state.ts";

describe("parseZodErrors", () => {
  it("maps string-path issues to their field name", () => {
    expect.hasAssertions();
    const errors = parseZodErrors([{ message: "Required", path: ["name"] }]);
    expect(errors.name).toBe("Required");
  });

  it("collects empty-path issues into the 'form' key", () => {
    expect.hasAssertions();
    const errors = parseZodErrors([{ message: "Schema-level error", path: [] }]);
    expect(errors.form).toBe("Schema-level error");
  });

  it("collects numeric-path issues into the 'form' key", () => {
    expect.hasAssertions();
    const errors = parseZodErrors([{ message: "Array error", path: [0] }]);
    expect(errors.form).toBe("Array error");
  });
});

const BASE_ISIN = "LU1234567890";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: BASE_ISIN,
    name: "Test ETF",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    price: undefined,
    provider: "Test",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

function makeFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    fees: "0.20",
    geoAllocation: {},
    isAccumulating: true,
    isin: BASE_ISIN,
    name: "Test ETF",
    performance1y: "10",
    performance3y: "30",
    performance5y: "50",
    price: "",
    provider: "Test",
    riskReward1y: "1.5",
    riskReward3y: "1.8",
    riskReward5y: "1.6",
    sectorAllocation: {},
    tickers: "TST",
    ...overrides,
  };
}

describe("parseOptionalNumber", () => {
  it("returns undefined for empty string", () => {
    expect.hasAssertions();
    expect(parseOptionalNumber("")).toBeUndefined();
  });

  it("returns undefined for whitespace-only string", () => {
    expect.hasAssertions();
    expect(parseOptionalNumber("   ")).toBeUndefined();
  });

  it("returns undefined for non-numeric string", () => {
    expect.hasAssertions();
    expect(parseOptionalNumber("abc")).toBeUndefined();
  });

  it("parses a valid number string", () => {
    expect.hasAssertions();
    expect(parseOptionalNumber("3.14")).toBe(3.14);
  });

  it("parses an integer string", () => {
    expect.hasAssertions();
    expect(parseOptionalNumber("42")).toBe(42);
  });
});

describe("toFormState", () => {
  it("converts defined optional numeric fields to strings", () => {
    expect.hasAssertions();
    const asset = makeAsset({ performance1y: 15, price: 100 });
    const form = toFormState(asset);
    expect(form.performance1y).toBe("15");
    expect(form.price).toBe("100");
  });

  it("converts undefined optional numeric fields to empty string", () => {
    expect.hasAssertions();
    const asset = makeAsset({ performance1y: undefined, price: undefined });
    const form = toFormState(asset);
    expect(form.performance1y).toBe("");
    expect(form.price).toBe("");
  });

  it("converts undefined 3y, 5y and risk/reward fields to empty string", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      performance3y: undefined,
      performance5y: undefined,
      riskReward1y: undefined,
      riskReward3y: undefined,
      riskReward5y: undefined,
    });
    const form = toFormState(asset);
    expect(form.performance3y).toBe("");
    expect(form.performance5y).toBe("");
    expect(form.riskReward1y).toBe("");
    expect(form.riskReward3y).toBe("");
    expect(form.riskReward5y).toBe("");
  });

  it("joins tickers with comma and space", () => {
    expect.hasAssertions();
    const asset = makeAsset({ tickers: ["IWDA", "SWRD"] });
    const form = toFormState(asset);
    expect(form.tickers).toBe("IWDA, SWRD");
  });

  it("converts geo allocation decimals to percentage strings", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { france: 0.4, us: 0.6 } });
    const form = toFormState(asset);
    expect(form.geoAllocation).toStrictEqual({ france: "40", us: "60" });
  });

  it("converts sector allocation decimals to percentage strings", () => {
    expect.hasAssertions();
    const asset = makeAsset({ sectorAllocation: { financials: 0.5, technology: 0.5 } });
    const form = toFormState(asset);
    expect(form.sectorAllocation).toStrictEqual({ financials: "50", technology: "50" });
  });
});

describe("buildAssetFromForm - success", () => {
  it("returns parsed Asset on valid form data", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState());
    invariant("data" in result, "Expected success result");
    expect(result.data.name).toBe("Test ETF");
    expect(result.data.isin).toBe(BASE_ISIN);
  });

  it("parses tickers from comma-separated string", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ tickers: "TST, ABC" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.tickers).toStrictEqual(["TST", "ABC"]);
  });

  it("maps empty performance string to undefined", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ performance1y: "" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.performance1y).toBeUndefined();
  });

  it("converts geo allocation percentages to decimals", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ geoAllocation: { france: "40", us: "60" } }));
    invariant("data" in result, "Expected success result");
    expect(result.data.geoAllocation).toStrictEqual({ france: 0.4, us: 0.6 });
  });

  it("converts sector allocation percentages to decimals", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ sectorAllocation: { financials: "50", technology: "50" } }));
    invariant("data" in result, "Expected success result");
    expect(result.data.sectorAllocation).toStrictEqual({ financials: 0.5, technology: 0.5 });
  });

  it("omits zero and empty geo allocation entries", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ geoAllocation: { france: "0", germany: "", us: "60" } }));
    invariant("data" in result, "Expected success result");
    expect(result.data.geoAllocation).toStrictEqual({ us: 0.6 });
  });
});

describe("buildAssetFromForm - Zod validation errors", () => {
  it("returns name error when name is empty", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ name: "" }));
    invariant("errors" in result, "Expected error result");
    expect(result.errors.name).toBeDefined();
  });

  it("returns fees error when fees is negative", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ fees: "-1" }));
    invariant("errors" in result, "Expected error result");
    expect(result.errors.fees).toBeDefined();
  });

  it("treats empty fees string as 0 (valid, no fee)", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(makeFormState({ fees: "" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.fees).toBe(0);
  });
});
