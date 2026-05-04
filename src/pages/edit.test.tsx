import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { fetchEtfData } from "../utils/fetch-etf-data.ts";
import { AssetEditPage } from "./edit.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock(import("../utils/fetch-etf-data.ts"));

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
    price: 100,
    provider: "Test Provider",
    riskReward1y: 1.5,
    riskReward3y: 1.8,
    riskReward5y: 1.6,
    sectorAllocation: {},
    tickers: ["TST"],
    ...overrides,
  };
}

describe("AssetEditPage - not found", () => {
  it("shows not found message for unknown ISIN", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetEditPage isin="XX0000000000" />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders form after store loads asynchronously", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    render(<AssetEditPage isin={asset.isin} />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    await waitFor(() => {
      expect(screen.getByTestId("name")).toBeInTheDocument();
    });
  });
});

describe("AssetEditPage - form", () => {
  it("renders form fields with asset data", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    expect(screen.getByTestId("name")).toBeInTheDocument();
    expect(screen.getByTestId("provider")).toBeInTheDocument();
    expect(screen.getByTestId("tickers")).toBeInTheDocument();
  });

  it("saves valid form and navigates to view page", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Updated ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
  });

  it("shows before/after diff rows in confirmation modal", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Updated ETF" } });
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "0.4" } });
    fireEvent.click(screen.getByTestId("is-accumulating"));
    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-diff-table")).toBeInTheDocument();
    });
    expect(screen.getByTestId("change-row-name")).toBeInTheDocument();
    expect(screen.getByTestId("change-row-fees")).toBeInTheDocument();
    expect(screen.getByTestId("change-row-accumulating")).toHaveTextContent("No");
    expect(screen.getByTestId("change-row-accumulating")).toHaveTextContent("Yes");
  });

  it("revalidates and blocks save if form becomes invalid before confirmation", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Updated ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("name"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("form-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("name-error")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByTestId("confirm-save-modal")).not.toBeInTheDocument();
  });

  it("closes confirmation modal when cancel is clicked", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Updated ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("form-cancel-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("confirm-save-modal")).not.toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("disables save button when there are no changes", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    expect(screen.getByTestId("save-button")).toBeDisabled();
  });

  it("enables save button after a form change", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Updated ETF" } });
    expect(screen.getByTestId("save-button")).not.toBeDisabled();
  });

  it("reset button restores original values and closes the modal", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });

    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "Changed Name" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("form-reset-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("confirm-save-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("name")).toHaveValue(asset.name);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("updates asset in store on save", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    const nameInput = screen.getByTestId("name");
    fireEvent.change(nameInput, { target: { value: "Renamed ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    await waitFor(() => {
      expect(useAppStore.getState().data.assets[0]?.name).toBe("Renamed ETF");
    });
  });

  it("cancel button navigates back to view page", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, replace: true, to: "/assets/$isin" });
  });

  it("blocks save and shows error when fees is negative, clears error on correction", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "-1" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
  });

  it("fires onChange on all form field types", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("fees"), { target: { value: "0.3" } });
    fireEvent.change(screen.getByTestId("price"), { target: { value: "110" } });
    fireEvent.change(screen.getByTestId("performance-1-y"), { target: { value: "11" } });
    fireEvent.change(screen.getByTestId("performance-3-y"), { target: { value: "31" } });
    fireEvent.change(screen.getByTestId("performance-5-y"), { target: { value: "51" } });
    fireEvent.change(screen.getByTestId("risk-reward-5-y"), { target: { value: "1.7" } });
    fireEvent.change(screen.getByTestId("risk-reward-1-y"), { target: { value: "1.6" } });
    fireEvent.change(screen.getByTestId("risk-reward-3-y"), { target: { value: "1.9" } });
    fireEvent.change(screen.getByTestId("is-accumulating"), { target: { checked: false } });
    fireEvent.change(screen.getByTestId("available-on-broker"), { target: { checked: false } });
    fireEvent.change(screen.getByTestId("available-for-plan"), { target: { checked: true } });
    fireEvent.change(screen.getByTestId("geo-allocation-us"), { target: { value: "60" } });
    fireEvent.change(screen.getByTestId("sector-allocation-technology"), { target: { value: "50" } });
    fireEvent.change(screen.getByTestId("provider"), { target: { value: "New Provider" } });
    fireEvent.change(screen.getByTestId("tickers"), { target: { value: "TST, ABC" } });
    expect(screen.getByTestId("fees")).toHaveValue(0.3);
  });

  it("clicking checkboxes calls patch for each flag field", () => {
    expect.hasAssertions();
    const asset = makeAsset({ availableForPlan: false, availableOnBroker: false, isAccumulating: false });
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.click(screen.getByTestId("is-accumulating"));
    fireEvent.click(screen.getByTestId("available-on-broker"));
    fireEvent.click(screen.getByTestId("available-for-plan"));
    expect(screen.getByTestId("is-accumulating")).toBeChecked();
    expect(screen.getByTestId("available-on-broker")).toBeChecked();
    expect(screen.getByTestId("available-for-plan")).toBeChecked();
  });

  it("shows name validation error when saving with empty name", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("name-error")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("saves geo allocation from percentage inputs and stores as decimals", async () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [asset] },
      isLoading: false,
      loadError: undefined,
    });
    render(<AssetEditPage isin={asset.isin} />);
    fireEvent.change(screen.getByTestId("geo-allocation-us"), { target: { value: "60" } });
    fireEvent.change(screen.getByTestId("geo-allocation-france"), { target: { value: "40" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("form-confirm-button"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ params: { isin: asset.isin }, to: "/assets/$isin" });
    });
    expect(useAppStore.getState().data.assets[0]?.geoAllocation).toStrictEqual({ france: 0.4, us: 0.6 });
  });
});

describe("AssetEditPage - fetch", () => {
  function setup() {
    mockNavigate.mockClear();
    const asset = makeAsset();
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    render(<AssetEditPage isin={asset.isin} />);
    return asset;
  }

  it("shows readonly isin input and an enabled fetch button", () => {
    expect.hasAssertions();
    setup();
    expect(screen.getByTestId("isin")).toBeInTheDocument();
    expect(screen.getByTestId("isin")).toHaveAttribute("readonly");
    expect(screen.getByTestId("fetch-etf-button")).not.toBeDisabled();
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "XX9999999999" } });
    expect(screen.getByTestId("isin")).toHaveValue("LU1234567890");
  });

  it("prefills form fields after a successful fetch", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue({
      fees: "0.07",
      geoAllocation: {},
      isAccumulating: true,
      name: "iShares Core S&P 500",
      performance1y: "26.14",
      performance3y: "66.54",
      performance5y: "87.45",
      provider: "iShares",
      riskReward1y: "2.08",
      riskReward3y: "1.19",
      riskReward5y: "0.77",
      sectorAllocation: {},
      tickers: "SXR8",
    });
    setup();
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveValue("iShares Core S&P 500");
    });
    expect(screen.getByTestId("provider")).toHaveValue("iShares");
  });

  it("shows spinner while fetching then hides it on completion", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue({
      fees: undefined,
      geoAllocation: {},
      isAccumulating: undefined,
      name: undefined,
      performance1y: undefined,
      performance3y: undefined,
      performance5y: undefined,
      provider: undefined,
      riskReward1y: undefined,
      riskReward3y: undefined,
      riskReward5y: undefined,
      sectorAllocation: {},
      tickers: undefined,
    });
    setup();
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    expect(screen.getByTestId("fetch-spinner")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("fetch-spinner")).not.toBeInTheDocument();
    });
  });

  it("shows fetch error when fetchEtfData throws an Error", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockRejectedValue(new Error("Network error"));
    setup();
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fetch-error")).toHaveTextContent("Network error");
    });
  });

  it("shows generic fetch error when a non-Error is thrown", async () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockRejectedValue("oops");
    setup();
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    await waitFor(() => {
      expect(screen.getByTestId("fetch-error")).toHaveTextContent("Failed to fetch ETF data");
    });
  });

  it("disables fetch-etf-button while a fetch is in progress", () => {
    expect.hasAssertions();
    vi.mocked(fetchEtfData).mockResolvedValue({
      fees: undefined,
      geoAllocation: {},
      isAccumulating: undefined,
      name: undefined,
      performance1y: undefined,
      performance3y: undefined,
      performance5y: undefined,
      provider: undefined,
      riskReward1y: undefined,
      riskReward3y: undefined,
      riskReward5y: undefined,
      sectorAllocation: {},
      tickers: undefined,
    });
    setup();
    fireEvent.click(screen.getByTestId("fetch-etf-button"));
    expect(screen.getByTestId("fetch-etf-button")).toBeDisabled();
  });
});
