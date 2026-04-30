import { useAppStore, defaultAppData } from "./use-app-store.ts";

describe("useAppStore - initial state and load", () => {
  it("starts with isLoading true and empty data", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const state = useAppStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.data.assets).toHaveLength(0);
    expect(state.loadError).toBeUndefined();
  });

  it("loadData sets data and clears loading/error", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const mockData = { ...defaultAppData };
    useAppStore.getState().loadData(mockData);
    const state = useAppStore.getState();
    expect(state.data).toBe(mockData);
    expect(state.isLoading).toBe(false);
    expect(state.loadError).toBeUndefined();
  });

  it("setLoadError sets loadError and clears isLoading", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const err = new Error("test error");
    useAppStore.getState().setLoadError(err);
    const state = useAppStore.getState();
    expect(state.loadError).toBe(err);
    expect(state.isLoading).toBe(false);
  });
});

describe("useAppStore - settings mutations", () => {
  it("setSort updates settings.sort", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    expect(useAppStore.getState().data.settings.sort).toStrictEqual({ column: "fees", direction: "asc" });
  });

  it("setColumnVisibility updates settings.columnVisibility", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnVisibility({ name: false });
    expect(useAppStore.getState().data.settings.columnVisibility).toStrictEqual({ name: false });
  });

  it("setColumnOrder updates settings.columnOrder", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnOrder(["score", "name", "fees"]);
    expect(useAppStore.getState().data.settings.columnOrder).toStrictEqual(["score", "name", "fees"]);
  });

  it("setLastExportedAt updates settings.lastExportedAt", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const ts = "2026-04-23T12:00:00.000Z";
    useAppStore.getState().setLastExportedAt(ts);
    expect(useAppStore.getState().data.settings.lastExportedAt).toBe(ts);
  });

  it("subscribeWithSelector fires subscriber on mutation", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const received: unknown[] = [];
    const unsub = useAppStore.subscribe(
      state => state.data,
      receivedData => received.push(receivedData),
    );
    useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    unsub();
    expect(received.length).toBeGreaterThan(0);
  });
});

describe("useAppStore - portfolio mutations", () => {
  const basePortfolio = {
    broker: "Test Broker",
    entries: [],
    id: "00000000-0000-4000-8000-000000000001",
    name: "My Portfolio",
  };

  it("addPortfolio appends a portfolio", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().addPortfolio(basePortfolio);
    expect(useAppStore.getState().data.portfolios).toHaveLength(1);
    expect(useAppStore.getState().data.portfolios[0]?.name).toBe("My Portfolio");
  });

  it("addPortfolio ignores the call when MAX_PORTFOLIOS is reached", () => {
    expect.hasAssertions();
    const maxPortfolios = Array.from({ length: 50 }, (_unused, index) => ({
      ...basePortfolio,
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    }));
    useAppStore.setState({ data: { ...defaultAppData, portfolios: maxPortfolios }, isLoading: false, loadError: undefined });
    useAppStore.getState().addPortfolio({ ...basePortfolio, id: "00000000-0000-4000-8000-999999999999" });
    expect(useAppStore.getState().data.portfolios).toHaveLength(50);
  });

  it("deletePortfolio removes the portfolio by id", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().deletePortfolio(basePortfolio.id);
    expect(useAppStore.getState().data.portfolios).toHaveLength(0);
  });

  it("updatePortfolio patches name and broker", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updatePortfolio(basePortfolio.id, { broker: "New Broker", name: "Updated" });
    const [updated] = useAppStore.getState().data.portfolios;
    expect(updated?.name).toBe("Updated");
    expect(updated?.broker).toBe("New Broker");
  });

  it("setPortfolioAssets replaces entries for the given portfolio", () => {
    expect.hasAssertions();
    const entry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().setPortfolioAssets(basePortfolio.id, [entry]);
    expect(useAppStore.getState().data.portfolios[0]?.entries).toHaveLength(1);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.isin).toBe("LU1234567890");
  });

  it("setPortfolioAssets does not affect other portfolios", () => {
    expect.hasAssertions();
    const other = { ...basePortfolio, id: "00000000-0000-4000-8000-000000000002", name: "Other" };
    const entry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio, other] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().setPortfolioAssets(basePortfolio.id, [entry]);
    expect(useAppStore.getState().data.portfolios[1]?.entries).toHaveLength(0);
  });

  it("updatePortfolio does not affect other portfolios", () => {
    expect.hasAssertions();
    const other = { ...basePortfolio, id: "00000000-0000-4000-8000-000000000002", name: "Other" };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio, other] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updatePortfolio(basePortfolio.id, { name: "Updated" });
    expect(useAppStore.getState().data.portfolios[1]?.name).toBe("Other");
  });

  it("updatePortfolioEntryAmount updates the shares for the given entry", () => {
    expect.hasAssertions();
    const entry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    const portfolio = { ...basePortfolio, entries: [entry] };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updatePortfolioEntryAmount(portfolio.id, "LU1234567890", 42);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.amount).toBe(42);
  });

  it("updatePortfolioEntryAmount does not affect other entries or portfolios", () => {
    expect.hasAssertions();
    const entry1 = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    const entry2 = { amount: 5, inPEA: false, isin: "LU0987654321", notes: "", positionValue: 0, targetAmount: 0 };
    const other = { ...basePortfolio, entries: [entry2], id: "00000000-0000-4000-8000-000000000002" };
    const portfolio = { ...basePortfolio, entries: [entry1, entry2] };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio, other] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updatePortfolioEntryAmount(portfolio.id, "LU1234567890", 10);
    expect(useAppStore.getState().data.portfolios[0]?.entries[1]?.amount).toBe(5);
    expect(useAppStore.getState().data.portfolios[1]?.entries[0]?.amount).toBe(5);
  });
});
