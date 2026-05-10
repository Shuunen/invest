import type { Allocation } from "../schemas/index.ts";
import { computeBalanceScore } from "./allocation-balance.ts";

describe("computeBalanceScore", () => {
  it("returns 100 % for empty allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = {};
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("returns 100 % for allocation with no positive values", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 0, bbb: 0, ccc: 0 };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("returns 100 % for allocation with single positive value", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 50 };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("returns 100 % for perfectly balanced allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 25, bbb: 25, ccc: 25, ddd: 25 };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("returns low score when sparse allocation has large remainder", () => {
    expect.hasAssertions();
    // [10, 10, 10, 70]: still quite uneven but no longer hard-clamped to 0
    const allocation: Allocation = { aaa: 10, bbb: 10, ccc: 10 };
    expect(computeBalanceScore(allocation)).toBe(40);
  });

  it("returns low score for extremely unbalanced allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 100, bbb: 1 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`2`);
  });

  it("returns score for 60-40 split", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 60, bbb: 40 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`80`);
  });

  it("handles mixed positive and zero values correctly", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 50, bbb: 50, ccc: 0, ddd: 0 };
    // [50, 50]: perfectly balanced, no remainder
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("calculates balance for 70-30 split", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 70, bbb: 30 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`60`);
  });

  it("ignores zero and undefined values in balance calculation", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 25, bbb: 25, ccc: 25, ddd: 25, eee: 0, fff: undefined };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("returns high score for 55-45 split", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 55, bbb: 45 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`90`);
  });

  it("handles allocation with only undefined values", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: undefined, bbb: undefined };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("calculates balance for 40-40-20 allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 40, bbb: 40, ccc: 20 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`80`);
  });

  it("filters out negative values", () => {
    expect.hasAssertions();
    // Only [50, 50] count: perfectly balanced
    const allocation: Allocation = { aaa: 50, bbb: 50, ccc: -10 };
    expect(computeBalanceScore(allocation)).toBe(100);
  });

  it("handles very small differences in allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 51, bbb: 49 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`98`);
  });

  it("accounts for remainder when calculating balance", () => {
    expect.hasAssertions();
    // [30, 60, 10]: medium imbalance due to one overweight bucket
    const allocation: Allocation = { aaa: 30, bbb: 60 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`60`);
  });

  it("returns low balance when remainder is large", () => {
    expect.hasAssertions();
    // [80, 15, 5]: strongly concentrated but not totally collapsed
    const allocation: Allocation = { aaa: 80, bbb: 15 };
    const score = computeBalanceScore(allocation);
    expect(score).toBe(30);
  });

  it("returns high balance when remainder is balanced", () => {
    expect.hasAssertions();
    const allocation: Allocation = { aaa: 33, bbb: 33 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`99`);
  });

  it("real use case with 0-1 percents", () => {
    expect.hasAssertions();
    // other is 0.145
    const allocation: Allocation = { comm: 0.085, indus: 0.13, materials: 0.36, tech: 0.28 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`70`);
  });

  it("real use case with 0-100 percents", () => {
    expect.hasAssertions();
    // other is 4.08
    const allocation: Allocation = { japan: 3.36, netherlands: 7.32, southKorea: 3.81, taiwan: 17.1, us: 64.33 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`42`);
  });

  it("solo 96.89", () => {
    expect.hasAssertions();
    const allocation: Allocation = { japan: 96.89 };
    const score = computeBalanceScore(allocation);
    expect(score).toMatchInlineSnapshot(`6`);
  });
});
