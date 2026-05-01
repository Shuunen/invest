import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { AssetEditPage } from "./edit.tsx";

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
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders form after store loads asynchronously", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetEditPage isin={asset.isin} />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    await waitFor(() => {
      expect(screen.getByTestId("name")).toBeInTheDocument();
    });
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
    expect(screen.getByTestId("name")).toBeInTheDocument();
    expect(screen.getByTestId("provider")).toBeInTheDocument();
    expect(screen.getByTestId("tickers")).toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("save-button"));
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
    const nameInput = screen.getByTestId("name");
    fireEvent.change(nameInput, { target: { value: "Renamed ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
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
    fireEvent.click(screen.getByTestId("cancel-button"));
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
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "-1" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByTestId("save-button"));
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
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "0.3" } });
    fireEvent.change(screen.getByTestId("price"), { target: { value: "110" } });
    fireEvent.change(screen.getByTestId("performance-1-y"), { target: { value: "11" } });
    fireEvent.change(screen.getByTestId("performance-3-y"), { target: { value: "31" } });
    fireEvent.change(screen.getByTestId("performance-5-y"), { target: { value: "51" } });
    fireEvent.change(screen.getByTestId("risk-reward-5-y"), { target: { value: "1.7" } });
    fireEvent.change(screen.getByTestId("risk-reward-1-y"), { target: { value: "1.6" } });
    fireEvent.change(screen.getByTestId("risk-reward-3-y"), { target: { value: "1.9" } });
    fireEvent.change(screen.getByTestId("is-accumulating"), { target: { checked: false } });
    fireEvent.change(screen.getByTestId("available-on-broker"), { target: { checked: false } });
    fireEvent.change(screen.getByTestId("available-for-plan"), { target: { checked: true } });
    fireEvent.change(screen.getByTestId("json-textarea-sector-allocation"), { target: { value: '{"Tech": 0.5}' } });
    fireEvent.change(screen.getByTestId("provider"), { target: { value: "New Provider" } });
    fireEvent.change(screen.getByTestId("tickers"), { target: { value: "TST, ABC" } });
    expect(screen.getByTestId("fees")).toHaveValue(0.3);
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
    fireEvent.click(screen.getByTestId("is-accumulating"));
    fireEvent.click(screen.getByTestId("available-on-broker"));
    fireEvent.click(screen.getByTestId("available-for-plan"));
    expect(screen.getByTestId("is-accumulating")).toBeChecked();
    expect(screen.getByTestId("available-on-broker")).toBeChecked();
    expect(screen.getByTestId("available-for-plan")).toBeChecked();
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
    fireEvent.change(screen.getByTestId("name"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("name-error")).toBeInTheDocument();
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
    const geoTextarea = screen.getByTestId("json-textarea-geo-allocation");
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
    const geoTextarea = screen.getByTestId("json-textarea-geo-allocation");
    fireEvent.change(geoTextarea, { target: { value: "not json" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
    expect(useAppStore.getState().data.assets[0]?.geoAllocation).toStrictEqual({});
  });
});
