import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invariant } from "es-toolkit";
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
