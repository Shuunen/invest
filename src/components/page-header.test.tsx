import { render, screen } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { PageHeader } from "./page-header.tsx";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU1234567890",
    name: "Test ETF",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    price: 100,
    provider: "Test",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

describe("PageHeader", () => {
  it("uses custom metrics only when replaceDefaultMetrics is true", () => {
    expect.hasAssertions();
    render(<PageHeader assets={[makeAsset()]} title="Portfolio" subtitle="Broker : Test" replaceDefaultMetrics metrics={[{ color: "info", label: "Custom", value: "42" }]} />);

    expect(screen.getByTestId("metric-custom-value")).toHaveTextContent("42");
    expect(screen.queryByTestId("metric-assets-label")).toBeNull();
  });

  it("renders no metrics when replaceDefaultMetrics is true and no metrics are provided", () => {
    expect.hasAssertions();
    render(<PageHeader assets={[makeAsset()]} title="Portfolio" subtitle="Broker : Test" replaceDefaultMetrics />);

    expect(screen.queryByTestId("metric-assets-label")).toBeNull();
    expect(screen.queryByTestId("metric-avg-score-label")).toBeNull();
  });

  it("appends custom metrics to defaults when replaceDefaultMetrics is false", () => {
    expect.hasAssertions();
    render(<PageHeader assets={[makeAsset()]} title="Portfolio" subtitle="Broker : Test" metrics={[{ color: "info", label: "Custom", value: "42" }]} />);

    expect(screen.getByTestId("metric-assets-label")).toHaveTextContent("Assets");
    expect(screen.getByTestId("metric-custom-value")).toHaveTextContent("42");
  });

  it("falls back to ISIN for top performer when ticker is missing", () => {
    expect.hasAssertions();
    const asset = makeAsset({ tickers: [] });
    render(<PageHeader assets={[asset]} title="Portfolio" subtitle="Broker : Test" />);

    expect(screen.getByTestId("metric-top-performer-value")).toHaveTextContent(asset.isin);
  });

  it("shows default metrics for an empty assets list", () => {
    expect.hasAssertions();
    render(<PageHeader assets={[]} title="Portfolio" subtitle="Broker : Test" />);

    expect(screen.getByTestId("metric-assets-value")).toHaveTextContent("0");
    expect(screen.getByTestId("metric-avg-fee-value")).toHaveTextContent("—");
    expect(screen.getByTestId("metric-top-performer-value")).toHaveTextContent("—");
  });
});
