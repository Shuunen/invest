import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { AssetEditPage } from "./asset-edit-page.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
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

describe("AssetEditPage - not found", () => {
  it("shows not found message for unknown ISIN", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetEditPage isin="XX0000000000" />);
    expect(screen.getByText(/asset not found/i)).toBeInTheDocument();
  });
});

describe("AssetEditPage - form", () => {
  it("renders form fields with asset data", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    expect(screen.getByDisplayValue("Test ETF")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Provider")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TST")).toBeInTheDocument();
  });

  it("saves valid form and navigates to view page", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
  });

  it("updates asset in store on save", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    const nameInput = screen.getByDisplayValue("Test ETF");
    fireEvent.change(nameInput, { target: { value: "Renamed ETF" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(useAppStore.getState().data.assets[0]?.name).toBe("Renamed ETF");
    });
  });

  it("cancel button navigates back to view page", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
  });

  it("blocks save and shows error when fees is negative, clears error on correction", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByDisplayValue("0.2"), { target: { value: "-1" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    fireEvent.change(screen.getByDisplayValue("-1"), { target: { value: "0.5" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
  });

  it("fires onChange on all form field types", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByDisplayValue("0.2"), { target: { value: "0.3" } });
    fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "110" } });
    fireEvent.change(screen.getByDisplayValue("10"), { target: { value: "11" } });
    fireEvent.change(screen.getByDisplayValue("30"), { target: { value: "31" } });
    fireEvent.change(screen.getByDisplayValue("50"), { target: { value: "51" } });
    fireEvent.change(screen.getByDisplayValue("1.6"), { target: { value: "1.7" } });
    fireEvent.change(screen.getByDisplayValue("1.5"), { target: { value: "1.6" } });
    fireEvent.change(screen.getByDisplayValue("1.8"), { target: { value: "1.9" } });
    fireEvent.change(screen.getByLabelText(/accumulating/i), { target: { checked: false } });
    fireEvent.change(screen.getByLabelText(/available on broker/i), { target: { checked: false } });
    fireEvent.change(screen.getByLabelText(/available for plan/i), { target: { checked: true } });
    fireEvent.change(screen.getByLabelText(/sector allocation/i), { target: { value: '{"Tech": 0.5}' } });
    fireEvent.change(screen.getByDisplayValue("Test Provider"), { target: { value: "New Provider" } });
    fireEvent.change(screen.getByDisplayValue("TST"), { target: { value: "TST, ABC" } });
    expect(screen.getByDisplayValue("0.3")).toBeInTheDocument();
  });

  it("clicking checkboxes calls patch for each flag field", () => {
    expect.hasAssertions();
    const asset = makeAsset({ availableForPlan: false, availableOnBroker: false, isAccumulating: false });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.click(screen.getByLabelText(/accumulating/i));
    fireEvent.click(screen.getByLabelText(/available on broker/i));
    fireEvent.click(screen.getByLabelText(/available for plan/i));
    expect(screen.getByLabelText(/accumulating/i)).toBeChecked();
    expect(screen.getByLabelText(/available on broker/i)).toBeChecked();
    expect(screen.getByLabelText(/available for plan/i)).toBeChecked();
  });

  it("shows name validation error when saving with empty name", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByDisplayValue("Test ETF"), { target: { value: "" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/name/i)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows error in json textarea when geo allocation is invalid json on save attempt", () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    const geoTextarea = screen.getByLabelText(/geographic allocation/i);
    fireEvent.change(geoTextarea, { target: { value: "bad json" } });
    expect(geoTextarea).toBeInTheDocument();
  });

  it("saves successfully with invalid JSON in geo allocation (falls back to empty object)", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    const geoTextarea = screen.getByLabelText(/geographic allocation/i);
    fireEvent.change(geoTextarea, { target: { value: "not json" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
    expect(useAppStore.getState().data.assets[0]?.geoAllocation).toStrictEqual({});
  });
});
