import type { Asset } from "../schemas/asset.ts";
import type { PortfolioEntry } from "../schemas/portfolio.ts";
import { computeDataScore } from "./data-score.ts";

const baseAsset: Asset = {
  availableForPea: true,
  availableForPlan: true,
  availableOnBroker: true,
  comments: "",
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
  geoAllocation: { europe: 0.4, us: 0.6 },
  performance1y: 10,
  performance3y: 20,
  performance5y: 30,
  price: 100,
  riskReward1y: 1,
  riskReward3y: 1.5,
  riskReward5y: 2,
  sectorAllocation: { financials: 0.3, technology: 0.7 },
};

const fullEntry: PortfolioEntry = {
  amount: 1,
  amountUpdatedAt: undefined,
  inPEA: false,
  isin: fullAsset.isin,
  notes: "",
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
    // 5 scored fields + 0.5 (stale updatedAt) + 1 (fresh amountUpdatedAt within 90 days) = 6.5/7 = 92.86 → rounds to 93
    expect(computeDataScore({ ...fullAsset, updatedAt: staleDate }, { ...fullEntry, amountUpdatedAt: staleDate })).toBe(93);
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
    // 5 scored fields + 1 (fresh updatedAt) + 0 (no amountUpdatedAt) = 6/7 = 85.71 → scales with allocations (x1.0) and rounds to 86
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, fullEntry)).toBe(86);
  });

  it("gives partial credit for stale amountUpdatedAt in portfolio context", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const staleAmount = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(); // 120 days ago
    // 5 scored fields + 1 (fresh updatedAt) + 0.5 (stale amountUpdatedAt) = 6.5/7 = 92.86 → scales with allocations (x1.0) and rounds to 93
    expect(computeDataScore({ ...fullAsset, updatedAt: freshDate }, { ...fullEntry, amountUpdatedAt: staleAmount })).toBe(93);
  });

  it("returns 0 when allocations are empty (no allocation data at all)", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithNoAllocations = {
      ...fullAsset,
      geoAllocation: {},
      sectorAllocation: {},
      updatedAt: freshDate,
    };
    // coverage = (0 + 0) / 2 = 0 → score is 0 regardless of other fields
    expect(computeDataScore(assetWithNoAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(0);
  });

  it("reduces score when allocation totals are below 100%", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithPartialAllocations = {
      ...fullAsset,
      geoAllocation: { us: 0.8 },
      sectorAllocation: { technology: 0.6 },
      updatedAt: freshDate,
    };
    // Base score is 100, then scaled by allocation coverage average: (0.8 + 0.6) / 2 = 0.7
    expect(computeDataScore(assetWithPartialAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(70);
  });

  it("does not penalize score when allocations reach or exceed 100%", () => {
    expect.hasAssertions();
    const freshDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const assetWithCompleteAllocations = {
      ...fullAsset,
      geoAllocation: { europe: 0.4, us: 0.6 },
      sectorAllocation: { financials: 0.4, technology: 0.7 },
      updatedAt: freshDate,
    };
    expect(computeDataScore(assetWithCompleteAllocations, { ...fullEntry, amountUpdatedAt: freshDate })).toBe(100);
  });
});
