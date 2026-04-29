import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { db } from "../db/db.ts";
import { computeScore, type AppData, type Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { matchesFilter } from "./asset-table-hooks.ts";
import { quintileClass } from "./asset-table-utils.ts";
import { AssetTable } from "./asset-table.tsx";

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
    expect(matchesFilter(asset, "alpha etf")).toBe(true);
  });

  it("matches ISIN partially", () => {
    expect(matchesFilter(asset, "lu1234")).toBe(true);
  });

  it("matches provider case-insensitively", () => {
    expect(matchesFilter(asset, "amundi")).toBe(true);
  });

  it("matches ticker case-insensitively", () => {
    expect(matchesFilter(asset, "iwda")).toBe(true);
  });

  it("returns false when tickers is empty and no other field matches", () => {
    const noTickers = makeAsset({ isin: "FR0000000001", name: "Zeta", provider: "X", tickers: [] });
    expect(matchesFilter(noTickers, "iwda")).toBe(false);
  });

  it("returns false when nothing matches", () => {
    expect(matchesFilter(asset, "nomatch")).toBe(false);
  });
});

describe("quintileClass", () => {
  it("returns undefined for undefined value", () => {
    expect(quintileClass(undefined, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeUndefined();
  });

  it("returns green class for top quintile", () => {
    expect(quintileClass(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe("bg-success/20 text-success-content");
  });

  it("returns red class for bottom quintile", () => {
    expect(quintileClass(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe("bg-error/20 text-error-content");
  });

  it("returns undefined for middle value", () => {
    expect(quintileClass(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeUndefined();
  });

  it("returns undefined when fewer than 10 rows", () => {
    expect(
      quintileClass(
        9,
        Array.from({ length: 9 }, (_el, idx) => idx + 1),
      ),
    ).toBeUndefined();
  });
});

describe("AssetTable - loading and error states", () => {
  it("shows loading skeleton rows when isLoading is true", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetTable />);
    act(() => {
      useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    });
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("shows error banner with Retry button on loadError", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<AssetTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/DB failed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retry button clears the error state", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<AssetTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AssetTable - data display", () => {
  it("shows empty state when no ISINs after loading", () => {
    useAppStore.setState({ data: makeTestData([]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByText(/no instruments added yet/i)).toBeInTheDocument();
  });

  it("renders all ISIN rows", () => {
    const assets = [makeAsset({ isin: "LU1234567890", name: "ETF One" }), makeAsset({ isin: "FR0000000001", name: "ETF Two" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByText("ETF One")).toBeInTheDocument();
    expect(screen.getByText("ETF Two")).toBeInTheDocument();
  });

  it("renders undefined numeric cell as em dash", () => {
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
    render(<AssetTable assets={SELECT_ASSETS} onToggleSelect={vi.fn<(isin: string) => void>()} />);
    const row = screen.getByText(SELECT_ASSET.name).closest("tr");
    invariant(row, "Expected table row to exist");
    expect(within(row).getByRole("checkbox", { hidden: true })).not.toBeChecked();
  });
});

describe("AssetTable - score column", () => {
  it("score column matches computeScore output", () => {
    const asset = makeAsset({ fees: 0.2, performance3y: 30, riskReward3y: 1.8 });
    const expected = computeScore(asset);
    expect(expected).toBeDefined();
    invariant(expected !== undefined, "Expected score to be defined");
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const scoreEls = screen.getAllByText(expected.toFixed(2));
    expect(scoreEls.length).toBeGreaterThan(0);
  });

  it("high score (>=4) renders with green dot indicator", () => {
    const asset = makeAsset({ fees: 0, performance3y: 200, riskReward3y: 0 });
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const score = computeScore(asset);
    invariant(score !== undefined, "Expected score to be defined");
    const dotEl = document.querySelector(".bg-success.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });

  it("negative score renders with red dot indicator", () => {
    const asset = makeAsset({ fees: 100, performance3y: 0, riskReward3y: 0 });
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const score = computeScore(asset);
    invariant(score !== undefined, "Expected score to be defined");
    invariant(score < 0, "Expected score to be negative for this test");
    const dotEl = document.querySelector(".bg-error.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });

  it("low positive score (0-3) renders with warning dot indicator", () => {
    const asset = makeAsset({ fees: 0, performance3y: 1, riskReward3y: 0 });
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const score = computeScore(asset);
    invariant(score !== undefined, "Expected score to be defined");
    invariant(score >= 0 && score < 4, "Expected score to be in warning range for this test");
    const dotEl = document.querySelector(".bg-warning.rounded-full");
    expect(dotEl).toBeInTheDocument();
  });
});

describe("AssetTable - sorting", () => {
  it("sort by name on header click updates store", async () => {
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
    const asset = makeAsset({ performance1y: 12.5, riskReward1y: 0.9 });
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
    expect(screen.getByText("12.50")).toBeInTheDocument();
    expect(screen.getByText("0.90")).toBeInTheDocument();
  });
});

describe("AssetTable - sort clearing", () => {
  it("clicking sorted column three times clears the sort and resets to asc", async () => {
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
    await db.delete();
    await db.open();

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetTable />);

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  it("sets loadError when DB throws during load", async () => {
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
  it("shows 0.00 € when price is undefined", () => {
    const amountMap = new Map([[VALUE_ASSET_NO_PRICE.isin, 5]]);
    render(<AssetTable assets={VALUE_ASSETS_NO_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByText("0.00 €")).toBeInTheDocument();
  });

  it("shows computed value when price and amount are set", () => {
    const amountMap = new Map([[VALUE_ASSET_WITH_PRICE.isin, 3]]);
    render(<AssetTable assets={VALUE_ASSETS_WITH_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByText("300.00 €")).toBeInTheDocument();
  });

  it("shows 0.00 € when no amountMap entry exists", () => {
    render(<AssetTable assets={VALUE_ASSETS_PRICE_50} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    expect(screen.getByText("0.00 €")).toBeInTheDocument();
  });

  it("sorts by value column with undefined price uses 0 fallback", () => {
    render(<AssetTable assets={VALUE_SORT_ASSETS_NO_PRICE} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getByText("0.00 €")).toBeInTheDocument();
  });

  it("sorts by value column with defined amountMap missing ISIN entry uses 0 fallback", () => {
    const emptyAmountMap = new Map<string, number>();
    render(<AssetTable assets={VALUE_SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={emptyAmountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getAllByText("0.00 €").length).toBeGreaterThan(0);
  });

  it("sorts by value column using accessorFn", () => {
    const amountMap = new Map([
      [SORT_ASSET_1.isin, 10],
      [SORT_ASSET_2.isin, 5],
    ]);
    render(<AssetTable assets={VALUE_SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/i });
    fireEvent.click(valueHeader);
    expect(screen.getByText("200.00 €")).toBeInTheDocument();
    expect(screen.getByText("150.00 €")).toBeInTheDocument();
  });
});

describe("AssetTable - amount column", () => {
  it("renders shares column with default 0 when no amountMap is provided", () => {
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    expect(input).toHaveValue(0);
  });

  it("calls onAmountChange when input value changes and blurs", () => {
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onAmountChange).toHaveBeenCalledWith(AMOUNT_ASSET.isin, 7);
  });

  it("does not call onAmountChange when value is unchanged on blur", () => {
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    const amountMap = new Map([[AMOUNT_ASSET.isin, 3]]);
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} amountMap={amountMap} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("clamps NaN input (empty string) to 0 and does not update when initial value is also 0", () => {
    useAppStore.setState({ data: makeTestData(AMOUNT_ASSETS), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={AMOUNT_ASSETS} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/i });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("sorts by amount column using accessorFn with amountMap", () => {
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
    render(<AssetTable assets={SORT_ASSETS} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const amountHeader = screen.getByRole("button", { name: /amount/i });
    fireEvent.click(amountHeader);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(0);
    expect(inputs[1]).toHaveValue(0);
  });

  it("ignores stored amount sort when rendered without onAmountChange", () => {
    act(() => {
      useAppStore.setState({ data: makeTestData(SORT_ASSETS) });
      useAppStore.getState().setSort({ column: "amount", direction: "desc" });
    });
    expect(() => render(<AssetTable assets={SORT_ASSETS} />)).not.toThrow();
  });
});
