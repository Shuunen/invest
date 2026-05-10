import { invariant } from "es-toolkit";
import type { Asset } from "../schemas/index.ts";
import { computeAllocationSimilarity, computeAssetSimilarity, computeMaxSimilarity, similarityErrorThreshold, similarityWarningThreshold } from "./asset-similarity.ts";

describe("similarityWarningThreshold", () => {
  it("is 0.6", () => {
    expect.hasAssertions();
    expect(similarityWarningThreshold).toBe(0.6);
  });
});

describe("similarityErrorThreshold", () => {
  it("is 0.8", () => {
    expect.hasAssertions();
    expect(similarityErrorThreshold).toBe(0.8);
  });
});

describe("computeAllocationSimilarity", () => {
  it("returns undefined when both allocations are empty", () => {
    expect.hasAssertions();
    expect(computeAllocationSimilarity({}, {})).toBeUndefined();
  });

  it("returns 0 when left allocation is empty", () => {
    expect.hasAssertions();
    expect(computeAllocationSimilarity({}, { eu: 0.2, us: 0.8 })).toBe(0);
  });

  it("returns 0 when right allocation is empty", () => {
    expect.hasAssertions();
    expect(computeAllocationSimilarity({ eu: 0.2, us: 0.8 }, {})).toBe(0);
  });

  it("returns 1 for identical allocations", () => {
    expect.hasAssertions();
    expect(computeAllocationSimilarity({ eu: 0.2, us: 0.8 }, { eu: 0.2, us: 0.8 })).toBe(1);
  });

  it("computes partial overlap with percent scale", () => {
    expect.hasAssertions();
    // A: eu=40, us=60 → normalized: eu=0.4, us=0.6
    // B: asia=20, eu=50, us=30 → normalized: asia=0.2, eu=0.5, us=0.3
    // overlap: min(0.4,0.5) + min(0.6,0.3) + min(0,0.2) = 0.4 + 0.3 + 0 = 0.7
    const result = computeAllocationSimilarity({ eu: 40, us: 60 }, { asia: 20, eu: 50, us: 30 });
    expect(result).toBeCloseTo(0.7);
  });

  it("computes same partial overlap with unit scale", () => {
    expect.hasAssertions();
    const result = computeAllocationSimilarity({ eu: 0.4, us: 0.6 }, { asia: 0.2, eu: 0.5, us: 0.3 });
    expect(result).toBeCloseTo(0.7);
  });

  it("handles mixed scale (unit vs percent) via independent normalization", () => {
    expect.hasAssertions();
    // A={us:0.6} sum=0.6, Anorm={us:1.0}; B={us:60} sum=60, Bnorm={us:1.0} → overlap=1
    expect(computeAllocationSimilarity({ us: 0.6 }, { us: 60 })).toBeCloseTo(1);
  });

  it("handles corrupt data (sum > 100) without NaN", () => {
    expect.hasAssertions();
    const result = computeAllocationSimilarity({ eu: 60, us: 80 }, { eu: 60, us: 80 });
    expect(result).toBeTypeOf("number");
    expect(Number.isNaN(result)).toBe(false);
  });

  it("treats zero values as non-contributing — same as omitting the key", () => {
    expect.hasAssertions();
    const withZero = computeAllocationSimilarity({ eu: 0, us: 0.8 }, { us: 0.8 });
    // {us:0.8} vs {us:0.8} normalizes to 1 on both sides — overlap = 1
    expect(withZero).toBeCloseTo(1);
  });

  it("returns 0 when one allocation has all-zero values", () => {
    expect.hasAssertions();
    expect(computeAllocationSimilarity({ eu: 0, us: 0 }, { eu: 0.2, us: 0.8 })).toBe(0);
  });
});

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU0000000000",
    name: "Test ETF",
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
    ...overrides,
  };
}

describe("computeAssetSimilarity", () => {
  it("averages geo and sector when both are present and identical", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001", sectorAllocation: { technology: 1 } });
    const asset2 = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002", sectorAllocation: { technology: 1 } });
    expect(computeAssetSimilarity(asset1, asset2)).toBe(1);
  });

  it("uses only geo when both assets have geo and no sector", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ geoAllocation: { eu: 0.4, us: 0.6 }, isin: "LU0000000001" });
    const asset2 = makeAsset({ geoAllocation: { asia: 0.2, eu: 0.5, us: 0.3 }, isin: "LU0000000002" });
    expect(computeAssetSimilarity(asset1, asset2)).toBeCloseTo(0.7);
  });

  it("uses only sector when both assets have sector and no geo", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ isin: "LU0000000001", sectorAllocation: { technology: 1 } });
    const asset2 = makeAsset({ isin: "LU0000000002", sectorAllocation: { financials: 0.5, technology: 0.5 } });
    expect(computeAssetSimilarity(asset1, asset2)).toBeCloseTo(0.5);
  });

  it("returns 0 when A has geo but B has sector only (each dimension has one empty side)", () => {
    expect.hasAssertions();
    // geo: A={us:1}, B={} → one-empty → 0
    // sector: A={}, B={technology:1} → one-empty → 0
    // average of [0, 0] = 0
    const asset1 = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const asset2 = makeAsset({ isin: "LU0000000002", sectorAllocation: { technology: 1 } });
    expect(computeAssetSimilarity(asset1, asset2)).toBe(0);
  });

  it("returns geo similarity when both have matching geo and no sector", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ geoAllocation: { eu: 0.1, us: 0.9 }, isin: "LU0000000001" });
    const asset2 = makeAsset({ geoAllocation: { eu: 0.1, us: 0.9 }, isin: "LU0000000002" });
    expect(computeAssetSimilarity(asset1, asset2)).toBeCloseTo(1);
  });

  it("returns sector similarity when both have matching sector and no geo", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ isin: "LU0000000001", sectorAllocation: { financials: 0.3, technology: 0.7 } });
    const asset2 = makeAsset({ isin: "LU0000000002", sectorAllocation: { financials: 0.3, technology: 0.7 } });
    expect(computeAssetSimilarity(asset1, asset2)).toBeCloseTo(1);
  });

  it("returns undefined when both assets have no allocation data", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ isin: "LU0000000001" });
    const asset2 = makeAsset({ isin: "LU0000000002" });
    expect(computeAssetSimilarity(asset1, asset2)).toBeUndefined();
  });
});

describe("computeMaxSimilarity", () => {
  it("returns undefined when others is empty", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU0000000001" });
    expect(computeMaxSimilarity(asset, [])).toBeUndefined();
  });

  it("returns score and matchedIsin for a single other asset with data", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const other = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002", name: "Other ETF" });
    const result = computeMaxSimilarity(asset, [other]);
    expect(result).toBeDefined();
    invariant(result, "Expected result to be defined");
    expect(result.score).toBeCloseTo(1);
    expect(result.matchedIsin).toBe("LU0000000002");
  });

  it("returns the best match among multiple assets", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { eu: 0.5, us: 0.5 }, isin: "LU0000000001" });
    const otherA = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002" }); // overlap: 0.5
    const otherB = makeAsset({ geoAllocation: { eu: 0.5, us: 0.5 }, isin: "LU0000000003" }); // overlap: 1.0
    const result = computeMaxSimilarity(asset, [otherA, otherB]);
    expect(result).toBeDefined();
    invariant(result, "Expected result to be defined");
    expect(result.score).toBeCloseTo(1);
    expect(result.matchedIsin).toBe("LU0000000003");
  });

  it("returns undefined when all pairs produce undefined similarity", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU0000000001" });
    const other = makeAsset({ isin: "LU0000000002" });
    expect(computeMaxSimilarity(asset, [other])).toBeUndefined();
  });

  it("keeps the first best when a later candidate scores lower", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { eu: 0.5, us: 0.5 }, isin: "LU0000000001" });
    const best = makeAsset({ geoAllocation: { eu: 0.5, us: 0.5 }, isin: "LU0000000002" }); // overlap: 1.0
    const worse = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000003" }); // overlap: 0.5
    const result = computeMaxSimilarity(asset, [best, worse]);
    expect(result).toBeDefined();
    invariant(result, "Expected result to be defined");
    expect(result.matchedIsin).toBe("LU0000000002");
  });

  it("excludes self-comparison even when asset appears in others", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    expect(computeMaxSimilarity(asset, [asset])).toBeUndefined();
  });
});
