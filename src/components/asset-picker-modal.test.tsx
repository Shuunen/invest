import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invariant } from "es-toolkit";
import type { Asset } from "../schemas/index.ts";
import { AssetPickerModal } from "./asset-picker-modal.tsx";

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
    provider: "Vanguard",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

const NO_ASSETS: Asset[] = [];
const BASE_ASSET = makeAsset();
const SINGLE_ASSET_LIST = [BASE_ASSET];
const ASSET_A = makeAsset({ isin: "LU1234567890", name: "Global ETF" });
const ASSET_B = makeAsset({ isin: "LU0987654321", name: "Bond Fund" });
const FILTERED_LIST = [ASSET_A, ASSET_B];

describe("AssetPickerModal - no assets", () => {
  it("shows empty message when assets list is empty", () => {
    render(
      <AssetPickerModal
        assets={NO_ASSETS}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    expect(screen.getByText(/no instruments available/i)).toBeInTheDocument();
  });
});

describe("AssetPickerModal - with assets", () => {
  it("renders asset rows", () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    expect(screen.getByText("Test ETF")).toBeInTheDocument();
    expect(screen.getByText("LU1234567890")).toBeInTheDocument();
  });

  it("pre-checks initially selected assets", () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set([BASE_ASSET.isin])}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    expect(screen.getByRole("checkbox", { hidden: true })).toBeChecked();
  });

  it("shows selected count", () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set([BASE_ASSET.isin])}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
  });

  it("toggles selection when row is clicked", () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { hidden: true });
    expect(checkbox).not.toBeChecked();
    const row = screen.getByText("Test ETF").closest("tr");
    invariant(row, "Expected table row to exist");
    fireEvent.click(row);
    expect(checkbox).toBeChecked();
  });

  it("toggles selection when checkbox is clicked directly", () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { hidden: true });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    // click again to uncheck (exercises the delete branch)
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("filters assets by name", async () => {
    render(
      <AssetPickerModal
        assets={FILTERED_LIST}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    await userEvent.type(screen.getByRole("searchbox", { hidden: true }), "global");
    expect(screen.getByText("Global ETF")).toBeInTheDocument();
    expect(screen.queryByText("Bond Fund")).not.toBeInTheDocument();
  });

  it("shows no match message when filter matches nothing", async () => {
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set<string>()}
        onCancel={vi.fn<() => void>()}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    await userEvent.type(screen.getByRole("searchbox", { hidden: true }), "zzznomatch");
    expect(screen.getByText(/no instruments match/i)).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn<() => void>();
    render(
      <AssetPickerModal
        assets={NO_ASSETS}
        initialSelected={new Set<string>()}
        onCancel={onCancel}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when X button is clicked", () => {
    const onCancel = vi.fn<() => void>();
    render(
      <AssetPickerModal
        assets={NO_ASSETS}
        initialSelected={new Set<string>()}
        onCancel={onCancel}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /close/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn<() => void>();
    const { container } = render(
      <AssetPickerModal
        assets={NO_ASSETS}
        initialSelected={new Set<string>()}
        onCancel={onCancel}
        onConfirm={vi.fn<(isins: string[]) => void>()}
      />,
    );
    const backdrop = container.querySelector(".modal-backdrop");
    invariant(backdrop, "Expected backdrop element to exist");
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm with selected isins when Confirm is clicked", () => {
    const onConfirm = vi.fn<(isins: string[]) => void>();
    render(
      <AssetPickerModal
        assets={SINGLE_ASSET_LIST}
        initialSelected={new Set([BASE_ASSET.isin])}
        onCancel={vi.fn<() => void>()}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith([BASE_ASSET.isin]);
  });
});
