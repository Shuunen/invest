import { fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import type { Asset, Portfolio } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { PortfolioPage } from "./portfolio-page.tsx";

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
    provider: "Test",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    broker: "Test Broker",
    entries: [],
    id: "00000000-0000-4000-8000-000000000001",
    name: "My Portfolio",
    ...overrides,
  };
}

describe("PortfolioPage - not found", () => {
  it("renders not found message when portfolio id does not exist", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<PortfolioPage portfolioId="nonexistent" />);
    expect(screen.getByText(/portfolio not found/i)).toBeInTheDocument();
  });
});

describe("PortfolioPage - empty portfolio", () => {
  it("renders portfolio name and empty state", () => {
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("My Portfolio");
    expect(screen.getByText(/no assets yet/i)).toBeInTheDocument();
  });

  it("renders broker name when set", () => {
    const portfolio = makePortfolio({ broker: "Interactive Brokers" });
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText(/broker: interactive brokers/i)).toBeInTheDocument();
  });

  it("does not render broker line when broker is empty", () => {
    const portfolio = makePortfolio({ broker: "" });
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByText(/broker:/i)).not.toBeInTheDocument();
  });

  it("shows 0 assets count in header", () => {
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText(/0 assets/i)).toBeInTheDocument();
  });

  it("uses singular 'asset' when count is 1", () => {
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText(/^1 asset$/i)).toBeInTheDocument();
  });
});

describe("PortfolioPage - with assets", () => {
  it("renders asset table when portfolio has entries", () => {
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText("Test ETF")).toBeInTheDocument();
    expect(screen.getByText("LU1234567890")).toBeInTheDocument();
  });

  it("remove button calls setPortfolioAssets without the removed isin", () => {
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByRole("button", { name: /remove test etf/i }));
    // confirmation modal should appear; deletion is not yet applied
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /^remove$/i }));
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(0);
  });

  it("cancel on delete confirmation modal keeps the asset", () => {
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByRole("button", { name: /remove test etf/i }));
    expect(screen.getByRole("heading", { hidden: true, name: /remove asset/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /cancel/i }));
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    expect(screen.queryByRole("heading", { hidden: true, name: /remove asset/i })).not.toBeInTheDocument();
  });

  it("delete confirmation modal falls back to isin when asset is missing from the store", () => {
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByRole("button", { name: /remove test etf/i }));
    // Remove the asset from the store while the modal is open
    useAppStore.setState(prev => ({
      data: { ...prev.data, assets: [] },
    }));
    // The modal should still be visible and fall back to displaying the ISIN
    expect(screen.getByText(asset.isin)).toBeInTheDocument();
  });
});

describe("PortfolioPage - asset picker modal", () => {
  it("opens the asset picker modal when Add / Edit assets is clicked", () => {
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByRole("heading", { hidden: true, name: /select assets/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /edit assets/i }));
    expect(screen.getByRole("heading", { hidden: true, name: /select assets/i })).toBeInTheDocument();
  });

  it("closes the picker on cancel", () => {
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByRole("button", { name: /edit assets/i }));
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /cancel/i }));
    expect(screen.queryByRole("heading", { hidden: true, name: /select assets/i })).not.toBeInTheDocument();
  });

  it("confirm updates the portfolio assets via buildEntries preserving existing entries", () => {
    const asset1 = makeAsset({ isin: "LU1234567890", name: "ETF A" });
    const asset2 = makeAsset({ isin: "LU0987654321", name: "ETF B" });
    const existingEntry = { inPEA: true, isin: asset1.isin, notes: "keep", positionValue: 100, targetAmount: 200 };
    const portfolio = makePortfolio({ entries: [existingEntry] });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset1, asset2], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByRole("button", { name: /edit assets/i }));
    // Click ETF B row to select it (it starts unselected)
    const etfBRow = screen.getByText("ETF B").closest("tr");
    invariant(etfBRow, "Expected ETF B row to exist");
    fireEvent.click(etfBRow);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /confirm/i }));
    const updatedEntries = useAppStore.getState().data.portfolios[0]?.entries;
    expect(updatedEntries?.some(en => en.isin === asset2.isin)).toBe(true);
    // existing entry data is preserved for asset1
    const preserved = updatedEntries?.find(en => en.isin === asset1.isin);
    expect(preserved?.notes).toBe("keep");
  });
});
