import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { AssetViewPage } from "./view.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    availableForPlan: true,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.2,
    geoAllocation: { us: 0.6 },
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
    sectorAllocation: { technology: 0.4 },
    tickers: ["TST"],
    ...overrides,
  };
}

describe("AssetViewPage - not found", () => {
  it("shows not found message for unknown ISIN", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetViewPage isin="XX0000000000" />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders asset name and ISIN", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("asset-name")).toHaveTextContent("Test ETF");
    expect(screen.getByTestId("field-row-isin")).toBeInTheDocument();
  });

  it("renders provider and tickers", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("field-row-provider")).toBeInTheDocument();
    expect(screen.getByTestId("field-row-tickers")).toBeInTheDocument();
  });

  it("renders fees and price in financial section", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("field-row-fees")).toHaveTextContent("0.20 %");
  });

  it("renders em dash for undefined price", () => {
    expect.hasAssertions();
    const asset = makeAsset({ price: undefined });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("field-row-price")).toHaveTextContent("—");
  });

  it("edit button navigates to edit page", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    fireEvent.click(screen.getByTestId("edit-button"));
    expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, replace: true, to: "/assets/$isin/edit" });
  });

  it("back button calls history.back when there is prior history", () => {
    expect.hasAssertions();
    Object.defineProperty(globalThis.history, "length", { configurable: true, value: 2, writable: true });
    const spy = vi.spyOn(globalThis.history, "back").mockReturnValue(undefined);
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    fireEvent.click(screen.getByTestId("back-button"));
    expect(spy).toHaveBeenCalledWith();
    Object.defineProperty(globalThis.history, "length", { configurable: true, value: 1, writable: true });
  });

  it("back button navigates home when opened directly with no history", () => {
    expect.hasAssertions();
    Object.defineProperty(globalThis.history, "length", { configurable: true, value: 1, writable: true });
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    fireEvent.click(screen.getByTestId("back-button"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("renders boolean badges for false values", () => {
    expect.hasAssertions();
    const asset = makeAsset({ availableForPlan: false, availableOnBroker: false, isAccumulating: false });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("accumulating-badge")).toHaveTextContent("No");
  });

  it("renders empty state for empty geoAllocation and sectorAllocation", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: {}, sectorAllocation: {} });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.queryByTestId("geo-allocation-chart")).not.toBeInTheDocument();
    expect(screen.getByTestId("geo-allocation-empty")).toHaveTextContent("No allocation data");
    expect(screen.queryByTestId("sector-allocation-chart")).not.toBeInTheDocument();
    expect(screen.getByTestId("sector-allocation-empty")).toHaveTextContent("No allocation data");
  });

  it("renders em dash for empty provider and empty tickers", () => {
    expect.hasAssertions();
    const asset = makeAsset({ provider: "", tickers: [] });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("field-row-provider")).toHaveTextContent("—");
    expect(screen.getByTestId("field-row-tickers")).toHaveTextContent("—");
  });

  it("renders em dash for performance and risk/reward when all values are undefined", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      performance1y: undefined,
      performance3y: undefined,
      performance5y: undefined,
      riskReward1y: undefined,
      riskReward3y: undefined,
      riskReward5y: undefined,
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("field-row-performance-1-y")).toHaveTextContent("—");
    expect(screen.getByTestId("field-row-risk-reward-1-y")).toHaveTextContent("—");
  });

  it("shows empty state when all allocation values are zero", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { eu: 0, us: 0 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.queryByTestId("geo-allocation-chart")).not.toBeInTheDocument();
    expect(screen.getByTestId("geo-allocation-empty")).toBeInTheDocument();
  });

  it("renders geo-allocation-chart for non-empty allocation", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { us: 0.6 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-chart")).toBeInTheDocument();
  });

  it("renders geo-allocation-chart using fallback color for unknown region key", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { unknownRegion: 0.6 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-chart")).toBeInTheDocument();
  });

  it("renders geo-allocation-chart with Other entry when allocation is incomplete", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { us: 0.98 }, sectorAllocation: { financials: 1 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-chart")).toBeInTheDocument();
    expect(screen.getByTestId("slice-other")).toBeInTheDocument();
  });

  it("renders geo-allocation-chart with multiple entries sorted correctly", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { eu: 0.3, us: 0.5 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-chart")).toBeInTheDocument();
  });
});

describe("AssetViewPage - dismissed similarities", () => {
  it("does not show dismissed similarities card when list is empty", () => {
    expect.hasAssertions();
    const asset = makeAsset({ dismissedSimilarities: [] });
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.queryByTestId("dismissed-similarities-card")).not.toBeInTheDocument();
  });

  it("shows dismissed similarities card with matched asset name when list is non-empty", () => {
    expect.hasAssertions();
    const otherIsin = "FR0000000001";
    const other = makeAsset({ isin: otherIsin, name: "Other Fund" });
    const asset = makeAsset({ dismissedSimilarities: [otherIsin] });
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset, other] }, isLoading: false, loadError: undefined });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("dismissed-similarities-card")).toHaveTextContent("Other Fund");
  });

  it("shows ISIN as fallback when matched asset is not found", () => {
    expect.hasAssertions();
    const unknownIsin = "XX0000000001";
    const asset = makeAsset({ dismissedSimilarities: [unknownIsin] });
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("dismissed-similarities-card")).toHaveTextContent(unknownIsin);
  });
});
