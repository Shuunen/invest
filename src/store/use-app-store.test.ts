import { maxIsins, type Asset } from "../schemas/index.ts";
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

  it("setEditCount updates settings.editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setEditCount(15);
    expect(useAppStore.getState().data.settings.editCount).toBe(15);
  });

  it("setLastExportedAt updates settings.lastExportedAt", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const ts = "2026-04-23T12:00:00.000Z";
    useAppStore.getState().setLastExportedAt(ts);
    expect(useAppStore.getState().data.settings.lastExportedAt).toBe(ts);
  });

  it("setLastExportedAt resets editCount to 0", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, settings: { ...defaultAppData.settings, editCount: 7 } },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().setLastExportedAt(new Date().toISOString());
    expect(useAppStore.getState().data.settings.editCount).toBe(0);
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

function makePortfolioEntry(isin: string) {
  return { amount: 100, amountUpdatedAt: "2024-01-01T00:00:00.000Z", inPEA: false, isin, notes: "", positionValue: 0, targetAmount: 0 };
}

describe("useAppStore - asset mutations", () => {
  const baseAsset: Asset = {
    availableForPlan: false,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU1234567890",
    name: "ETF A",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    price: 100,
    provider: "Provider A",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["A"],
  };

  it("updateAsset updates the matching asset and leaves others unchanged", () => {
    expect.hasAssertions();
    const assetB = { ...baseAsset, isin: "LU0987654321", name: "ETF B" };
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset, assetB] },
      isLoading: false,
      loadError: undefined,
    });
    const updated = { ...baseAsset, name: "Updated ETF A" };
    useAppStore.getState().updateAsset(baseAsset.isin, updated);
    expect(useAppStore.getState().data.assets[0]?.name).toBe("Updated ETF A");
    expect(useAppStore.getState().data.assets[1]?.name).toBe("ETF B");
  });

  it("updateAsset increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updateAsset(baseAsset.isin, baseAsset);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("updateAsset does nothing when ISIN does not exist", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updateAsset("XX0000000000", baseAsset);
    expect(useAppStore.getState().data.assets).toHaveLength(1);
    expect(useAppStore.getState().data.settings.editCount).toBe(before);
  });

  it("updateAsset cascades ISIN rename into portfolio entries", () => {
    expect.hasAssertions();
    const portfolio = {
      broker: "Broker",
      entries: [makePortfolioEntry(baseAsset.isin), makePortfolioEntry("LU0987654321")],
      id: "00000000-0000-4000-8000-000000000001",
      name: "My Portfolio",
    };
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset], portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    const renamed = { ...baseAsset, isin: "LU9999999999" };
    useAppStore.getState().updateAsset(baseAsset.isin, renamed);
    const entries = useAppStore.getState().data.portfolios[0]?.entries;
    expect(entries?.[0]?.isin).toBe("LU9999999999");
    expect(entries?.[1]?.isin).toBe("LU0987654321");
  });

  it("updateAsset cascades ISIN rename into dismissedSimilarities of other assets", () => {
    expect.hasAssertions();
    const assetB = { ...baseAsset, dismissedSimilarities: [baseAsset.isin, "LU_OTHER"], isin: "LU0987654321", name: "ETF B" };
    const assetC = { ...baseAsset, dismissedSimilarities: [], isin: "LU1111111111", name: "ETF C" };
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset, assetB, assetC] },
      isLoading: false,
      loadError: undefined,
    });
    const renamed = { ...baseAsset, isin: "LU9999999999" };
    useAppStore.getState().updateAsset(baseAsset.isin, renamed);
    expect(useAppStore.getState().data.assets[1]?.dismissedSimilarities).toStrictEqual(["LU9999999999", "LU_OTHER"]);
    expect(useAppStore.getState().data.assets[2]?.dismissedSimilarities).toStrictEqual([]);
  });

  it("updateAssetPrice updates the matching asset price and leaves others unchanged", () => {
    expect.hasAssertions();
    const assetB = { ...baseAsset, isin: "LU0987654321", name: "ETF B", price: 20 };
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset, assetB] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().updateAssetPrice(baseAsset.isin, 99);
    expect(useAppStore.getState().data.assets[0]?.price).toBe(99);
    expect(useAppStore.getState().data.assets[1]?.price).toBe(20);
  });

  it("updateAssetPrice increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [baseAsset] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updateAssetPrice(baseAsset.isin, 42);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("addAsset appends a new asset to the list", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().addAsset(baseAsset);
    expect(useAppStore.getState().data.assets).toHaveLength(1);
    expect(useAppStore.getState().data.assets[0]?.isin).toBe(baseAsset.isin);
  });

  it("addAsset increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().addAsset(baseAsset);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("addAsset ignores the call when maxIsins is reached", () => {
    expect.hasAssertions();
    const maxAssets = Array.from({ length: maxIsins }, (_unused, index) => ({
      ...baseAsset,
      isin: `US${String(index).padStart(9, "0")}${index % 10}`,
    }));
    useAppStore.setState({ data: { ...defaultAppData, assets: maxAssets }, isLoading: false, loadError: undefined });
    useAppStore.getState().addAsset({ ...baseAsset, isin: "IE00B4L5Y983" });
    expect(useAppStore.getState().data.assets).toHaveLength(maxIsins);
  });

  it("addAsset ignores the call when the ISIN already exists", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [baseAsset] }, isLoading: false, loadError: undefined });
    useAppStore.getState().addAsset({ ...baseAsset, name: "Duplicate ETF" });
    expect(useAppStore.getState().data.assets).toHaveLength(1);
    expect(useAppStore.getState().data.assets[0]?.name).toBe("ETF A");
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

  it("addPortfolio increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().addPortfolio(basePortfolio);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("addPortfolio ignores the call when maxPortfolios is reached", () => {
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

  it("deletePortfolio increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().deletePortfolio(basePortfolio.id);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
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

  it("updatePortfolio increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updatePortfolio(basePortfolio.id, { name: "Updated" });
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
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

  it("setPortfolioAssets increments editCount", () => {
    expect.hasAssertions();
    const entry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().setPortfolioAssets(basePortfolio.id, [entry]);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("setPortfolioAssets stamps amountUpdatedAt on new entries and preserves it on existing ones", () => {
    expect.hasAssertions();
    const existingEntry = { amount: 2, amountUpdatedAt: "2024-01-01T00:00:00.000Z", inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    const newEntry = { amount: 0, inPEA: false, isin: "LU0987654321", notes: "", positionValue: 0, targetAmount: 0 };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [basePortfolio] },
      isLoading: false,
      loadError: undefined,
    });
    useAppStore.getState().setPortfolioAssets(basePortfolio.id, [existingEntry, newEntry]);
    const entries = useAppStore.getState().data.portfolios[0]?.entries;
    expect(entries?.[0]?.amountUpdatedAt).toBe("2024-01-01T00:00:00.000Z");
    expect(entries?.[1]?.amountUpdatedAt).toBeTypeOf("string");
    expect(entries?.[1]?.amountUpdatedAt).not.toBe("2024-01-01T00:00:00.000Z");
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

  it("updatePortfolioEntryAmount increments editCount", () => {
    expect.hasAssertions();
    const entry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
    const portfolio = { ...basePortfolio, entries: [entry] };
    useAppStore.setState({
      data: { ...defaultAppData, portfolios: [portfolio] },
      isLoading: false,
      loadError: undefined,
    });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updatePortfolioEntryAmount(portfolio.id, "LU1234567890", 42);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
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

describe("useAppStore - updatePortfolioEntryNote", () => {
  const baseEntry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
  const basePortfolioId = "00000000-0000-4000-8000-000000000001";
  const basePort = { broker: "Test", entries: [baseEntry], id: basePortfolioId, name: "Test" };

  it("updates the note for the matching portfolio entry", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [basePort] }, isLoading: false, loadError: undefined });
    useAppStore.getState().updatePortfolioEntryNote(basePortfolioId, "LU1234567890", "my note");
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.notes).toBe("my note");
  });

  it("increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [basePort] }, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updatePortfolioEntryNote(basePortfolioId, "LU1234567890", "hello");
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("does not affect other entries or portfolios", () => {
    expect.hasAssertions();
    const entry2 = { ...baseEntry, isin: "LU0987654321", notes: "other" };
    const otherPort = { ...basePort, entries: [entry2], id: "00000000-0000-4000-8000-000000000002" };
    const portfolio = { ...basePort, entries: [baseEntry, entry2] };
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [portfolio, otherPort] }, isLoading: false, loadError: undefined });
    useAppStore.getState().updatePortfolioEntryNote(basePortfolioId, "LU1234567890", "updated");
    expect(useAppStore.getState().data.portfolios[0]?.entries[1]?.notes).toBe("other");
    expect(useAppStore.getState().data.portfolios[1]?.entries[0]?.notes).toBe("other");
  });
});

describe("useAppStore - updatePortfolioEntryTargetAmount", () => {
  const baseEntry = { amount: 0, inPEA: false, isin: "LU1234567890", notes: "", positionValue: 0, targetAmount: 0 };
  const basePortfolioId = "00000000-0000-4000-8000-000000000001";
  const basePort = { broker: "Test", entries: [baseEntry], id: basePortfolioId, name: "Test" };

  it("updates the targetAmount for the matching portfolio entry", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [basePort] }, isLoading: false, loadError: undefined });
    useAppStore.getState().updatePortfolioEntryTargetAmount(basePortfolioId, "LU1234567890", 50);
    expect(useAppStore.getState().data.portfolios[0]?.entries[0]?.targetAmount).toBe(50);
  });

  it("increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [basePort] }, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().updatePortfolioEntryTargetAmount(basePortfolioId, "LU1234567890", 25);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("does not affect other entries or portfolios", () => {
    expect.hasAssertions();
    const entry2 = { ...baseEntry, isin: "LU0987654321", targetAmount: 100 };
    const otherPort = { ...basePort, entries: [entry2], id: "00000000-0000-4000-8000-000000000002" };
    const portfolio = { ...basePort, entries: [baseEntry, entry2] };
    useAppStore.setState({ data: { ...defaultAppData, portfolios: [portfolio, otherPort] }, isLoading: false, loadError: undefined });
    useAppStore.getState().updatePortfolioEntryTargetAmount(basePortfolioId, "LU1234567890", 75);
    expect(useAppStore.getState().data.portfolios[0]?.entries[1]?.targetAmount).toBe(100);
    expect(useAppStore.getState().data.portfolios[1]?.entries[0]?.targetAmount).toBe(100);
  });
});

describe("useAppStore - similarity dismiss", () => {
  const assetA: Asset = {
    availableForPlan: false,
    availableOnBroker: true,
    dismissedSimilarities: [],
    fees: 0.2,
    geoAllocation: {},
    isAccumulating: true,
    isin: "LU0000000001",
    name: "ETF A",
    performance1y: 10,
    performance3y: 30,
    performance5y: 50,
    price: 100,
    provider: "P",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: [],
  };
  const isinB = "LU0000000002";

  it("dismissSimilarity adds matchedIsin to the asset's dismissedSimilarities", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetA] }, isLoading: false, loadError: undefined });
    useAppStore.getState().dismissSimilarity(assetA.isin, isinB);
    expect(useAppStore.getState().data.assets[0]?.dismissedSimilarities).toContain(isinB);
  });

  it("dismissSimilarity is idempotent when called twice", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetA] }, isLoading: false, loadError: undefined });
    useAppStore.getState().dismissSimilarity(assetA.isin, isinB);
    useAppStore.getState().dismissSimilarity(assetA.isin, isinB);
    expect(useAppStore.getState().data.assets[0]?.dismissedSimilarities).toHaveLength(1);
  });

  it("dismissSimilarity increments editCount", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetA] }, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().dismissSimilarity(assetA.isin, isinB);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("unDismissSimilarity removes matchedIsin from dismissedSimilarities", () => {
    expect.hasAssertions();
    const assetWithDismissed = { ...assetA, dismissedSimilarities: [isinB] };
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetWithDismissed] }, isLoading: false, loadError: undefined });
    useAppStore.getState().unDismissSimilarity(assetA.isin, isinB);
    expect(useAppStore.getState().data.assets[0]?.dismissedSimilarities).not.toContain(isinB);
  });

  it("unDismissSimilarity increments editCount", () => {
    expect.hasAssertions();
    const assetWithDismissed = { ...assetA, dismissedSimilarities: [isinB] };
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetWithDismissed] }, isLoading: false, loadError: undefined });
    const before = useAppStore.getState().data.settings.editCount;
    useAppStore.getState().unDismissSimilarity(assetA.isin, isinB);
    expect(useAppStore.getState().data.settings.editCount).toBe(before + 1);
  });

  it("unDismissSimilarity does not modify other assets", () => {
    expect.hasAssertions();
    const other = { ...assetA, isin: isinB, name: "ETF B" };
    const assetWithDismissed = { ...assetA, dismissedSimilarities: [isinB] };
    useAppStore.setState({ data: { ...defaultAppData, assets: [assetWithDismissed, other] }, isLoading: false, loadError: undefined });

    useAppStore.getState().unDismissSimilarity(assetA.isin, isinB);

    expect(useAppStore.getState().data.assets[1]?.dismissedSimilarities).toHaveLength(0);
  });
});
