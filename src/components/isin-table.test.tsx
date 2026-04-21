import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { db } from "../db/db.ts";
import { computeScore, type AppData, type Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { quintileClass } from "./isin-table-utils.ts";
import { IsinTable } from "./isin-table.tsx";

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

function makeTestData(assets: Asset[]): AppData {
  return {
    ...defaultAppData,
    assets,
    settings: { ...defaultAppData.settings, columnVisibility: {}, sort: { column: "score", direction: "desc" } },
  };
}

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

describe("IsinTable - loading and error states", () => {
  it("shows loading skeleton rows when isLoading is true", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<IsinTable />);
    act(() => {
      useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    });
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("shows error banner with Retry button on loadError", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<IsinTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/DB failed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retry button clears the error state", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: new Error("DB failed") });
    render(<IsinTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("IsinTable - data display", () => {
  it("shows empty state when no ISINs after loading", () => {
    useAppStore.setState({ data: makeTestData([]), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    expect(screen.getByText(/no instruments added yet/i)).toBeInTheDocument();
  });

  it("renders all ISIN rows", () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "ETF One" }),
      makeAsset({ isin: "FR0000000001", name: "ETF Two" }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    expect(screen.getByText("ETF One")).toBeInTheDocument();
    expect(screen.getByText("ETF Two")).toBeInTheDocument();
  });

  it("renders undefined numeric cell as em dash", () => {
    useAppStore.setState({
      data: makeTestData([makeAsset({ performance3y: undefined })]),
      isLoading: false,
      loadError: undefined,
    });
    render(<IsinTable />);
    const cells = document.querySelectorAll("td");
    const dashCell = Array.from(cells).find(td => td.textContent?.trim() === "—");
    expect(dashCell).toBeDefined();
  });
});

describe("IsinTable - score column", () => {
  it("score column matches computeScore output", () => {
    const asset = makeAsset({ fees: 0.2, performance3y: 30, riskReward3y: 1.8 });
    const expected = computeScore(asset);
    expect(expected).toBeDefined();
    invariant(expected !== undefined, "Expected score to be defined");
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    expect(screen.getByText(expected.toFixed(2))).toBeInTheDocument();
  });

  it("score above warning threshold has text-warning class", () => {
    const asset = makeAsset({ fees: 0, performance3y: 200, riskReward3y: 0 });
    useAppStore.setState({ data: makeTestData([asset]), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const score = computeScore(asset);
    invariant(score !== undefined, "Expected score to be defined");
    const scoreEl = document.querySelector(".text-warning");
    invariant(scoreEl, "Expected to find element with text-warning class");
    expect(scoreEl.textContent).toBe(score.toFixed(2));
  });
});

describe("IsinTable - sorting", () => {
  it("sort by name on header click updates store", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Zebra ETF" }),
      makeAsset({ isin: "FR0000000001", name: "Apple ETF" }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.column).toBe("name");
    });
    expect(useAppStore.getState().data.settings.sort.column).toBe("name");
  });

  it("sort toggles direction on second click", async () => {
    const assets = [makeAsset({ isin: "LU1234567890" }), makeAsset({ isin: "FR0000000001" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
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

describe("IsinTable - column hiding", () => {
  it("unchecking a column removes its header from DOM", async () => {
    useAppStore.setState({ data: makeTestData([makeAsset()]), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    expect(screen.getAllByText("Provider").length).toBeGreaterThan(0);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const providerCheckbox = Array.from(checkboxes).find(checkbox =>
      checkbox.closest("label")?.textContent?.includes("Provider"),
    ) as HTMLInputElement | undefined;
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

describe("IsinTable - column visibility guard", () => {
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
    render(<IsinTable />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const scoreCheckbox = Array.from(checkboxes).find(checkbox =>
      checkbox.closest("label")?.textContent?.includes("Score"),
    ) as HTMLInputElement | undefined;
    invariant(scoreCheckbox, "Expected to find Score checkbox");
    expect(scoreCheckbox.disabled).toBe(true);
  });
});

describe("IsinTable - filter", () => {
  it("filter input change narrows displayed rows", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "ProviderA", tickers: ["ALP"] }),
      makeAsset({ isin: "FR0000000001", name: "Beta ETF", provider: "ProviderB", tickers: ["BET"] }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "Alpha" } });
    await waitFor(() => {
      expect(screen.getByText("Alpha ETF")).toBeInTheDocument();
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ISIN", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Alpha ETF" }),
      makeAsset({ isin: "FR0000000001", name: "Beta ETF" }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "LU1234" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by provider", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Alpha ETF", provider: "Amundi" }),
      makeAsset({ isin: "FR0000000001", name: "Beta ETF", provider: "Lyxor" }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "Amundi" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });

  it("filter matches by ticker", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Alpha ETF", tickers: ["IWDA"] }),
      makeAsset({ isin: "FR0000000001", name: "Beta ETF", tickers: ["VWRL"] }),
    ];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "IWDA" } });
    await waitFor(() => {
      expect(screen.queryByText("Beta ETF")).not.toBeInTheDocument();
    });
  });
});

describe("IsinTable - boolean and hidden columns", () => {
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
    render(<IsinTable />);
    const yesBadges = screen.getAllByLabelText("Yes");
    expect(yesBadges.length).toBeGreaterThanOrEqual(2);
    const noBadge = screen.getByLabelText("No");
    expect(noBadge).toBeInTheDocument();
  });
});

describe("IsinTable - tickers column", () => {
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
    render(<IsinTable />);
    expect(screen.getByText("IWDA, EUNL")).toBeInTheDocument();
  });

  it("sort by tickers column uses custom sortingFn", async () => {
    const assets = [
      makeAsset({ isin: "LU1234567890", name: "Zebra ETF", tickers: ["ZZZ"] }),
      makeAsset({ isin: "FR0000000001", name: "Apple ETF", tickers: ["AAA"] }),
    ];
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
    render(<IsinTable />);
    fireEvent.click(screen.getByRole("button", { name: /tickers/i }));
    await waitFor(() => {
      expect(useAppStore.getState().data.settings.sort.column).toBe("tickers");
    });
  });
});

describe("IsinTable - hidden numeric columns", () => {
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
    render(<IsinTable />);
    expect(screen.getByText("12.50")).toBeInTheDocument();
    expect(screen.getByText("0.90")).toBeInTheDocument();
  });
});

describe("IsinTable - sort clearing", () => {
  it("clicking sorted column three times clears the sort and resets to asc", async () => {
    const assets = [makeAsset({ isin: "LU1234567890" }), makeAsset({ isin: "FR0000000001" })];
    useAppStore.setState({ data: makeTestData(assets), isLoading: false, loadError: undefined });
    render(<IsinTable />);
    const nameBtn = screen.getByRole("button", { name: /name/i });
    fireEvent.click(nameBtn); // asc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.column).toBe("name"));
    fireEvent.click(nameBtn); // desc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.direction).toBe("desc"));
    fireEvent.click(nameBtn); // clear → resets to asc
    await waitFor(() => expect(useAppStore.getState().data.settings.sort.direction).toBe("asc"));
  });
});

describe("IsinTable - useHydration", () => {
  it("loads data from DB when isLoading is true on mount", async () => {
    await db.delete();
    await db.open();
    const seedAsset = makeAsset({ isin: "LU9999999990", name: "Seeded ETF" });
    const appData: AppData = { ...defaultAppData, assets: [seedAsset] };
    await db.appdata.put({ data: appData, id: 1 });

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<IsinTable />);

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
    expect(useAppStore.getState().data.assets[0]?.name).toBe("Seeded ETF");
  });

  it("falls back to seedData when DB has no record", async () => {
    await db.delete();
    await db.open();

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<IsinTable />);

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  it("sets loadError when DB throws during load", async () => {
    vi.spyOn(db.appdata, "get").mockRejectedValueOnce(new Error("DB read failed"));

    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<IsinTable />);

    await waitFor(() => {
      expect(useAppStore.getState().loadError?.message).toBe("DB read failed");
    });
  });
});

describe("IsinTable - useDexieSync", () => {
  it("writes data to DB after debounce when store changes", async () => {
    await db.delete();
    await db.open();

    useAppStore.setState({ data: makeTestData([makeAsset()]), isLoading: false, loadError: undefined });
    render(<IsinTable />);

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
