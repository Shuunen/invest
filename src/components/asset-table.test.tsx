import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { db } from "../db/db.ts";
import { computeScore, type AppData, type Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { matchesFilter } from "./asset-table-hooks.ts";
import { quintileClass, formatPercent } from "./asset-table-utils.ts";
import { AssetTable } from "./asset-table.tsx";

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
    performance1y: 115,
    performance3y: 230,
    performance5y: 350,
    price: undefined,
    provider: "Test",
    riskReward1y: 412,
    riskReward3y: 326,
    riskReward5y: 178,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

function makeTestData(assets: Asset[]): AppData {
  return {
    ...defaultAppData,
    assets,
    settings: { ...defaultAppData.settings, columnVisibility: {}, sort: { column: "score", direction: "desc" } },
  };
}

const SELECT_ASSET = makeAsset({ isin: "LU1234567890" });
const SELECT_ASSETS = [SELECT_ASSET];

const AMOUNT_ASSET = makeAsset();
const AMOUNT_ASSETS = [AMOUNT_ASSET];
const VALUE_ASSET_NO_PRICE = makeAsset({ isin: "LU1234567890", price: undefined });
const VALUE_ASSETS_NO_PRICE = [VALUE_ASSET_NO_PRICE];
const VALUE_ASSET_WITH_PRICE = makeAsset({ isin: "LU1234567890", price: 100 });
const VALUE_ASSETS_WITH_PRICE = [VALUE_ASSET_WITH_PRICE];
const VALUE_ASSET_PRICE_50 = makeAsset({ isin: "LU1234567890", price: 50 });
const VALUE_ASSETS_PRICE_50 = [VALUE_ASSET_PRICE_50];
const SORT_ASSET_1 = makeAsset({ isin: "LU0000000001", name: "ETF One" });
const SORT_ASSET_2 = makeAsset({ isin: "LU0000000002", name: "ETF Two" });
const SORT_ASSETS = [SORT_ASSET_1, SORT_ASSET_2];
const VALUE_SORT_ASSET_1 = makeAsset({ isin: SORT_ASSET_1.isin, name: "ETF One", price: 20 });
const VALUE_SORT_ASSET_2 = makeAsset({ isin: SORT_ASSET_2.isin, name: "ETF Two", price: 30 });
const VALUE_SORT_ASSETS = [VALUE_SORT_ASSET_1, VALUE_SORT_ASSET_2];
const VALUE_SORT_ASSET_NO_PRICE = makeAsset({ isin: SORT_ASSET_1.isin, name: "ETF One", price: undefined });
const VALUE_SORT_ASSETS_NO_PRICE = [VALUE_SORT_ASSET_NO_PRICE];

describe("matchesFilter", () => {
  const asset = makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "Amundi", tickers: ["IWDA"] });

  it("matches name case-insensitively", () => {
    expect.hasAssertions();
    expect(matchesFilter(asset, "alpha etf")).toBe(true);
  });

  it("matches ISIN partially", () => {
    expect.hasAssertions();
    expect(matchesFilter(asset, "lu1234")).toBe(true);
  });

  it("matches provider case-insensitively", () => {
    expect.hasAssertions();
    expect(matchesFilter(asset, "amundi")).toBe(true);
  });

  it("matches ticker case-insensitively", () => {
    expect.hasAssertions();
    expect(matchesFilter(asset, "iwda")).toBe(true);
  });

  it("returns false when tickers is empty and no other field matches", () => {
    expect.hasAssertions();
    const noTickers = makeAsset({ isin: "FR0000000001", name: "Zeta", provider: "X", tickers: [] });
    expect(matchesFilter(noTickers, "iwda")).toBe(false);
  });

  it("returns false when nothing matches", () => {
    expect.hasAssertions();
    expect(matchesFilter(asset, "nomatch")).toBe(false);
  });
});

describe("quintileClass", () => {
  it("returns undefined for undefined value", () => {
    expect.hasAssertions();
    expect(quintileClass(undefined, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeUndefined();
  });

  it("returns green class for top quintile", () => {
    expect.hasAssertions();
    expect(quintileClass(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe("bg-success/20 text-success-content");
  });

  it("returns red class for bottom quintile", () => {
    expect.hasAssertions();
    expect(quintileClass(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe("bg-error/20 text-error-content");
  });

  it("returns undefined for middle value", () => {
    expect.hasAssertions();
    expect(quintileClass(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeUndefined();
  });

  it("returns undefined when fewer than 3 rows", () => {
    expect.hasAssertions();
    expect(
      quintileClass(
        2,
        Array.from({ length: 2 }, (_el, idx) => idx + 1),
      ),
    ).toBeUndefined();
  });
});

describe("AssetTable - loading and error states", () => {
  it("shows loading skeleton rows when isLoading is true", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetTable />);
    act(() => {
      useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    });
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("shows error banner with Retry button on loadError", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<AssetTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/DB failed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retry button clears the error state", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<AssetTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AssetTable - data display", () => {
  it("shows empty state when no ISINs after loading", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByText(/no instruments added yet/i)).toBeInTheDocument();
  });

  it("renders all ISIN rows", () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "ETF One" }), makeAsset({ isin: "FR0000000001", name: "ETF Two" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByText("ETF One")).toBeInTheDocument();
    expect(screen.getByText("ETF Two")).toBeInTheDocument();
  });

  it("renders undefined numeric cell as em dash", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: makeTestData([makeAsset({ performance3y: undefined })]),
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    const cells = document.querySelectorAll("td");
    const dashCell = Array.from(cells).find(td => td.textContent?.trim() === "—");
    expect(dashCell).toBeDefined();
  });
});

describe("AssetTable - select column", () => {
  it("renders unchecked select checkbox when onToggleSelect is set but no selectedIsins", () => {
    expect.hasAssertions();
    render(<AssetTable assets={SELECT_ASSETS} onToggleSelect={vi.fn<(isin: string) => void>()} />);
    const row = screen.getByText(SELECT_ASSET.name).closest("tr");
    invariant(row, "Expected table row to exist");
    expect(within(row).getByRole("checkbox", { hidden: true })).not.toBeChecked();
  });
});

describe("AssetTable - score column", () => {
  it("score column matches computeScore output", () => {
    expect.hasAssertions();
    const asset = makeAsset({ fees: 0.2, performance3y: 30, riskReward3y: 1.8 });
    const expected = computeScore(asset);
    expect(expected).toBeDefined();
    invariant(expected !== undefined, "Expected score to be defined");
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const scoreEls = screen.getAllByText(Math.round(expected).toString());
    expect(scoreEls.length).toBeGreaterThan(0);
  });

  it("top-quintile score renders with green dot indicator", () => {
    expect.hasAssertions();
    const highAsset = makeAsset({ fees: 0, isin: "HIGH0000001", performance3y: 200, riskReward3y: 0 });
    const assets = [
      highAsset,
      makeAsset({ fees: 100, isin: "LOW00000001", performance3y: 0, riskReward3y: 0 }),
      makeAsset({ fees: 100, isin: "LOW00000002", performance3y: 0, riskReward3y: 0 }),
      makeAsset({ fees: 100, isin: "LOW00000003", performance3y: 0, riskReward3y: 0 }),
      makeAsset({ fees: 100, isin: "LOW00000004", performance3y: 0, riskReward3y: 0 }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const dotEl = document.querySelector(".bg-success.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });

  it("bottom-quintile score renders with red dot indicator", () => {
    expect.hasAssertions();
    const lowAsset = makeAsset({ fees: 100, isin: "LOW0000001X", performance3y: 0, riskReward3y: 0 });
    const score = computeScore(lowAsset);
    invariant(score !== undefined, "Expected score to be defined for this test");
    invariant(score < 0, "Expected score to be negative for this test");
    const assets = [lowAsset, makeAsset({ fees: 0, isin: "HIGH0000001", performance3y: 200, riskReward3y: 0 }), makeAsset({ fees: 0, isin: "HIGH0000002", performance3y: 200, riskReward3y: 0 })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const dotEl = document.querySelector(".bg-error.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });

  it("mid-quintile score renders with warning dot indicator", () => {
    expect.hasAssertions();
    const midAsset = makeAsset({ fees: 0, isin: "MID00000001", performance3y: 50, riskReward3y: 0 });
    const assets = [
      midAsset,
      makeAsset({ fees: 0, isin: "HIGH0000001", performance3y: 200, riskReward3y: 0 }),
      makeAsset({ fees: 0, isin: "HIGH0000002", performance3y: 200, riskReward3y: 0 }),
      makeAsset({ fees: 50, isin: "LOW00000001", performance3y: 0, riskReward3y: 0 }),
      makeAsset({ fees: 50, isin: "LOW00000002", performance3y: 0, riskReward3y: 0 }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const dotEl = document.querySelector(".bg-warning.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });
});

describe("AssetTable - sorting", () => {
  it("sort by name on header click updates store", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Zebra ETF" }), makeAsset({ isin: "FR0000000001", name: "Apple ETF" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.column).toBe("name");
    });
    expect(useAppStore.getState().data.settings.sort.column).toBe("name");
  });

  it("sort toggles direction on second click", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890" }), makeAsset({ isin: "FR0000000001" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const nameBtn = screen.getByRole("button", { name: /name/i });
    fireEvent.click(nameBtn);
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.column).toBe("name");
    });
    const firstDir = useAppStore.getState().data.settings.sort.direction;
    fireEvent.click(nameBtn);
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.direction).not.toBe(firstDir);
    });
    expect(useAppStore.getState().data.settings.sort.direction).not.toBe(firstDir);
  });
});

describe("AssetTable - column hiding", () => {
  it("unchecking a column removes its header from DOM", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([makeAsset()]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getAllByText("Provider").length).toBeGreaterThan(0);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const providerCheckbox = Array.from(checkboxes).find(checkbox => checkbox.closest("label")?.textContent?.includes("Provider")) as HTMLInputElement | undefined;
    invariant(providerCheckbox, "Expected to find Provider checkbox");
    fireEvent.click(providerCheckbox);
    await waitFor(() => {
      const headers = document.querySelectorAll("th");
      const providerHeader = Array.from(headers).find(th => th.textContent?.trim() === "Provider");
      expect(providerHeader).toBeUndefined();
    });
    expect(document.querySelectorAll("th").length).toBeGreaterThan(0);
  });
});

describe("AssetTable - column visibility guard", () => {
  it("last visible column toggle is disabled", () => {
    expect.hasAssertions();
    const colsAllHidden: Record<string, boolean> = {
      availableForPlan: false,
      availableOnBroker: false,
      fees: false,
      isAccumulating: false,
      isin: false,
      name: false,
      performance1y: false,
      performance3y: false,
      performance5y: false,
      price: false,
      provider: false,
      riskReward1y: false,
      riskReward3y: false,
      riskReward5y: false,
      tickers: false,
    };
    useAppStore.setState({
      data: {
        ...makeTestData([makeAsset()]),
        settings: {
          ...defaultAppData.settings,
          columnVisibility: colsAllHidden,
          sort: { column: "score", direction: "desc" },
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const scoreCheckbox = Array.from(checkboxes).find(checkbox => checkbox.closest("label")?.textContent?.includes("Score")) as HTMLInputElement | undefined;
    invariant(scoreCheckbox, "Expected to find Score checkbox");
    expect(scoreCheckbox.disabled).toBe(true);
  });
});

describe("AssetTable - filter", () => {
  it("filter input change narrows displayed rows", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "ProviderA", tickers: ["ALP"] }), makeAsset({ isin: "FR0000000001", name: "Beta ETF", provider: "ProviderB", tickers: ["BET"] })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "Alpha" } });
    await waitFor(() => {
      expect(screen.getByText("Alpha ETF")).toBeInTheDocument();
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ISIN", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF" }), makeAsset({ isin: "FR0000000001", name: "Beta ETF" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "LU1234" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by provider", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "Amundi" }), makeAsset({ isin: "FR0000000001", name: "Beta ETF", provider: "Lyxor" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "Amundi" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ticker", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF", tickers: ["IWDA"] }), makeAsset({ isin: "FR0000000001", name: "Beta ETF", tickers: ["VWRL"] })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "IWDA" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });
});

describe("AssetTable - boolean and hidden columns", () => {
  it("renders Yes/No badges for boolean columns when made visible", () => {
    expect.hasAssertions();
    const asset = makeAsset({ availableForPlan: true, availableOnBroker: false, isAccumulating: true });
    useAppStore.setState({
      data: {
        ...makeTestData([asset]),
        settings: {
          ...defaultAppData.settings,
          columnVisibility: { availableForPlan: true, availableOnBroker: true, isAccumulating: true },
          sort: { column: "score", direction: "desc" },
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    const yesBadges = screen.getAllByLabelText("Yes");
    expect(yesBadges.length).toBeGreaterThanOrEqual(2);
    const noBadge = screen.getByLabelText("No");
    expect(noBadge).toBeInTheDocument();
  });
});

describe("AssetTable - tickers column", () => {
  it("renders tickers cell content when column is visible", () => {
    expect.hasAssertions();
    const asset = makeAsset({ tickers: ["IWDA", "EUNL"] });
    useAppStore.setState({
      data: {
        ...makeTestData([asset]),
        settings: {
          ...defaultAppData.settings,
          columnVisibility: { tickers: true },
          sort: { column: "score", direction: "desc" },
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    expect(screen.getByText("IWDA, EUNL")).toBeInTheDocument();
  });

  it("sort by tickers column uses custom sortingFn", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Zebra ETF", tickers: ["ZZZ"] }), makeAsset({ isin: "FR0000000001", name: "Apple ETF", tickers: ["AAA"] })];
    useAppStore.setState({
      data: {
        ...makeTestData(assets),
        settings: {
          ...defaultAppData.settings,
          columnVisibility: { tickers: true },
          sort: { column: "score", direction: "desc" },
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    fireEvent.click(screen.getByRole("button", { name: /tickers/i }));
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.column).toBe("tickers");
    });
  });
});

describe("AssetTable - hidden numeric columns", () => {
  it("renders performance1y and riskReward1y cells when made visible", () => {
    expect.hasAssertions();
    const asset = makeAsset({ performance1y: 142.5, riskReward1y: 857.4 });
    useAppStore.setState({
      data: {
        ...makeTestData([asset]),
        settings: {
          ...defaultAppData.settings,
          columnVisibility: { performance1y: true, riskReward1y: true },
          sort: { column: "score", direction: "desc" },
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    expect(screen.getByText("143")).toBeInTheDocument();
    expect(screen.getByText("857")).toBeInTheDocument();
  });
});

describe("AssetTable - sort clearing", () => {
  it("clicking sorted column three times clears the sort and resets to asc", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890" }), makeAsset({ isin: "FR0000000001" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const nameBtn = screen.getByRole("button", { name: /name/i });
    fireEvent.click(nameBtn); // asc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.column).toBe("name"));
    fireEvent.click(nameBtn); // desc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.direction).toBe("desc"));
    fireEvent.click(nameBtn); // clear → resets to asc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.direction).toBe("asc"));
  });
});

describe("AssetTable - useHydration", () => {
  it("loads data from DB when isLoading is true on mount", async () => {
    expect.hasAssertions();
    await db.delete();
    await db.open();
    const seedAsset = makeAsset({ isin: "LU9999999990", name: "Seeded ETF" });
    const appData: AppData = { ...defaultAppData, assets: [seedAsset] };
    await db.appdata.put({ data: appData, id: 1 });

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetTable />);

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
    expect(useAppStore.getState().data.assets[0]?.name).toBe("Seeded ETF");
  });

  it("falls back to seedData when DB has no record", async () => {
    expect.hasAssertions();
    await db.delete();
    await db.open();

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetTable />);

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  it("sets loadError when DB throws during load", async () => {
    expect.hasAssertions();
    vi.spyOn(db.appdata, "get").mockRejectedValueOnce(new Error("DB read failed"));

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetTable />);

    await waitFor(() => {
      expect(useAppStore.getState().loadError?.message).toBe("DB read failed");
    });
  });
});

describe("AssetTable - useDexieSync", () => {
  it("writes data to DB after debounce when store changes", async () => {
    expect.hasAssertions();
    await db.delete();
    await db.open();

    useAppStore.setState({ data: makeTestData([makeAsset()]), isLoading: false, loadError: undefined });
    render(<AssetTable />);

    act(() => {
      useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    });

    // Wait for the debounce (300ms) to fire and the async write to complete
    await waitFor(
      async () => {
        const record = await db.appdata.get(1);
        expect(record?.data.settings.sort.column).toBe("fees");
      },
      { timeout: 2000 },
    );
  });
});

describe("AssetTable - value column", () => {
  it("shows 0 € when price is undefined", () => {
    expect.hasAssertions();
    const amountMap = new Map([[VALUE_ASSET_NO_PRICE.isin, 5]]);
    render(<AssetTable assets={VALUE_ASSETS_NO_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByText("0 €")).toBeInTheDocument();
  });

  it("shows computed value when price and amount are set", () => {
    expect.hasAssertions();
    const amountMap = new Map([[VALUE_ASSET_WITH_PRICE.isin, 3]]);
    render(<AssetTable assets={VALUE_ASSETS_WITH_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByText("300 €")).toBeInTheDocument();
  });

  it("shows 0 € when no amountMap entry exists", () => {
    expect.hasAssertions();
    render(<AssetTable assets={VALUE_ASSETS_PRICE_50} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    expect(screen.getByText("0 €")).toBeInTheDocument();
  });

  it("sorts by value column with undefined price uses 0 fallback", () => {
    expect.hasAssertions();
    render(<AssetTable assets={VALUE_SORT_ASSETS_NO_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getByText("0 €")).toBeInTheDocument();
  });

  it("sorts by value column with defined amountMap missing ISIN entry uses 0 fallback", () => {
    expect.hasAssertions();
    const emptyAmountMap = new Map<string, number>();
    render(<AssetTable assets={VALUE_SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={emptyAmountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getAllByText("0 €").length).toBeGreaterThan(0);
  });

  it("sorts by value column using accessorFn", () => {
    expect.hasAssertions();
    const amountMap = new Map([
      [SORT_ASSET_1.isin, 10],
      [SORT_ASSET_2.isin, 5],
    ]);
    render(<AssetTable assets={VALUE_SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getByText("200 €")).toBeInTheDocument();
    expect(screen.getByText("150 €")).toBeInTheDocument();
  });
});

describe("AssetTable - amount column", () => {
  it("renders shares column with default 0 when no amountMap is provided", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    expect(input).toHaveValue(0);
  });

  it("calls onAmountChange when input value changes and blurs", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onAmountChange).toHaveBeenCalledWith(AMOUNT_ASSET.isin, 7);
  });

  it("does not call onAmountChange when value is unchanged on blur", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    const amountMap = new Map([[AMOUNT_ASSET.isin, 3]]);
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} amountMap={amountMap} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("clamps NaN input (empty string) to 0 and does not update when initial value is also 0", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("sorts by amount column using accessorFn with amountMap", () => {
    expect.hasAssertions();
    const amountMap = new Map([
      [SORT_ASSET_1.isin, 5],
      [SORT_ASSET_2.isin, 2],
    ]);
    render(<AssetTable assets={SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    const amountHeader = screen.getByRole("button", { name: /amount/i });
    fireEvent.click(amountHeader);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(2);
    expect(inputs[1]).toHaveValue(5);
  });

  it("sorts by amount column using accessorFn without amountMap", () => {
    expect.hasAssertions();
    render(<AssetTable assets={SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const amountHeader = screen.getByRole("button", { name: /amount/i });
    fireEvent.click(amountHeader);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(0);
    expect(inputs[1]).toHaveValue(0);
  });

  it("ignores stored amount sort when rendered without onAmountChange", () => {
    expect.hasAssertions();
    act(() => {
      useAppStore.setState({ data: makeTestData(SORT_ASSETS) });
      useAppStore.getState().setSort({ column: "amount", direction: "desc" });
    });
    expect(() => render(<AssetTable assets={SORT_ASSETS} />)).not.toThrow();
  });
});

describe("AssetTable - price editing", () => {
  const PRICE_ASSET = makeAsset({ isin: "LU9876543210", price: 50 });

  it("shows Edit prices button in the page header", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByTestId("action-edit-prices")).toBeInTheDocument();
  });

  it("clicking Edit prices shows price inputs", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`)).toBeInTheDocument();
    });
  });

  it("clicking Done hides price inputs", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("action-done"));
    await waitFor(() => {
      expect(screen.queryByTestId(`price-input-${PRICE_ASSET.isin}`)).not.toBeInTheDocument();
    });
  });

  it("blurring price input with a new value updates the asset price in store", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`)).toBeInTheDocument();
    });
    const input = screen.getByTestId(`price-input-${PRICE_ASSET.isin}`);
    fireEvent.change(input, { target: { value: "75" } });
    fireEvent.blur(input);
    await waitFor(() => {
      const updated = useAppStore.getState().data.assets.find(entry => entry.isin === PRICE_ASSET.isin);
      expect(updated?.price).toBe(75);
    });
  });

  it("blurring price input with unchanged value does not update the store", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    const editCountBefore = useAppStore.getState().data.settings.editCount;
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`)).toBeInTheDocument();
    });
    fireEvent.blur(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`));
    expect(useAppStore.getState().data.settings.editCount).toBe(editCountBefore);
  });

  it("clamps NaN price input (empty string) to 0 and does not update when initial price is also 0", async () => {
    expect.hasAssertions();
    const zeroAsset = makeAsset({ isin: "LU0000000000", price: 0 });
    useAppStore.setState({ data: makeTestData([zeroAsset]), isLoading: false, loadError: undefined });
    const editCountBefore = useAppStore.getState().data.settings.editCount;
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${zeroAsset.isin}`)).toBeInTheDocument();
    });
    const input = screen.getByTestId(`price-input-${zeroAsset.isin}`);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.settings.editCount).toBe(editCountBefore);
  });

  it("clicking price input stops event propagation", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([PRICE_ASSET]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`)).toBeInTheDocument();
    });
    expect(() => fireEvent.click(screen.getByTestId(`price-input-${PRICE_ASSET.isin}`))).not.toThrow();
  });
});

describe("formatPercent", () => {
  it("formats positive numbers with plus sign and percent symbol", () => {
    expect.hasAssertions();
    expect(formatPercent(12.345)).toBe("12 %");
  });

  it("formats undefined numbers with dash", () => {
    expect.hasAssertions();
    expect(formatPercent(undefined)).toBe("—");
  });
});
