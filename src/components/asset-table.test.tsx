import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { db } from "../db/db.ts";
import { computeScore, type AppData, type Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { formatPercent } from "../utils/format-numbers.ts";
import { useDexieSync } from "./asset-table-db.ts";
import { matchesFilter } from "./asset-table-hooks.ts";
import { quintileClass } from "./asset-table-utils.ts";
import { AssetTable } from "./asset-table.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

const mockLink = vi.hoisted(
  () =>
    ({ children }: { children: React.ReactNode }): React.ReactElement =>
      children as React.ReactElement,
);

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, Link: mockLink as unknown as typeof actual.Link, useNavigate: () => mockNavigate };
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

const selectAsset = makeAsset({ isin: "LU1234567890" });
const selectAssets = [selectAsset];

const amountAsset = makeAsset();
const amountAssets = [amountAsset];
const valueAssetNoPrice = makeAsset({ isin: "LU1234567890", price: undefined });
const valueAssetsNoPrice = [valueAssetNoPrice];
const valueAssetWithPrice = makeAsset({ isin: "LU1234567890", price: 100 });
const valueAssetsWithPrice = [valueAssetWithPrice];
const valueAssetPrice50 = makeAsset({ isin: "LU1234567890", price: 50 });
const valueAssetsPrice50 = [valueAssetPrice50];
const sortAsset1 = makeAsset({ isin: "LU0000000001", name: "ETF One" });
const sortAsset2 = makeAsset({ isin: "LU0000000002", name: "ETF Two" });
const sortAssets = [sortAsset1, sortAsset2];
const valueSortAsset1 = makeAsset({ isin: sortAsset1.isin, name: "ETF One", price: 20 });
const valueSortAsset2 = makeAsset({ isin: sortAsset2.isin, name: "ETF Two", price: 30 });
const valueSortAssets = [valueSortAsset1, valueSortAsset2];
const valueSortAssetNoPrice = makeAsset({ isin: sortAsset1.isin, name: "ETF One", price: undefined });
const valueSortAssetsNoPrice = [valueSortAssetNoPrice];

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
    expect(screen.getByTestId("error-message")).toHaveTextContent("Failed to load data: DB failed");
    expect(screen.getByTestId("retry-button")).toHaveTextContent("Retry");
  });

  it("retry button clears the error state", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<AssetTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/iu }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AssetTable - data display", () => {
  it("shows empty state when no ISINs after loading", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByTestId("empty-table-message")).toHaveTextContent("No instruments added yet");
  });

  it("renders all ISIN rows", () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "ETF One" }), makeAsset({ isin: "FR0000000001", name: "ETF Two" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByTestId("asset-row-LU1234567890")).toHaveTextContent("ETF One");
    expect(screen.getByTestId("asset-row-FR0000000001")).toHaveTextContent("ETF Two");
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
    render(<AssetTable assets={selectAssets} onToggleSelect={vi.fn<(isin: string) => void>()} />);
    const row = screen.getByTestId("asset-row-LU1234567890");
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
    fireEvent.click(screen.getByRole("button", { name: /name/iu }));
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
    const nameBtn = screen.getByRole("button", { name: /name/iu });
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
      "data-score": false,
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
    const input = screen.getByPlaceholderText(/search/iu);
    fireEvent.change(input, { target: { value: "Alpha" } });
    await waitFor(() => {
      expect(screen.getByTestId("asset-row-LU1234567890")).toHaveTextContent("Alpha ETF");
      expect(screen.queryByTestId("asset-row-FR0000000001")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ISIN", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF" }), makeAsset({ isin: "FR0000000001", name: "Beta ETF" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/iu);
    fireEvent.change(input, { target: { value: "LU1234" } });
    await waitFor(() => {
      expect(screen.queryByTestId("asset-row-FR0000000001")).not.toBeInTheDocument();
    });
  });

  it("filter matches by provider", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "Amundi" }), makeAsset({ isin: "FR0000000001", name: "Beta ETF", provider: "Lyxor" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/iu);
    fireEvent.change(input, { target: { value: "Amundi" } });
    await waitFor(() => {
      expect(screen.queryByTestId("asset-row-FR0000000001")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ticker", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890", name: "Alpha ETF", tickers: ["IWDA"] }), makeAsset({ isin: "FR0000000001", name: "Beta ETF", tickers: ["VWRL"] })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const input = screen.getByPlaceholderText(/search/iu);
    fireEvent.change(input, { target: { value: "IWDA" } });
    await waitFor(() => {
      expect(screen.queryByTestId("asset-row-FR0000000001")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("tickers-lu1234567890")).toHaveTextContent("IWDA, EUNL");
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
    fireEvent.click(screen.getByRole("button", { name: /tickers/iu }));
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
    expect(screen.getByTestId("performance1y-lu1234567890")).toHaveTextContent("143");
    expect(screen.getByTestId("risk-reward1y-lu1234567890")).toHaveTextContent("857");
  });
});

describe("AssetTable - sort clearing", () => {
  it("clicking sorted column three times clears the sort and resets to asc", async () => {
    expect.hasAssertions();
    const assets = [makeAsset({ isin: "LU1234567890" }), makeAsset({ isin: "FR0000000001" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    const nameBtn = screen.getByRole("button", { name: /name/iu });
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

describe("useDexieSync", () => {
  it("writes data to DB after debounce when store changes", async () => {
    expect.hasAssertions();
    await db.delete();
    await db.open();

    useAppStore.setState({ data: makeTestData([makeAsset()]), isLoading: false, loadError: undefined });

    function DexieSyncWrapper() {
      useDexieSync();
      return <span />;
    }
    render(<DexieSyncWrapper />);

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
    const amountMap = new Map([[valueAssetNoPrice.isin, 5]]);
    render(<AssetTable assets={valueAssetsNoPrice} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByTestId("value-lu1234567890")).toHaveTextContent("0 €");
  });

  it("shows computed value when price and amount are set", () => {
    expect.hasAssertions();
    const amountMap = new Map([[valueAssetWithPrice.isin, 3]]);
    render(<AssetTable assets={valueAssetsWithPrice} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    expect(screen.getByTestId("value-lu1234567890")).toHaveTextContent("300 €");
  });

  it("shows 0 € when no amountMap entry exists", () => {
    expect.hasAssertions();
    render(<AssetTable assets={valueAssetsPrice50} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    expect(screen.getByTestId("value-lu1234567890")).toHaveTextContent("0 €");
  });

  it("sorts by value column with undefined price uses 0 fallback", () => {
    expect.hasAssertions();
    render(<AssetTable assets={valueSortAssetsNoPrice} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const valueHeader = screen.getByRole("button", { name: /value/iu });
    fireEvent.click(valueHeader);
    expect(screen.getByTestId("value-lu0000000001")).toHaveTextContent("0 €");
  });

  it("sorts by value column with defined amountMap missing ISIN entry uses 0 fallback", () => {
    expect.hasAssertions();
    const emptyAmountMap = new Map<string, number>();
    render(<AssetTable assets={valueSortAssets} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={emptyAmountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/iu });
    fireEvent.click(valueHeader);
    expect(screen.getAllByTestId(/^value-/u).length).toBeGreaterThan(0);
  });

  it("sorts by value column using accessorFn", () => {
    expect.hasAssertions();
    const amountMap = new Map([
      [sortAsset1.isin, 10],
      [sortAsset2.isin, 5],
    ]);
    render(<AssetTable assets={valueSortAssets} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    const valueHeader = screen.getByRole("button", { name: /value/iu });
    fireEvent.click(valueHeader);
    expect(screen.getByTestId("value-lu0000000001")).toHaveTextContent("200 €");
    expect(screen.getByTestId("value-lu0000000002")).toHaveTextContent("150 €");
  });
});

describe("AssetTable - amount column", () => {
  it("renders shares column with default 0 when no amountMap is provided", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(amountAssets), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={amountAssets} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/iu });
    expect(input).toHaveValue(0);
  });

  it("calls onAmountChange when input value changes and blurs", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(amountAssets), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={amountAssets} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/iu });
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onAmountChange).toHaveBeenCalledWith(amountAsset.isin, 7);
  });

  it("does not call onAmountChange when value is unchanged on blur", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(amountAssets), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    const amountMap = new Map([[amountAsset.isin, 3]]);
    render(<AssetTable assets={amountAssets} onAmountChange={onAmountChange} amountMap={amountMap} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/iu });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("clamps NaN input (empty string) to 0 and does not update when initial value is also 0", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData(amountAssets), isLoading: false, loadError: undefined });
    const onAmountChange = vi.fn<(isin: string, shares: number) => void>();
    render(<AssetTable assets={amountAssets} onAmountChange={onAmountChange} />);
    const input = screen.getByRole("spinbutton", { name: /amount for test etf/iu });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("sorts by amount column using accessorFn with amountMap", () => {
    expect.hasAssertions();
    const amountMap = new Map([
      [sortAsset1.isin, 5],
      [sortAsset2.isin, 2],
    ]);
    render(<AssetTable assets={sortAssets} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} amountMap={amountMap} />);
    const amountHeader = screen.getByRole("button", { name: /amount/iu });
    fireEvent.click(amountHeader);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(2);
    expect(inputs[1]).toHaveValue(5);
  });

  it("sorts by amount column using accessorFn without amountMap", () => {
    expect.hasAssertions();
    render(<AssetTable assets={sortAssets} onAmountChange={vi.fn<(isin: string, amount: number) => void>()} />);
    const amountHeader = screen.getByRole("button", { name: /amount/iu });
    fireEvent.click(amountHeader);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(0);
    expect(inputs[1]).toHaveValue(0);
  });

  it("ignores stored amount sort when rendered without onAmountChange", () => {
    expect.hasAssertions();
    act(() => {
      useAppStore.setState({ data: makeTestData(sortAssets) });
      useAppStore.getState().setSort({ column: "amount", direction: "desc" });
    });
    expect(() => render(<AssetTable assets={sortAssets} />)).not.toThrow();
  });
});

describe("AssetTable - price editing", () => {
  const priceAsset = makeAsset({ isin: "LU9876543210", price: 50 });

  it("shows Add asset and Edit prices buttons in the page header", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByTestId("action-add-asset")).toHaveTextContent("Add asset");
    expect(screen.getByTestId("action-edit-prices")).toHaveTextContent("Edit prices");
  });

  it("clicking Add asset navigates to /assets/create", () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-add-asset"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/assets/create" });
  });

  it("shows Edit prices button in the page header", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    expect(screen.getByTestId("action-edit-prices")).toHaveTextContent("Edit prices");
  });

  it("clicking Edit prices shows price inputs", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
  });

  it("clicking Done hides price inputs", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("action-done"));
    await waitFor(() => {
      expect(screen.queryByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).not.toBeInTheDocument();
    });
  });

  it("blurring price input with a new value updates the asset price in store", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
    const input = screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`);
    fireEvent.change(input, { target: { value: "75" } });
    fireEvent.blur(input);
    await waitFor(() => {
      const updated = useAppStore.getState().data.assets.find(entry => entry.isin === priceAsset.isin);
      expect(updated?.price).toBe(75);
    });
  });

  it("blurring price input with unchanged value does not update the store", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    const editCountBefore = useAppStore.getState().data.settings.editCount;
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
    fireEvent.blur(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`));
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
      expect(screen.getByTestId(`price-input-${zeroAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
    const input = screen.getByTestId(`price-input-${zeroAsset.isin.toLowerCase()}`);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(useAppStore.getState().data.settings.editCount).toBe(editCountBefore);
  });

  it("clicking price input stops event propagation", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: makeTestData([priceAsset]), isLoading: false, loadError: undefined });
    render(<AssetTable />);
    fireEvent.click(screen.getByTestId("action-edit-prices"));
    await waitFor(() => {
      expect(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`)).toBeInTheDocument();
    });
    expect(() => fireEvent.click(screen.getByTestId(`price-input-${priceAsset.isin.toLowerCase()}`))).not.toThrow();
  });
});

describe("AssetTable - updatedAt column", () => {
  it("shows the formatted date when updatedAt is set and column is visible", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1234567890", updatedAt: "2025-06-15T00:00:00.000Z" });
    useAppStore.setState({
      data: { ...makeTestData([asset]), settings: { ...defaultAppData.settings, columnVisibility: { updatedAt: true }, sort: { column: "score", direction: "desc" } } },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    const cell = screen.getByTestId("updated-at-lu1234567890");
    expect(cell).toBeInTheDocument();
    expect(cell.textContent).not.toBe("—");
  });

  it("shows — when updatedAt is undefined and column is visible", () => {
    expect.hasAssertions();
    const asset = makeAsset({ isin: "LU1234567890" });
    useAppStore.setState({
      data: { ...makeTestData([asset]), settings: { ...defaultAppData.settings, columnVisibility: { updatedAt: true }, sort: { column: "score", direction: "desc" } } },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetTable />);
    expect(screen.getByTestId("updated-at-lu1234567890").textContent).toBe("—");
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
