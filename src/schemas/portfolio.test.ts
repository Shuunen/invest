import { PortfolioEntrySchema, PortfolioSchema } from "./portfolio.ts";

describe("PortfolioEntrySchema", () => {
  const validEntry = {
    isin: "IE00B4L5Y983",
    targetAmount: 500,
  };

  it("rejects an empty isin", () => {
    expect.hasAssertions();
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, isin: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect.hasAssertions();
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, amount: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative targetAmount", () => {
    expect.hasAssertions();
    const result = PortfolioEntrySchema.safeParse({ ...validEntry, targetAmount: -50 });
    expect(result.success).toBe(false);
  });

  it("defaults inPEA to false and notes to empty string", () => {
    expect.hasAssertions();
    const result = PortfolioEntrySchema.parse(validEntry);
    expect(result.inPEA).toBe(false);
    expect(result.notes).toBe("");
  });
});

describe("PortfolioSchema", () => {
  const validPortfolio = {
    broker: "Trading 212",
    id: "87b67f15-e6f2-480b-8388-5440cc1c7423",
    name: "My Portfolio",
  };

  it("rejects an invalid UUID", () => {
    expect.hasAssertions();
    const result = PortfolioSchema.safeParse({ ...validPortfolio, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect.hasAssertions();
    const result = PortfolioSchema.safeParse({ ...validPortfolio, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty broker", () => {
    expect.hasAssertions();
    const result = PortfolioSchema.safeParse({ ...validPortfolio, broker: "" });
    expect(result.success).toBe(false);
  });

  it("parses a valid portfolio and defaults entries to empty array", () => {
    expect.hasAssertions();
    const result = PortfolioSchema.parse(validPortfolio);
    expect(result.broker).toBe("Trading 212");
    expect(result.entries).toStrictEqual([]);
  });
});
