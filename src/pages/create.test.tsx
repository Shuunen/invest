import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { fetchEtfData } from "../utils/fetch-etf-data.ts";
import { AssetCreatePage } from "./create.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock(import("../utils/fetch-etf-data.ts"));

function setup() {
  mockNavigate.mockClear();
  useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
  render(<AssetCreatePage />);
}

const emptyPrefill = {
  fees: undefined,
  geoAllocation: {},
  isAccumulating: undefined,
  name: undefined,
  performance1y: undefined,
  performance3y: undefined,
  performance5y: undefined,
  price: undefined,
  provider: undefined,
  riskReward1y: undefined,
  riskReward3y: undefined,
  riskReward5y: undefined,
  sectorAllocation: {},
  tickers: undefined,
} as const;

describe("AssetCreatePage", () => {
  it("renders the form with empty fields, ISIN input and a disabled fetch button", () => {
    expect.hasAssertions();
    setup();
    expect(screen.getByTestId("isin")).toBeInTheDocument();
    expect(screen.getByTestId("name")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    expect(screen.getByTestId("fetch-etf-button")).toBeDisabled();
  });

  it("enables the fetch button when ISIN is typed", () => {
    expect.hasAssertions();
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    expect(screen.getByTestId("fetch-etf-button")).not.toBeDisabled();
  });

  it("cancel button navigates back to assets page", () => {
    expect.hasAssertions();
    setup();
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("shows isin error when saving with invalid ISIN", async () => {
    expect.hasAssertions();
    setup();
    fireEvent.change(screen.getByTestId("name"), { target: { value: "My ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("isin-error")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows isin error when saving with a duplicate ISIN", async () => {
    // Regression: ISSUE-002 — duplicate ISIN silently created second entry
    // Found by /qa on 2025-07-18
    // Report: .gstack/qa-reports/qa-report-localhost-2025-07-18.md
    expect.hasAssertions();
    setup();
    useAppStore.setState(state => ({
      data: {
        ...state.data,
        assets: [
          {
            availableForPlan: false,
            availableOnBroker: false,
            dismissedSimilarities: [],
            fees: 0,
            geoAllocation: {},
            isAccumulating: false,
            isin: "IE00B4L5Y983",
            name: "Existing ETF",
            performance1y: undefined,
            performance3y: undefined,
            performance5y: undefined,
            price: undefined,
            provider: "",
            riskReward1y: undefined,
            riskReward3y: undefined,
            riskReward5y: undefined,
            sectorAllocation: {},
            tickers: [],
          },
        ],
      },
    }));
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B4L5Y983" } });
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Duplicate ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("isin-error")).toHaveTextContent("An asset with this ISIN already exists");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(useAppStore.getState().data.assets).toHaveLength(1);
  });

  it("adds asset to store and navigates to / on valid save", async () => {
    expect.hasAssertions();
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B4L5Y983" } });
    fireEvent.change(screen.getByTestId("name"), { target: { value: "World ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });
    expect(useAppStore.getState().data.assets).toHaveLength(1);
    expect(useAppStore.getState().data.assets[0]?.isin).toBe("IE00B4L5Y983");
    expect(useAppStore.getState().data.assets[0]?.name).toBe("World ETF");
  });

  it("clears name error when user corrects the name field", async () => {
    expect.hasAssertions();
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B4L5Y983" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("name-error")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Fixed ETF" } });
    expect(screen.queryByTestId("name-error")).not.toBeInTheDocument();
  });

  it("clears isin error when user corrects the isin field", async () => {
    expect.hasAssertions();
    setup();
    fireEvent.change(screen.getByTestId("name"), { target: { value: "My ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("isin-error")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B4L5Y983" } });
    expect(screen.queryByTestId("isin-error")).not.toBeInTheDocument();
  });

  const fullPrefill = {
    fees: "0.07",
    geoAllocation: {},
    isAccumulating: true,
    name: "iShares Core S&P 500",
    performance1y: "26.14",
    performance3y: "66.54",
    performance5y: "87.45",
    price: undefined,
    provider: "iShares",
    riskReward1y: "2.08",
    riskReward3y: "1.19",
    riskReward5y: "0.77",
    sectorAllocation: {},
    tickers: "SXR8",
  } as const;

  it("prefills identity fields after a successful fetch", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue(fullPrefill);
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveValue("iShares Core S&P 500");
    });
    expect(screen.getByTestId("provider")).toHaveValue("iShares");
    expect(screen.getByTestId("tickers")).toHaveValue("SXR8");
    expect(screen.getByTestId("is-accumulating")).toBeChecked();
  });

  it("prefills financial fields after a successful fetch", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue(fullPrefill);
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fees")).toHaveValue(0.07);
    });
    expect(screen.getByTestId("performance-1-y")).toHaveValue(26.14);
    expect(screen.getByTestId("performance-3-y")).toHaveValue(66.54);
    expect(screen.getByTestId("performance-5-y")).toHaveValue(87.45);
    expect(screen.getByTestId("risk-reward-1-y")).toHaveValue(2.08);
  });

  it("prefills geo and sector allocations after a successful fetch with allocation data", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue({
      ...emptyPrefill,
      geoAllocation: { japan: 6.2, us: 65.3 },
      sectorAllocation: { financials: 14.1, technology: 28.5 },
    });
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("geo-allocation-us")).toHaveValue(65.3);
    });
    expect(screen.getByTestId("geo-allocation-japan")).toHaveValue(6.2);
    expect(screen.getByTestId("sector-allocation-technology")).toHaveValue(28.5);
    expect(screen.getByTestId("sector-allocation-financials")).toHaveValue(14.1);
  });

  it("shows spinner while fetching then hides it on completion", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue(emptyPrefill);
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    expect(screen.getByTestId("fetch-spinner")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("fetch-spinner")).not.toBeInTheDocument();
    });
  });

  it("disables fetch-etf-button while a fetch is in progress", () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue(emptyPrefill);
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    expect(screen.getByTestId("fetch-etf-button")).toBeDisabled();
  });

  it("clears fetch error when a retry succeeds", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(emptyPrefill);
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fetch-error")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.queryByTestId("fetch-error")).not.toBeInTheDocument();
    });
  });

  it("shows fetch error when fetchEtfData throws an Error", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockRejectedValue(new Error("Network error"));
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fetch-error")).toHaveTextContent("Network error");
    });
  });

  it("shows generic fetch error when a non-Error is thrown", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockRejectedValue("oops");
    setup();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B5BMR087" } });
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fetch-error")).toHaveTextContent("Failed to fetch ETF data");
    });
  });
});
