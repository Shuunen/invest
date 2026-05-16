import { ArrowDownToDot, EqualIcon, TrendingDown, TrendingUp } from "lucide-react";
import { computeTrend } from "./trend.ts";

describe("computeTrend", () => {
  it("returns almost-equal when both before and after are zero", () => {
    expect.hasAssertions();
    const result = computeTrend(0, 0);
    expect(result.trend).toBe("almost-equal");
    expect(result.Icon).toBe(EqualIcon);
    expect(result.showWarning).toBe(false);
  });

  it("returns increased-a-lot when before is zero and after is positive", () => {
    expect.hasAssertions();
    const result = computeTrend(0, 5);
    expect(result.trend).toBe("increased-a-lot");
    expect(result.Icon).toBe(TrendingUp);
    expect(result.showWarning).toBe(false);
  });

  it("returns decreased-a-lot when before is zero and after is negative", () => {
    expect.hasAssertions();
    const result = computeTrend(0, -5);
    expect(result.trend).toBe("decreased-a-lot");
    expect(result.Icon).toBe(TrendingDown);
    expect(result.showWarning).toBe(false);
  });

  it("returns decreased-a-lot when change is >= 10% drop", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 85);
    expect(result.trend).toBe("decreased-a-lot");
    expect(result.Icon).toBe(TrendingDown);
    expect(result.showWarning).toBe(false);
  });

  it("returns decreased-a-bit when change is between -2% and -10%", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 95);
    expect(result.trend).toBe("decreased-a-bit");
    expect(result.Icon).toBe(TrendingDown);
    expect(result.showWarning).toBe(false);
  });

  it("returns almost-equal when change is within ±2%", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 101);
    expect(result.trend).toBe("almost-equal");
    expect(result.Icon).toBe(EqualIcon);
    expect(result.showWarning).toBe(false);
  });

  it("returns almost-equal when before equals after", () => {
    expect.hasAssertions();
    const result = computeTrend(42, 42);
    expect(result.trend).toBe("almost-equal");
    expect(result.Icon).toBe(EqualIcon);
    expect(result.showWarning).toBe(false);
  });

  it("returns increased-a-bit when change is between 2% and 10%", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 105);
    expect(result.trend).toBe("increased-a-bit");
    expect(result.Icon).toBe(TrendingUp);
    expect(result.showWarning).toBe(false);
  });

  it("returns increased-a-lot when change is >= 10%", () => {
    expect.hasAssertions();
    const result = computeTrend(10, 42);
    expect(result.trend).toBe("increased-a-lot");
    expect(result.Icon).toBe(TrendingUp);
    expect(result.showWarning).toBe(true);
  });

  it("returns decreased-to-zero when before is positive and after is zero", () => {
    expect.hasAssertions();
    const result = computeTrend(42, 0);
    expect(result.trend).toBe("decreased-to-zero");
    expect(result.Icon).toBe(ArrowDownToDot);
    expect(result.showWarning).toBe(true);
  });

  it("sets showWarning to true when change is exactly 20%", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 120);
    expect(result.showWarning).toBe(true);
  });

  it("sets showWarning to false when change is below 20%", () => {
    expect.hasAssertions();
    const result = computeTrend(100, 119);
    expect(result.showWarning).toBe(false);
  });
});
