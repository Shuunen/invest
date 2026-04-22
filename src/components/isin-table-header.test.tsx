import { render, screen } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { renderSearchFilter, renderPageHeader } from "./isin-table-header.tsx";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU1234567890",
    name: "Test ETF",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    provider: "Test",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

describe("renderPageHeader", () => {
  it("shows asset count", () => {
    render(renderPageHeader([makeAsset(), makeAsset({ isin: "FR0000000001" })]));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows avg score", () => {
    const asset = makeAsset({ fees: 0, performance3y: 10, riskReward3y: 2 });
    render(renderPageHeader([asset]));
    // score = 10 + 2*5 - 0*10 = 20
    expect(screen.getByText("20.00")).toBeInTheDocument();
  });

  it("shows — for avg score when no scores defined", () => {
    render(renderPageHeader([makeAsset({ performance3y: undefined, riskReward3y: undefined })]));
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows top performer ticker", () => {
    const assets = [
      makeAsset({ fees: 0, performance3y: 5, riskReward3y: 0, tickers: ["LOW"] }),
      makeAsset({ fees: 0, isin: "FR0000000001", performance3y: 20, riskReward3y: 0, tickers: ["HIGH"] }),
    ];
    render(renderPageHeader(assets));
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("falls back to ISIN when tickers is empty", () => {
    const asset = makeAsset({ fees: 0, performance3y: 10, riskReward3y: 0, tickers: [] });
    render(renderPageHeader([asset]));
    expect(screen.getByText(asset.isin)).toBeInTheDocument();
  });

  it("shows accumulating count", () => {
    const assets = [makeAsset({ isAccumulating: true }), makeAsset({ isAccumulating: false, isin: "FR0000000001" })];
    render(renderPageHeader(assets));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("hides top performer section when no scored assets", () => {
    render(renderPageHeader([makeAsset({ performance3y: undefined, riskReward3y: undefined })]));
    expect(screen.queryByText("Top Performer")).not.toBeInTheDocument();
  });
});

function noop() {
  // intentionally empty — renderFilter callbacks are not under test here
}

describe("renderFilter", () => {
  it("renders search input with placeholder", () => {
    render(renderSearchFilter("", noop));
    expect(screen.getByPlaceholderText("Search ISIN, name, tickers…")).toBeInTheDocument();
  });

  it("reflects current filter value", () => {
    render(renderSearchFilter("IWDA", noop));
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.value).toBe("IWDA");
  });
});
