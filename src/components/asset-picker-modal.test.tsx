import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invariant } from "es-toolkit";
import type { Asset } from "../schemas/index.ts";
import { AssetPickerModal } from "./asset-picker-modal.tsx";

const mockLink = vi.hoisted(
  () =>
    ({ children }: { children: React.ReactNode }): React.ReactElement =>
      children as React.ReactElement,
);

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, Link: mockLink as unknown as typeof actual.Link };
});

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
    price: undefined,
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
const ASSET_WITH_ALLOCATION = makeAsset({ geoAllocation: { us: 1 }, sectorAllocation: { technology: 1 } });
const ASSET_WITH_ALLOCATION_LIST = [ASSET_WITH_ALLOCATION];
const ASSET_WITH_ALLOCATION_SELECTED = new Set([ASSET_WITH_ALLOCATION.isin]);
const ASSET_WITH_UNDEFINED_ALLOCATION = makeAsset({
  geoAllocation: { us: undefined as unknown as number },
  sectorAllocation: { technology: undefined as unknown as number },
});
const ASSET_WITH_UNDEFINED_ALLOCATION_LIST = [ASSET_WITH_UNDEFINED_ALLOCATION];
const ASSET_WITH_UNDEFINED_ALLOCATION_SELECTED = new Set([ASSET_WITH_UNDEFINED_ALLOCATION.isin]);

describe("AssetPickerModal - no assets", () => {
  it("shows empty message when assets list is empty", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={NO_ASSETS} initialSelected={new Set<string>()} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    expect(screen.getByTestId("no-assets-message")).toBeInTheDocument();
  });
});

describe("AssetPickerModal - with assets", () => {
  it("renders four allocation preview charts in a single row", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={ASSET_WITH_ALLOCATION_LIST} initialSelected={ASSET_WITH_ALLOCATION_SELECTED} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);

    expect(screen.getByTestId("allocation-preview-row")).toBeInTheDocument();
    expect(screen.getByTestId("before-geo-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("after-geo-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("before-sector-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("after-sector-allocation-chart")).toBeInTheDocument();
  });

  it("keeps before charts and updates after charts when selections change", async () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={ASSET_WITH_ALLOCATION_LIST} initialSelected={ASSET_WITH_ALLOCATION_SELECTED} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);

    expect(screen.getByTestId("before-geo-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("after-geo-allocation-chart")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("asset-row-LU1234567890"));

    await waitFor(() => {
      expect(screen.getByTestId("after-geo-allocation-empty")).toBeInTheDocument();
      expect(screen.getByTestId("after-sector-allocation-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("before-geo-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("before-sector-allocation-chart")).toBeInTheDocument();
  });

  it("ignores undefined allocation values when building projected charts", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={ASSET_WITH_UNDEFINED_ALLOCATION_LIST} initialSelected={ASSET_WITH_UNDEFINED_ALLOCATION_SELECTED} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);

    expect(screen.getByTestId("before-geo-allocation-empty")).toBeInTheDocument();
    expect(screen.getByTestId("after-geo-allocation-empty")).toBeInTheDocument();
  });

  it("renders asset rows", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set<string>()} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    expect(screen.getByTestId("name-lu1234567890")).toBeInTheDocument();
    expect(screen.getByTestId("isin-lu1234567890")).toBeInTheDocument();
  });

  it("pre-checks initially selected assets", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set([BASE_ASSET.isin])} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    expect(screen.getByTestId("select-lu1234567890")).toBeChecked();
  });

  it("shows selected count", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set([BASE_ASSET.isin])} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    expect(screen.getByTestId("selected-count")).toBeInTheDocument();
  });

  it("toggles selection when row is clicked", async () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set<string>()} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    const checkbox = screen.getByTestId("select-lu1234567890");
    expect(checkbox).not.toBeChecked();
    fireEvent.click(screen.getByTestId("asset-row-LU1234567890"));
    await waitFor(() => {
      expect(screen.getByTestId("select-lu1234567890")).toBeChecked();
    });
  });

  it("toggles selection when checkbox is clicked directly", () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set([BASE_ASSET.isin])} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    const checkbox = screen.getByTestId("select-lu1234567890");
    expect(checkbox).toBeChecked();
    // click to uncheck (exercises the delete branch)
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // click again to re-check (exercises the add branch)
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("filters assets by name", async () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={FILTERED_LIST} initialSelected={new Set<string>()} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    await userEvent.type(screen.getByTestId("input-filter"), "global");
    expect(screen.getByTestId("name-lu1234567890")).toBeInTheDocument();
    expect(screen.queryByTestId("name-lu0987654321")).not.toBeInTheDocument();
  });

  it("shows no match message when filter matches nothing", async () => {
    expect.hasAssertions();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set<string>()} onCancel={vi.fn<() => void>()} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    await userEvent.type(screen.getByTestId("input-filter"), "zzznomatch");
    expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    expect.hasAssertions();
    const onCancel = vi.fn<() => void>();
    render(<AssetPickerModal assets={NO_ASSETS} initialSelected={new Set<string>()} onCancel={onCancel} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    await userEvent.click(screen.getByTestId("form-cancel-button"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when X button is clicked", async () => {
    expect.hasAssertions();
    const onCancel = vi.fn<() => void>();
    render(<AssetPickerModal assets={NO_ASSETS} initialSelected={new Set<string>()} onCancel={onCancel} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    await userEvent.click(screen.getByTestId("modal-close-button"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", async () => {
    expect.hasAssertions();
    const onCancel = vi.fn<() => void>();
    const { container } = render(<AssetPickerModal assets={NO_ASSETS} initialSelected={new Set<string>()} onCancel={onCancel} onConfirm={vi.fn<(isins: string[]) => void>()} title="Select assets" />);
    const backdrop = container.querySelector(".modal-backdrop");
    invariant(backdrop, "Expected backdrop element to exist");
    await userEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm with selected isins when Confirm is clicked", async () => {
    expect.hasAssertions();
    const onConfirm = vi.fn<(isins: string[]) => void>();
    render(<AssetPickerModal assets={SINGLE_ASSET_LIST} initialSelected={new Set([BASE_ASSET.isin])} onCancel={vi.fn<() => void>()} onConfirm={onConfirm} title="Select assets" />);
    await userEvent.click(screen.getByTestId("form-confirm-button"));
    expect(onConfirm).toHaveBeenCalledWith([BASE_ASSET.isin]);
  });
});
