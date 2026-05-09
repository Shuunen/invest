import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-hot-toast";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { jsonStringify } from "../utils/json.ts";
import { ImportExportButtons } from "./import-export-buttons.tsx";
import { getStalenessTier } from "./import-export-utils.ts";

vi.mock(import("../utils/json.ts"), async () => {
  const actual = await import("../utils/json.ts");
  return { ...actual, jsonStringify: vi.fn<typeof actual.jsonStringify>(actual.jsonStringify) };
});

const VALID_IMPORT_JSON = JSON.stringify({ assets: [], portfolios: [], settings: {} });

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

describe("ImportExportButtons", () => {
  it("renders Import and Export buttons", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("import-button")).toBeInTheDocument();
    expect(screen.getByTestId("export-button")).toBeInTheDocument();
  });

  it("Export is disabled when no assets and no portfolios", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).toBeDisabled();
  });

  it("Export is enabled when portfolios exist but no assets", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: {
        ...defaultAppData,
        portfolios: [{ broker: "Test", entries: [], id: "00000000-0000-4000-8000-000000000001", name: "P1" }],
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).not.toBeDisabled();
  });

  it("Export is enabled when assets exist", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [makeAsset()] },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).not.toBeDisabled();
  });

  it("clicking Export triggers a download and updates lastExportedAt", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [makeAsset()] },
      isLoading: false,
      loadError: undefined,
    });
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL");
    render(<ImportExportButtons />);
    fireEvent.click(screen.getByTestId("export-button"));
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(useAppStore.getState().data.settings.lastExportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
  });

  it("export button title includes the number of un-exported changes", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: {
        ...defaultAppData,
        assets: [makeAsset()],
        settings: { ...defaultAppData.settings, editCount: 12 },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).toHaveAttribute("title", "Export data (12 un-exported changes)");
  });

  it("export button title stays simple when there are no un-exported changes", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: { ...defaultAppData, assets: [makeAsset()] },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).toHaveAttribute("title", "Export data");
  });

  it("export button title uses singular wording for one un-exported change", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: {
        ...defaultAppData,
        assets: [makeAsset()],
        settings: { ...defaultAppData.settings, editCount: 1 },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByTestId("export-button")).toHaveAttribute("title", "Export data (1 un-exported change)");
  });

  it("clicking Import triggers the hidden file input click", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(screen.getByTestId("import-button"));
    expect(clickSpy).toHaveBeenCalledWith();
  });

  it("file change with no file selected does nothing", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    fireEvent.change(fileInput);
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInputAfter = screen.getAllByTestId("file-input").at(-1) as HTMLInputElement;
    const file = new File([VALID_IMPORT_JSON], "data.json", { type: "application/json" });
    await userEvent.upload(fileInputAfter, file);
    await waitFor(() => {
      expect(useAppStore.getState().data.assets).toHaveLength(0);
    });
  });

  it("importing invalid JSON shows a toast error", async () => {
    expect.hasAssertions();
    const errorSpy = vi.spyOn(toast, "error").mockReturnValue("");
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid json/iu));
    });
    vi.restoreAllMocks();
  });

  it("shows export toast error when jsonStringify fails", () => {
    expect.hasAssertions();
    const errorSpy = vi.spyOn(toast, "error").mockReturnValue("");
    const asset = makeAsset();
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    vi.mocked(jsonStringify).mockReturnValueOnce(undefined);
    render(<ImportExportButtons />);
    fireEvent.click(screen.getByTestId("export-button"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/export failed/iu));
    vi.restoreAllMocks();
  });
});

describe("getStalenessTier", () => {
  it("returns 1-ok for 0 unexported edits", () => {
    expect.hasAssertions();
    expect(getStalenessTier(0)).toBe("1-ok");
  });

  it("returns 1-ok for 4 unexported edits (below low threshold)", () => {
    expect.hasAssertions();
    expect(getStalenessTier(4)).toBe("1-ok");
  });

  it("returns 2-low for exactly 5 unexported edits", () => {
    expect.hasAssertions();
    expect(getStalenessTier(5)).toBe("2-low");
  });

  it("returns 2-low for 9 unexported edits (below medium threshold)", () => {
    expect.hasAssertions();
    expect(getStalenessTier(9)).toBe("2-low");
  });

  it("returns 3-medium for exactly 10 unexported edits", () => {
    expect.hasAssertions();
    expect(getStalenessTier(10)).toBe("3-medium");
  });

  it("returns 3-medium for 14 unexported edits (below high threshold)", () => {
    expect.hasAssertions();
    expect(getStalenessTier(14)).toBe("3-medium");
  });

  it("returns 4-high for exactly 15 unexported edits", () => {
    expect.hasAssertions();
    expect(getStalenessTier(15)).toBe("4-high");
  });

  it("returns 4-high for 19 unexported edits (below critical threshold)", () => {
    expect.hasAssertions();
    expect(getStalenessTier(19)).toBe("4-high");
  });

  it("returns 5-critical for exactly 20 unexported edits", () => {
    expect.hasAssertions();
    expect(getStalenessTier(20)).toBe("5-critical");
  });

  it("returns 5-critical for values beyond 20", () => {
    expect.hasAssertions();
    expect(getStalenessTier(100)).toBe("5-critical");
  });
});

describe("ImportExportButtons staleness dot", () => {
  function renderWithEdits(editCount: number) {
    useAppStore.setState({
      data: {
        ...defaultAppData,
        assets: [makeAsset()],
        settings: { ...defaultAppData.settings, editCount },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
  }

  it("shows no staleness dot when unexported edits < 5 (tier 0)", () => {
    expect.hasAssertions();
    renderWithEdits(4);
    expect(screen.queryByTestId("staleness-dot")).toBeNull();
  });

  it("shows tier 1 dot for 5 unexported edits", () => {
    expect.hasAssertions();
    renderWithEdits(5);
    const dot = screen.getByTestId("staleness-dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("data-staleness-tier", "2-low");
    expect(screen.getByTestId("export-button")).not.toHaveTextContent("Export");
  });

  it("shows tier 2 dot for 10 unexported edits", () => {
    expect.hasAssertions();
    renderWithEdits(10);
    const dot = screen.getByTestId("staleness-dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("data-staleness-tier", "3-medium");
    expect(dot).toHaveTextContent("10");
    expect(screen.getByTestId("export-button")).not.toHaveTextContent("Export");
  });

  it("shows tier 3 dot for 15 unexported edits", () => {
    expect.hasAssertions();
    renderWithEdits(15);
    const dot = screen.getByTestId("staleness-dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("data-staleness-tier", "4-high");
    expect(dot).toHaveTextContent("15");
    expect(screen.getByTestId("export-button")).toHaveTextContent("Export");
  });

  it("shows tier 4 dot for 20 unexported edits", () => {
    expect.hasAssertions();
    renderWithEdits(20);
    const dot = screen.getByTestId("staleness-dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("data-staleness-tier", "5-critical");
    expect(screen.getByTestId("export-button")).toHaveTextContent("Export");
    expect(dot).not.toHaveTextContent("20");
  });

  it("uses editCount directly as the number of un-exported changes", () => {
    expect.hasAssertions();
    renderWithEdits(5);
    expect(screen.getByTestId("staleness-dot")).toHaveAttribute("data-staleness-tier", "2-low");
  });

  it("export resets staleness dot to tier 0", () => {
    expect.hasAssertions();
    renderWithEdits(20);
    expect(screen.getByTestId("staleness-dot")).toHaveAttribute("data-staleness-tier", "5-critical");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL");
    fireEvent.click(screen.getByTestId("export-button"));
    expect(screen.queryByTestId("staleness-dot")).toBeNull();
    expect(useAppStore.getState().data.settings.editCount).toBe(0);
  });
});
