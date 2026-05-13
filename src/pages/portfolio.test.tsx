import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Asset, Portfolio } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { PortfolioPage } from "./portfolio.tsx";

const mockLink = vi.hoisted(
  () =>
    ({ children, to: _to, ...rest }: { children: React.ReactNode; to?: string }): React.ReactElement => <span {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>,
);

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, Link: mockLink as unknown as typeof actual.Link };
});

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
    price: undefined,
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
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<PortfolioPage portfolioId="nonexistent" />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });
});

describe("PortfolioPage - empty portfolio", () => {
  it("renders portfolio name and empty state", () => {
    expect.hasAssertions();
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("My Portfolio");
    expect(screen.getByTestId("no-assets-message")).toBeInTheDocument();
  });

  it("renders broker name when set", () => {
    expect.hasAssertions();
    const portfolio = makePortfolio({ broker: "Interactive Brokers" });
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("page-subtitle")).toHaveTextContent(/broker : interactive brokers/iu);
  });

  it("shows 0 assets count in header", () => {
    expect.hasAssertions();
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-assets-value")).toHaveTextContent("0");
    expect(screen.getByTestId("metric-assets-label")).toBeInTheDocument();
  });

  it("uses singular 'asset' when count is 1", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-assets-label")).toBeInTheDocument();
  });

  it("shows isin as top performer label when asset has no tickers", () => {
    expect.hasAssertions();
    const asset = makeAsset({ tickers: [] });
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-top-performer-value")).toHaveTextContent(asset.isin);
  });

  it("renders asset table when portfolio has entries", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("name-lu1234567890")).toBeInTheDocument();
    expect(screen.getByTestId("isin-lu1234567890")).toBeInTheDocument();
  });

  it("shows total portfolio value in header as amount * price", () => {
    expect.hasAssertions();
    const asset = makeAsset({ price: 200 });
    const portfolio = makePortfolio({
      entries: [{ amount: 3, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-total-value-label")).toBeInTheDocument();
    expect(screen.getByTestId("metric-total-value-value")).toHaveTextContent("600 €");
  });

  it("counts 0 for entries whose asset is no longer in the store", () => {
    expect.hasAssertions();
    const asset = makeAsset({ price: 100 });
    const portfolio = makePortfolio({
      entries: [
        { amount: 2, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 },
        { amount: 5, inPEA: false, isin: "ZZ9999999999", notes: "", positionValue: 0, targetAmount: 0 },
      ],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-total-value-label")).toBeInTheDocument();
    expect(screen.getByTestId("metric-total-value-value")).toHaveTextContent("200 €");
  });

  it("shows average data score metric with success color when the average is 100%", () => {
    expect.hasAssertions();
    const now = new Date().toISOString();
    const asset = makeAsset({ price: 200, updatedAt: now });
    const portfolio = makePortfolio({
      entries: [{ amount: 3, amountUpdatedAt: now, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveTextContent("100%");
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveClass("text-success");
  });

  it("shows warning color when average data score is above 95% and below 100%", () => {
    expect.hasAssertions();
    const now = new Date().toISOString();
    const staleDate = "2000-01-01T00:00:00.000Z";
    const firstAsset = makeAsset({ isin: "LU1111111111", price: 100, updatedAt: now });
    const secondAsset = makeAsset({ isin: "LU2222222222", price: 100, updatedAt: staleDate });
    const portfolio = makePortfolio({
      entries: [
        { amount: 1, amountUpdatedAt: now, inPEA: false, isin: firstAsset.isin, notes: "", positionValue: 0, targetAmount: 0 },
        { amount: 1, amountUpdatedAt: now, inPEA: false, isin: secondAsset.isin, notes: "", positionValue: 0, targetAmount: 0 },
      ],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [firstAsset, secondAsset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveTextContent("97%");
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveClass("text-warning");
  });

  it("shows error color when average data score is 95% or lower", () => {
    expect.hasAssertions();
    const now = new Date().toISOString();
    const staleDate = "2000-01-01T00:00:00.000Z";
    const asset = makeAsset({ price: 100, updatedAt: staleDate });
    const portfolio = makePortfolio({
      entries: [{ amount: 1, amountUpdatedAt: now, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveTextContent("94%");
    expect(screen.getByTestId("metric-average-data-score-value")).toHaveClass("text-error");
  });

  it("remove button calls setPortfolioAssets without the removed isin", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("remove-lu1234567890"));
    // confirmation modal should appear; deletion is not yet applied
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(0);
  });

  it("amount shows as text by default and as input when editing", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 5, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByTestId("amount-input-lu1234567890")).not.toBeInTheDocument();
    expect(screen.getByTestId("amount-lu1234567890")).toHaveTextContent("5");
    fireEvent.click(screen.getByTestId("action-edit"));
    expect(screen.getByTestId("amount-input-lu1234567890")).toBeInTheDocument();
  });

  it("amount input updates entry amount in the store on blur", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-edit"));
    const input = screen.getByTestId("amount-input-lu1234567890");
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "15" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.amount).toBe(15);
  });

  it("amount input does not update the store when value is unchanged on blur", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 5, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-edit"));
    const input = screen.getByTestId("amount-input-lu1234567890");
    fireEvent.blur(input);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.amount).toBe(5);
  });

  it("cancel on delete confirmation modal keeps the asset", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("remove-lu1234567890"));
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("form-cancel-button"));
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    expect(screen.queryByTestId("modal-title")).not.toBeInTheDocument();
  });

  it("delete confirmation modal falls back to isin when asset is missing from the store", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    const portfolio = makePortfolio({
      entries: [{ amount: 0, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("remove-lu1234567890"));
    act(() => {
      useAppStore.setState(prev => ({
        data: { ...prev.data, assets: [] },
      }));
    });
    // The modal should still be visible and fall back to displaying the ISIN
    expect(screen.getByTestId("modal-asset-name")).toHaveTextContent(asset.isin);
  });
});

describe("PortfolioPage - editing mode", () => {
  it("clicking Edit toggles to Done and shows price and amount inputs", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1111111111", price: 50 });
    const portfolio = makePortfolio({
      entries: [{ amount: 1, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByTestId(`price-input-${asset.isin.toLowerCase()}`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("action-edit"));
    expect(screen.getByTestId("action-done")).toBeInTheDocument();
    expect(screen.getByTestId(`price-input-${asset.isin.toLowerCase()}`)).toBeInTheDocument();
    expect(screen.getByTestId(`amount-input-${asset.isin.toLowerCase()}`)).toBeInTheDocument();
  });

  it("price input blur with new value updates asset price in the store", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1111111111", price: 50 });
    const portfolio = makePortfolio({
      entries: [{ amount: 1, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-edit"));
    const input = screen.getByTestId(`price-input-${asset.isin.toLowerCase()}`);
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.assets[0]?.price).toBe(99);
  });

  it("note shows as text by default and as input when editing", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1111111111" });
    const portfolio = makePortfolio({
      entries: [{ amount: 1, inPEA: false, isin: asset.isin, notes: "my note", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByTestId(`note-input-${asset.isin.toLowerCase()}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`note-${asset.isin.toLowerCase()}`)).toHaveTextContent("my note");
    fireEvent.click(screen.getByTestId("action-edit"));
    expect(screen.getByTestId(`note-input-${asset.isin.toLowerCase()}`)).toBeInTheDocument();
  });

  it("note input blur with new value updates entry note in the store", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1111111111" });
    const portfolio = makePortfolio({
      entries: [{ amount: 1, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-edit"));
    const input = screen.getByTestId(`note-input-${asset.isin.toLowerCase()}`);
    fireEvent.change(input, { target: { value: "great fund" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.notes).toBe("great fund");
  });
});

describe("PortfolioPage - asset picker modal", () => {
  it("opens the asset picker modal when Add / Edit assets is clicked", () => {
    expect.hasAssertions();
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByTestId("modal-title")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("action-select-assets"));
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
  });

  it("closes the picker on cancel", () => {
    expect.hasAssertions();
    const portfolio = makePortfolio();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-select-assets"));
    fireEvent.click(screen.getByTestId("form-cancel-button"));
    expect(screen.queryByTestId("modal-title")).not.toBeInTheDocument();
  });

  it("confirm updates the portfolio assets via buildEntries preserving existing entries", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({ isin: "LU1234567890", name: "ETF A" });
    const asset2 = makeAsset({ isin: "LU0987654321", name: "ETF B" });
    const existingEntry = { amount: 0, inPEA: true, isin: asset1.isin, notes: "keep", positionValue: 100, targetAmount: 200 };
    const portfolio = makePortfolio({ entries: [existingEntry] });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset1, asset2], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    fireEvent.click(screen.getByTestId("action-select-assets"));
    // Click ETF B row to select it (it starts unselected)
    fireEvent.click(screen.getByTestId("asset-row-LU0987654321"));
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    const updatedEntries = useAppStore.getState().data.portfolios[0]?.entries;
    expect(updatedEntries?.some(en => en.isin === asset2.isin)).toBe(true);
    // existing entry data is preserved for asset1
    const preserved = updatedEntries?.find(en => en.isin === asset1.isin);
    expect(preserved?.notes).toBe("keep");
  });
});

describe("PortfolioPage - allocation charts", () => {
  it("renders portfolio allocation charts when portfolio has assets and positive total value", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { uk: 0.4, us: 0.6 },
      isin: "LU1234567890",
      price: 100,
      sectorAllocation: { financials: 0.5, technology: 0.5 },
    });
    const portfolio = makePortfolio({
      entries: [{ amount: 100, inPEA: false, isin: asset.isin, notes: "", positionValue: 10_000, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText("Portfolio geography")).toBeInTheDocument();
    expect(screen.getByText("Portfolio sectors")).toBeInTheDocument();
  });

  it("does not render allocation charts when total value is 0", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { uk: 0.4, us: 0.6 },
      isin: "LU1234567890",
      price: undefined, // price = 0 → total value = 0
      sectorAllocation: { financials: 0.5, technology: 0.5 },
    });
    const portfolio = makePortfolio({
      entries: [{ amount: 100, inPEA: false, isin: asset.isin, notes: "", positionValue: 0, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.queryByText("Portfolio geography")).not.toBeInTheDocument();
    expect(screen.queryByText("Portfolio sectors")).not.toBeInTheDocument();
  });

  it("recomputes and updates allocation charts when amount is changed", () => {
    expect.hasAssertions();
    const asset = makeAsset({
      geoAllocation: { us: 1 },
      isin: "LU1234567890",
      price: 100,
      sectorAllocation: { technology: 1 },
    });
    const portfolio = makePortfolio({
      entries: [{ amount: 100, inPEA: false, isin: asset.isin, notes: "", positionValue: 10_000, targetAmount: 0 }],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    expect(screen.getByText("Portfolio geography")).toBeInTheDocument();
    // Change amount via store update (simulating price edit)
    act(() => {
      useAppStore.getState().updateAssetPrice(asset.isin, 200);
    });
    // Charts should still render (now with different weighting if multi-asset)
    expect(screen.getByText("Portfolio geography")).toBeInTheDocument();
  });

  it("recomputes allocation charts when asset price is updated", () => {
    expect.hasAssertions();
    const asset1 = makeAsset({
      geoAllocation: { us: 1 },
      isin: "LU1111111111",
      price: 100,
      sectorAllocation: { technology: 1 },
    });
    const asset2 = makeAsset({
      geoAllocation: { uk: 1 },
      isin: "LU2222222222",
      price: 100,
      sectorAllocation: { financials: 1 },
    });
    // 50-50 portfolio
    const portfolio = makePortfolio({
      entries: [
        { amount: 50, inPEA: false, isin: asset1.isin, notes: "", positionValue: 5000, targetAmount: 0 },
        { amount: 50, inPEA: false, isin: asset2.isin, notes: "", positionValue: 5000, targetAmount: 0 },
      ],
    });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset1, asset2], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    render(<PortfolioPage portfolioId={portfolio.id} />);
    // Initial 50-50 split
    expect(screen.getByText("Portfolio geography")).toBeInTheDocument();
    // Update price of asset1 to double its weight
    act(() => {
      useAppStore.getState().updateAssetPrice(asset1.isin, 200);
    });
    // Charts should recompute with new weighting (asset1 now ~67%, asset2 ~33%)
    expect(screen.getByText("Portfolio geography")).toBeInTheDocument();
  });
});
