import { fetchStockData } from "./fetch-stock-data.ts";

describe("fetchStockData", () => {
  it("maps stock endpoint response into prefill shape", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn<() => Promise<unknown>>().mockResolvedValue({
          exchange: "NASDAQ",
          lastClosePrice: 415,
          metrics: {
            "1y": { Sharpe: -0.3, TotalReturn: -4.5 },
            "3y": { Sharpe: 0.37, TotalReturn: 37.7 },
            "5y": { Sharpe: 0.34, TotalReturn: 71.4 },
          },
          name: "Microsoft",
          symbol: "MSFT",
        }),
        ok: true,
      }),
    );

    const result = await fetchStockData("MSFT");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8010/stock/MSFT");
    expect(result).toStrictEqual({
      fees: undefined,
      geoAllocation: {},
      isAccumulating: undefined,
      name: "Microsoft",
      performance1y: "-4.5",
      performance3y: "37.7",
      performance5y: "71.4",
      price: "352",
      provider: "NASDAQ",
      riskReward1y: "-0.3",
      riskReward3y: "0.37",
      riskReward5y: "0.34",
      sectorAllocation: {},
      tickers: "MSFT",
    });
  });

  it("throws when stock endpoint returns non-ok status", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      }),
    );

    await expect(fetchStockData("MSFT")).rejects.toThrow("HTTP error 502");
  });

  it("returns undefined performance and sharpe values when missing or NaN", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn<() => Promise<unknown>>().mockResolvedValue({
          metrics: {
            "1y": { Sharpe: Number.NaN, TotalReturn: Number.NaN },
          },
          name: "Unknown",
          symbol: "UNK",
        }),
        ok: true,
      }),
    );

    const result = await fetchStockData("  UNK  ");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8010/stock/UNK");
    expect({
      performance1y: result.performance1y,
      performance3y: result.performance3y,
      performance5y: result.performance5y,
      price: result.price,
      riskReward1y: result.riskReward1y,
      riskReward3y: result.riskReward3y,
      riskReward5y: result.riskReward5y,
    }).toStrictEqual({
      performance1y: undefined,
      performance3y: undefined,
      performance5y: undefined,
      price: undefined,
      riskReward1y: undefined,
      riskReward3y: undefined,
      riskReward5y: undefined,
    });
  });
});
