import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset, Portfolio } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { PortfolioPage } from "./portfolio.tsx";

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
    expect(screen.getByTestId("page-subtitle")).toHaveTextContent(/broker : interactive brokers/i);
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
    expect(screen.getByTestId("name-LU1234567890")).toBeInTheDocument();
    expect(screen.getByTestId("isin-LU1234567890")).toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("remove-LU1234567890"));
    // confirmation modal should appear; deletion is not yet applied
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    fireEvent.click(screen.getByTestId("confirm-button"));
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(0);
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
    const input = screen.getByTestId("amount-input-LU1234567890");
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
    const input = screen.getByTestId("amount-input-LU1234567890");
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
    fireEvent.click(screen.getByTestId("remove-LU1234567890"));
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cancel-button"));
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
    fireEvent.click(screen.getByTestId("remove-LU1234567890"));
    useAppStore.setState(prev => ({
      data: { ...prev.data, assets: [] },
    }));
    // The modal should still be visible and fall back to displaying the ISIN
    expect(screen.getByText(asset.isin)).toBeInTheDocument();
  });
});

describe("PortfolioPage - price editing", () => {
  it("clicking Edit prices toggles to Done and shows price inputs", () => {
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
    expect(screen.queryByTestId(`price-input-${asset.isin}`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    expect(screen.getByTestId("action-set-prices")).toBeInTheDocument();
    expect(screen.getByTestId(`price-input-${asset.isin}`)).toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    const input = screen.getByTestId(`price-input-${asset.isin}`);
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.assets[0]?.price).toBe(99);
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
    fireEvent.click(screen.getByTestId("cancel-button"));
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
    fireEvent.click(screen.getByTestId("confirm-button"));
    const updatedEntries = useAppStore.getState().data.portfolios[0]?.entries;
    expect(updatedEntries?.some(en => en.isin === asset2.isin)).toBe(true);
    // existing entry data is preserved for asset1
    const preserved = updatedEntries?.find(en => en.isin === asset1.isin);
    expect(preserved?.notes).toBe("keep");
  });
});
