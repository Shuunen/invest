import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset } from "../../schemas/index.ts";
import { DismissedSimilaritiesSection } from "./dismissed-similarities.tsx";

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
    provider: "Test Provider",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

function renderSection(asset: Asset, allAssets: Asset[], onUnDismiss: (isin: string, matchedIsin: string) => void) {
  render(<DismissedSimilaritiesSection asset={asset} allAssets={allAssets} onUnDismiss={onUnDismiss} />);
}

describe("EditDismissedSimilaritiesSection", () => {
  it("returns nothing when dismissed similarities are empty", () => {
    expect.hasAssertions();
    const asset = makeAsset({ dismissedSimilarities: [] });
    const allAssets = [asset];
    const onUnDismiss = vi.fn<(isin: string, matchedIsin: string) => void>();

    renderSection(asset, allAssets, onUnDismiss);

    expect(screen.queryByTestId("edit-dismissed-similarities-card")).not.toBeInTheDocument();
  });

  it("opens confirm modal and un-dismisses with matching values", () => {
    expect.hasAssertions();
    const matchedIsin = "FR0000000001";
    const asset = makeAsset({ dismissedSimilarities: [matchedIsin] });
    const matched = makeAsset({ isin: matchedIsin, name: "Other Fund" });
    const allAssets = [asset, matched];
    const onUnDismiss = vi.fn<(isin: string, matchedIsin: string) => void>();

    renderSection(asset, allAssets, onUnDismiss);

    fireEvent.click(screen.getByTestId("un-dismiss-similarity-fr0000000001"));
    expect(screen.getByTestId("un-dismiss-confirm-modal")).toHaveTextContent("Other Fund");

    fireEvent.click(screen.getByTestId("form-confirm-button"));
    expect(onUnDismiss).toHaveBeenCalledWith(asset.isin, matchedIsin);
    expect(screen.queryByTestId("un-dismiss-confirm-modal")).not.toBeInTheDocument();
  });

  it("closes modal on cancel and backdrop clicks", () => {
    expect.hasAssertions();
    const matchedIsin = "XX0000000001";
    const asset = makeAsset({ dismissedSimilarities: [matchedIsin] });
    const allAssets = [asset];
    const onUnDismiss = vi.fn<(isin: string, matchedIsin: string) => void>();

    renderSection(asset, allAssets, onUnDismiss);

    fireEvent.click(screen.getByTestId("un-dismiss-similarity-xx0000000001"));
    expect(screen.getByTestId("un-dismiss-confirm-modal")).toHaveTextContent(matchedIsin);

    fireEvent.click(screen.getByTestId("form-cancel-button"));
    expect(screen.queryByTestId("un-dismiss-confirm-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("un-dismiss-similarity-xx0000000001"));
    fireEvent.click(screen.getByTestId("un-dismiss-confirm-backdrop"));
    expect(screen.queryByTestId("un-dismiss-confirm-modal")).not.toBeInTheDocument();
    expect(onUnDismiss).not.toHaveBeenCalled();
  });
});
