import { invariant } from "es-toolkit";
import type { Allocation, Asset, PortfolioEntry } from "../schemas/index.ts";
import { buildAllocationEntries, computePortfolioWeightedAllocations, computeWeightedAllocationsFromSelection } from "./allocation-charts.ts";

describe("buildAllocationEntries", () => {
  it("returns undefined for empty allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = {};
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("returns undefined when all values are zero or undefined", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0, uk: undefined, us: 0 };
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("returns undefined when all values are negative", () => {
    expect.hasAssertions();
    const allocation: Allocation = { us: -0.5 };
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("formats keyMapping keys: communicationServices, consumerDiscretionary, consumerStaples", () => {
    expect.hasAssertions();
    const allocation: Allocation = { communicationServices: 0.4, consumerDiscretionary: 0.4, consumerStaples: 0.2 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    const labels = entries.map(entry => entry.label);
    expect(labels).toContain("Communication");
    expect(labels).toContain("Luxury");
    expect(labels).toContain("Basic needs");
  });

  it("formats keyMapping keys: uk, us", () => {
    expect.hasAssertions();
    const allocation: Allocation = { uk: 0.5, us: 0.5 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    const labels = entries.map(entry => entry.label);
    expect(labels).toContain("UK");
    expect(labels).toContain("USA");
  });

  it("uses startCase for keys not in keyMapping", () => {
    expect.hasAssertions();
    const allocation: Allocation = { realEstate: 0.5 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    expect(entries[0]).toBeDefined();
    invariant(entries[0], "Expected first entry");
    expect(entries[0].label).toBe("Real Estate");
  });

  it("sorts entries by value descending", () => {
    expect.hasAssertions();
    const allocation: Allocation = { asia: 0.3, europe: 0.1, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    invariant(entries[1], "Expected second entry");
    invariant(entries[2], "Expected third entry");
    expect(entries[0].key).toBe("us");
    expect(entries[1].key).toBe("asia");
    expect(entries[2].key).toBe("europe");
  });

  it("assigns colorMap color to known keys", () => {
    expect.hasAssertions();
    const allocation: Allocation = { us: 1 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    expect(entries[0].fill).toBe("var(--color-sky-900)");
  });

  it("assigns fallback color for unknown keys", () => {
    expect.hasAssertions();
    const allocation: Allocation = { unknownCountry: 1 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    expect(entries[0].fill).toBe("#0072B2");
  });

  it("cycles through fallbackColors for more than 11 entries", () => {
    expect.hasAssertions();
    const allocation: Allocation = {};
    for (let idx = 0; idx < 13; idx += 1) allocation[`unknown${String(idx)}`] = 0.05;
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for 13-key allocation");
    expect(entries.length).toBeGreaterThanOrEqual(12);
  });

  it("appends Other entry when sum is below 1", () => {
    expect.hasAssertions();
    const allocation: Allocation = { us: 0.98 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    const other = entries.find(entry => entry.key === "other");
    expect(other).toBeDefined();
    invariant(other, "Expected Other entry");
    expect(other.label).toBe("Other");
    expect(other.value).toBeCloseTo(0.02);
    expect(other.fill).toBe("#777");
  });

  it("does not append Other entry when sum is exactly 1", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0.4, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    expect(entries.find(entry => entry.key === "other")).toBeUndefined();
  });

  it("does not append Other entry when sum exceeds 1", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0.45, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    expect(entries.find(entry => entry.key === "other")).toBeUndefined();
  });
});

// Test helpers for weighted allocation tests
function makeAsset(overrides?: Partial<Asset>): Asset {
  return {
    availableForPlan: true,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.5,
    geoAllocation: { uk: 0.4, us: 0.6 },
    isAccumulating: true,
    isin: "IE00B4L5Y983",
    name: "Test Asset",
    performance1y: undefined,
    performance3y: 0.1,
    performance5y: undefined,
    price: 100,
    provider: "Vanguard",
    riskReward1y: undefined,
    riskReward3y: 1.5,
    riskReward5y: undefined,
    sectorAllocation: { financials: 0.5, technology: 0.5 },
    tickers: [],
    updatedAt: undefined,
    ...overrides,
  };
}

function makeEntry(overrides?: Partial<PortfolioEntry>): PortfolioEntry {
  return {
    amount: 1000,
    amountUpdatedAt: undefined,
    inPEA: false,
    isin: "IE00B4L5Y983",
    notes: "",
    positionValue: 100_000,
    targetAmount: 0,
    ...overrides,
  };
}

describe("computePortfolioWeightedAllocations", () => {
  it("returns empty allocations when totalValue is 0", () => {
    expect.hasAssertions();
    const assets = [makeAsset()];
    const entries = [makeEntry({ amount: 100, isin: "IE00B4L5Y983" })];

    const result = computePortfolioWeightedAllocations(entries, assets, 0);

    expect(result.geo).toStrictEqual({});
    expect(result.sector).toStrictEqual({});
  });

  it("computes weighted allocations for a single asset", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { uk: 0.4, us: 0.6 },
      isin: "ASSET1",
      price: 100,
      sectorAllocation: { financials: 0.3, technology: 0.7 },
    });
    const entry = makeEntry({ amount: 100, isin: "ASSET1" });
    const totalValue = 10_000; // 100 * 100

    const result = computePortfolioWeightedAllocations([entry], [asset], totalValue);

    // Weight: (100 * 100) / 10_000 = 1.0 (100% of portfolio)
    expect(result.geo.us).toBe(0.6);
    expect(result.geo.uk).toBe(0.4);
    expect(result.sector.technology).toBe(0.7);
    expect(result.sector.financials).toBe(0.3);
  });

  it("correctly weights allocations for 80/20 portfolio split", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({
      geoAllocation: { us: 1 },
      isin: "ASSET1",
      price: 100,
      sectorAllocation: { technology: 1 },
    });
    const asset2 = makeAsset({
      geoAllocation: { uk: 1 },
      isin: "ASSET2",
      price: 100,
      sectorAllocation: { financials: 1 },
    });

    const entry1 = makeEntry({ amount: 800, isin: "ASSET1" }); // 800 * 100 = 80_000
    const entry2 = makeEntry({ amount: 200, isin: "ASSET2" }); // 200 * 100 = 20_000
    const totalValue = 100_000;

    const result = computePortfolioWeightedAllocations([entry1, entry2], [asset1, asset2], totalValue);

    // Asset1: weight = 80_000 / 100_000 = 0.8
    // Asset2: weight = 20_000 / 100_000 = 0.2
    expect(result.geo.us).toBe(0.8);
    expect(result.geo.uk).toBe(0.2);
    expect(result.sector.technology).toBe(0.8);
    expect(result.sector.financials).toBe(0.2);
  });

  it("treats undefined prices as 0 (skipping contribution)", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({
      geoAllocation: { us: 1 },
      isin: "ASSET1",
      price: 100,
    });
    const asset2 = makeAsset({
      geoAllocation: { uk: 1 },
      isin: "ASSET2",
      price: undefined,
    });

    const entry1 = makeEntry({ amount: 100, isin: "ASSET1" }); // 100 * 100 = 10_000
    const entry2 = makeEntry({ amount: 100, isin: "ASSET2" }); // 100 * undefined = 0
    const totalValue = 10_000;

    const result = computePortfolioWeightedAllocations([entry1, entry2], [asset1, asset2], totalValue);

    // Only asset1 contributes: weight = 10_000 / 10_000 = 1.0
    // asset2 contributes nothing (weight = 0), so uk gets 1 * 0 = 0
    expect(result.geo).toStrictEqual({ uk: 0, us: 1 });
  });

  it("skips entries whose ISIN has no matching asset", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { us: 1 },
      isin: "KNOWN_ASSET",
      price: 100,
    });

    const entry1 = makeEntry({ amount: 100, isin: "KNOWN_ASSET" }); // 100 * 100 = 10_000
    const entry2 = makeEntry({ amount: 100, isin: "UNKNOWN_ASSET" }); // skipped
    const totalValue = 10_000;

    const result = computePortfolioWeightedAllocations([entry1, entry2], [asset], totalValue);

    // Only known asset contributes: weight = 10_000 / 10_000 = 1.0
    expect(result.geo.us).toBe(1);
  });

  it("correctly computes geo and sector allocations together", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { uk: 0.5, us: 0.5 },
      isin: "MULTI",
      price: 100,
      sectorAllocation: { financials: 0.7, technology: 0.3 },
    });

    const entry = makeEntry({ amount: 100, isin: "MULTI" });
    const totalValue = 10_000;

    const result = computePortfolioWeightedAllocations([entry], [asset], totalValue);

    // Weight: 1.0 (entire portfolio)
    expect(result.geo).toStrictEqual({ uk: 0.5, us: 0.5 });
    expect(result.sector).toStrictEqual({ financials: 0.7, technology: 0.3 });
  });

  it("skips undefined allocation values", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { fr: 0, us: 0.6 },
      isin: "SPARSE",
      price: 100,
      sectorAllocation: { technology: 0.7 },
    });

    const entry = makeEntry({ amount: 100, isin: "SPARSE" });
    const totalValue = 10_000;

    const result = computePortfolioWeightedAllocations([entry], [asset], totalValue);

    // Only defined positive values should appear
    expect(result.geo.us).toBe(0.6);
    expect(result.geo.fr).toBeUndefined();
    expect(result.sector.technology).toBe(0.7);
  });

  it("correctly accumulates allocations from multiple assets", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({
      geoAllocation: { uk: 0.2, us: 0.8 },
      isin: "A1",
      price: 50,
      sectorAllocation: { financials: 0.4, technology: 0.6 },
    });
    const asset2 = makeAsset({
      geoAllocation: { eu: 0.7, us: 0.3 },
      isin: "A2",
      price: 100,
      sectorAllocation: { healthcare: 1 },
    });

    // Entry 1: 50 * 50 = 2_500 → weight = 2_500 / 5_000 = 0.5
    const entry1 = makeEntry({ amount: 50, isin: "A1" });
    // Entry 2: 25 * 100 = 2_500 → weight = 2_500 / 5_000 = 0.5
    const entry2 = makeEntry({ amount: 25, isin: "A2" });
    const totalValue = 5000;

    const result = computePortfolioWeightedAllocations([entry1, entry2], [asset1, asset2], totalValue);

    // geo: us = 0.8 * 0.5 + 0.3 * 0.5 = 0.55
    //      uk = 0.2 * 0.5 = 0.1
    //      eu = 0.7 * 0.5 = 0.35
    expect(result.geo.us).toBe(0.55);
    expect(result.geo.uk).toBe(0.1);
    expect(result.geo.eu).toBe(0.35);

    // sector: technology = 0.6 * 0.5 = 0.3
    //         financials = 0.4 * 0.5 = 0.2
    //         healthcare = 1 * 0.5 = 0.5
    expect(result.sector).toStrictEqual({ financials: 0.2, healthcare: 0.5, technology: 0.3 });
  });

  it("handles empty entries array", () => {
    expect.hasAssertions();
    const assets = [makeAsset()];
    const result = computePortfolioWeightedAllocations([], assets, 10_000);

    expect(result.geo).toStrictEqual({});
    expect(result.sector).toStrictEqual({});
  });

  it("handles empty assets array", () => {
    expect.hasAssertions();
    const entries = [makeEntry()];
    const result = computePortfolioWeightedAllocations(entries, [], 10_000);

    expect(result.geo).toStrictEqual({});
    expect(result.sector).toStrictEqual({});
  });

  it("handles entry with zero amount", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { us: 1 },
      isin: "ASSET1",
      price: 100,
    });
    const entry = makeEntry({ amount: 0, isin: "ASSET1" });
    const totalValue = 1000; // Some other value

    const result = computePortfolioWeightedAllocations([entry], [asset], totalValue);

    // Entry with amount 0 has weight 0, so us gets 1 * 0 = 0
    expect(result.geo).toStrictEqual({ us: 0 });
  });
});

describe("computeWeightedAllocationsFromSelection", () => {
  it("uses amount map and computes weighted allocations", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ geoAllocation: { us: 1 }, isin: "ASSET1", price: 100, sectorAllocation: { technology: 1 } });
    const asset2 = makeAsset({ geoAllocation: { uk: 1 }, isin: "ASSET2", price: 100, sectorAllocation: { financials: 1 } });
    const selected = new Set([asset1.isin, asset2.isin]);
    const amountByIsin = new Map([
      [asset1.isin, 80],
      [asset2.isin, 20],
    ]);

    const result = computeWeightedAllocationsFromSelection({ amountByIsin, assets: [asset1, asset2], defaultAmount: 0, selectedIsins: selected });

    expect(result.geo.us).toBe(0.8);
    expect(result.geo.uk).toBe(0.2);
    expect(result.sector.technology).toBe(0.8);
    expect(result.sector.financials).toBe(0.2);
  });

  it("uses default amount when amount map entry is missing", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { us: 1 }, isin: "ASSET1", price: 100 });
    const selected = new Set([asset.isin]);

    const result = computeWeightedAllocationsFromSelection({ assets: [asset], selectedIsins: selected });

    expect(result.geo).toStrictEqual({ us: 1 });
  });
});
