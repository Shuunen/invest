import { invariant } from "es-toolkit";
import type { Asset } from "../../schemas/index.ts";
import { buildAssetFromForm, parseOptionalNumber, toFormState, type FormState } from "./form-state.ts";

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
    geoAllocation: "{}",
    isAccumulating: true,
    name: "Test ETF",
    performance1y: "10",
    performance3y: "30",
    performance5y: "50",
    price: "",
    provider: "Test",
    riskReward1y: "1.5",
    riskReward3y: "1.8",
    riskReward5y: "1.6",
    sectorAllocation: "{}",
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
});

describe("buildAssetFromForm - success", () => {
  it("returns parsed Asset on valid form data", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState());
    invariant("data" in result, "Expected success result");
    expect(result.data.name).toBe("Test ETF");
    expect(result.data.isin).toBe(BASE_ISIN);
  });

  it("parses tickers from comma-separated string", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ tickers: "TST, ABC" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.tickers).toStrictEqual(["TST", "ABC"]);
  });

  it("maps empty performance string to undefined", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ performance1y: "" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.performance1y).toBeUndefined();
  });

  it("falls back to empty object for invalid JSON in geoAllocation", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ geoAllocation: "not valid json" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.geoAllocation).toStrictEqual({});
  });

  it("falls back to empty object for invalid JSON in sectorAllocation", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ sectorAllocation: "not valid json" }));
    invariant("data" in result, "Expected success result");
    expect(result.data.sectorAllocation).toStrictEqual({});
  });
});

describe("buildAssetFromForm - Zod validation errors", () => {
  it("returns name error when name is empty", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ name: "" }));
    invariant("errors" in result, "Expected error result");
    expect(result.errors.name).toBeDefined();
  });

  it("returns fees error when fees is negative", () => {
    expect.hasAssertions();
    const result = buildAssetFromForm(BASE_ISIN, makeFormState({ fees: "-1" }));
    invariant("errors" in result, "Expected error result");
    expect(result.errors.fees).toBeDefined();
  });
});
