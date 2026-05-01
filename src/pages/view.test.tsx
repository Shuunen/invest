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
    fees: 0.2,
    geoAllocation: { US: 0.6 },
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
    sectorAllocation: { Technology: 0.4 },
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
    expect(screen.getByTestId("isin-display")).toBeInTheDocument();
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

  it("back button calls history.back", () => {
    expect.hasAssertions();
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
    expect(screen.getByTestId("broker-badge")).toHaveTextContent("No");
    expect(screen.getByTestId("plan-badge")).toHaveTextContent("No");
  });

  it("renders em dash for empty geoAllocation and sectorAllocation", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: {}, sectorAllocation: {} });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-text")).toHaveTextContent("—");
    expect(screen.getByTestId("sector-allocation-text")).toHaveTextContent("—");
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

  it("renders sorted allocation entries", () => {
    expect.hasAssertions();
    const asset = makeAsset({ geoAllocation: { EU: 0.3, US: 0.6 } });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByTestId("geo-allocation-text")).toHaveTextContent(/US.*EU/);
  });
});
