import { useAppStore, defaultAppData } from "./use-app-store.ts";

describe("useAppStore - initial state and load", () => {
  it("starts with isLoading true and empty data", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const state = useAppStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.data.assets).toHaveLength(0);
    expect(state.loadError).toBeUndefined();
  });

  it("loadData sets data and clears loading/error", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const mockData = { ...defaultAppData };
    useAppStore.getState().loadData(mockData);
    const state = useAppStore.getState();
    expect(state.data).toBe(mockData);
    expect(state.isLoading).toBe(false);
    expect(state.loadError).toBeUndefined();
  });

  it("setLoadError sets loadError and clears isLoading", () => {
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
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    expect(useAppStore.getState().data.settings.sort).toStrictEqual({ column: "fees", direction: "asc" });
  });

  it("setColumnVisibility updates settings.columnVisibility", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnVisibility({ name: false });
    expect(useAppStore.getState().data.settings.columnVisibility).toStrictEqual({ name: false });
  });

  it("setColumnOrder updates settings.columnOrder", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnOrder(["score", "name", "fees"]);
    expect(useAppStore.getState().data.settings.columnOrder).toStrictEqual(["score", "name", "fees"]);
  });

  it("setLastExportedAt updates settings.lastExportedAt", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const ts = "2026-04-23T12:00:00.000Z";
    useAppStore.getState().setLastExportedAt(ts);
    expect(useAppStore.getState().data.settings.lastExportedAt).toBe(ts);
  });

  it("subscribeWithSelector fires subscriber on mutation", () => {
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
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().addPortfolio(basePortfolio);
    expect(useAppStore.getState().data.portfolios).toHaveLength(1);
    expect(useAppStore.getState().data.portfolios[0]?.name).toBe("My Portfolio");
  });

  it("deletePortfolio removes the portfolio by id", () => {
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().deletePortfolio(basePortfolio.id);
    expect(useAppStore.getState().data.portfolios).toHaveLength(0);
  });

  it("updatePortfolio patches name and broker", () => {
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
    const entry = { inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
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
    const other = { ...basePortfolio, id: "00000000-0000-4000-8000-000000000002", name: "Other" };
    const entry = { inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio, other] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().setPortfolioAssets(basePortfolio.id, [entry]);
    expect(useAppStore.getState().data.portfolios[1]?.entries).toHaveLength(0);
  });

  it("updatePortfolio does not affect other portfolios", () => {
    const other = { ...basePortfolio, id: "00000000-0000-4000-8000-000000000002", name: "Other" };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio, other] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updatePortfolio(basePortfolio.id, { name: "Updated" });
    expect(useAppStore.getState().data.portfolios[1]?.name).toBe("Other");
  });
});
