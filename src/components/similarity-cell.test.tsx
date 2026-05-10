import type { AccessorFnColumnDef } from "@tanstack/react-table";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import type { Asset } from "../schemas/index.ts";
import { computeMaxSimilarity } from "../utils/asset-similarity.ts";
import { makeSimilarityColumn } from "./asset-table-columns.tsx";
import { SimilarityCell } from "./similarity-cell.tsx";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: false,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU0000000001",
    name: "ETF A",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    price: 100,
    provider: "Provider",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["AAA"],
    ...overrides,
  };
}

function renderSimilarityCell(asset: Asset, assets: Asset[], onDismiss: ((isin: string, matchedIsin: string) => void) | undefined) {
  const result = computeMaxSimilarity(asset, assets, asset.dismissedSimilarities);
  render(<SimilarityCell asset={asset} assets={assets} onDismiss={onDismiss} result={result} />);
}

function renderSimilarityCellWithCustomDisplay(asset: Asset, similarAssets: Asset[], displayAssets: Asset[]) {
  const result = computeMaxSimilarity(asset, similarAssets, asset.dismissedSimilarities);
  render(<SimilarityCell asset={asset} assets={displayAssets} onDismiss={undefined} result={result} />);
}

describe("SimilarityCell", () => {
  it("shows popover without dismiss button when onDismiss is undefined", () => {
    expect.hasAssertions();
    const firstAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const secondAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002", name: "Duplicate ETF" });
    const assets = [firstAsset, secondAsset];

    renderSimilarityCell(firstAsset, assets, undefined);

    const wrapper = screen.getByTestId("similarity-wrapper-lu0000000001");
    fireEvent.mouseEnter(wrapper);

    expect(screen.getByTestId("similarity-popover-lu0000000001")).toHaveTextContent("100% similar to Duplicate ETF");
    expect(screen.queryByTestId("similarity-dismiss-lu0000000001")).not.toBeInTheDocument();
  });

  it("schedules hide on mouse leave and dismiss callback receives both isins", () => {
    expect.hasAssertions();
    vi.useFakeTimers();

    const onDismiss = vi.fn<(isin: string, matchedIsin: string) => void>();
    const firstAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const secondAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002", name: "Duplicate ETF" });
    const assets = [firstAsset, secondAsset];

    renderSimilarityCell(firstAsset, assets, onDismiss);

    const wrapper = screen.getByTestId("similarity-wrapper-lu0000000001");

    fireEvent.mouseEnter(wrapper);
    fireEvent.click(screen.getByTestId("similarity-dismiss-lu0000000001"));
    expect(onDismiss).toHaveBeenCalledWith("LU0000000001", "LU0000000002");

    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(screen.getByTestId("similarity-popover-lu0000000001")).toHaveTextContent("100% similar to Duplicate ETF");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("similarity-popover-lu0000000001")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("falls back to matched ISIN as name when matched asset is not in assets list", () => {
    expect.hasAssertions();
    const firstAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const secondAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002" });
    // Use only firstAsset as display assets so the matched asset (secondAsset) is not found by name
    const allAssets = [firstAsset, secondAsset];
    const displayOnly = [firstAsset];
    renderSimilarityCellWithCustomDisplay(firstAsset, allAssets, displayOnly);

    const wrapper = screen.getByTestId("similarity-wrapper-lu0000000001");
    fireEvent.mouseEnter(wrapper);

    expect(screen.getByTestId("similarity-popover-lu0000000001")).toHaveTextContent("100% similar to LU0000000002");
  });
});

describe("makeSimilarityColumn", () => {
  it("computes similarity score through accessorFn", () => {
    expect.hasAssertions();
    const firstAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000001" });
    const secondAsset = makeAsset({ geoAllocation: { us: 1 }, isin: "LU0000000002" });
    const assets = [firstAsset, secondAsset];
    const column = makeSimilarityColumn(assets, undefined) as AccessorFnColumnDef<Asset, unknown>;
    invariant(column.accessorFn, "Expected similarity accessor function");

    expect(column.accessorFn(firstAsset, 0)).toBe(1);
  });
});
