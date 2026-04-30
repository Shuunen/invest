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
    expect(screen.getByText(/asset not found/i)).toBeInTheDocument();
  });
});

describe("AssetViewPage - content", () => {
  it("renders asset name and ISIN", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Test ETF");
    expect(screen.getAllByText("LU1234567890").length).toBeGreaterThan(0);
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
    expect(screen.getAllByText("Test Provider").length).toBeGreaterThan(0);
    expect(screen.getByText("TST")).toBeInTheDocument();
  });

  it("renders fees and price in financials section", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetViewPage isin={asset.isin} />);
    expect(screen.getByText(/0\.20 %/)).toBeInTheDocument();
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
    const cells = document.querySelectorAll("td, span, div");
    const dashCells = Array.from(cells).filter(el => el.textContent?.trim() === "—");
    expect(dashCells.length).toBeGreaterThan(0);
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
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin/edit" });
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
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
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
    const noBadges = screen.getAllByText("No");
    expect(noBadges.length).toBeGreaterThan(0);
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
    const dashEls = Array.from(document.querySelectorAll("p")).filter(el => el.textContent?.trim() === "—");
    expect(dashEls.length).toBeGreaterThanOrEqual(2);
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
    const divs = Array.from(document.querySelectorAll("div.flex"));
    const providerRow = divs.find(el => el.textContent?.includes("Provider"));
    const tickersRow = divs.find(el => el.textContent?.includes("Tickers"));
    expect(providerRow?.textContent).toContain("—");
    expect(tickersRow?.textContent).toContain("—");
  });

  it("renders em dash for score when all performance values are undefined", () => {
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
    const scoreSection = document.querySelector(".card-body span.text-3xl");
    expect(scoreSection?.textContent).toBe("—");
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
    const allocationText = screen.getByText(/US.*EU/);
    expect(allocationText).toBeInTheDocument();
  });
});
