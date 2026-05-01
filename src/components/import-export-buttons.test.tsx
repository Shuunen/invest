import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { jsonStringify } from "../utils/json.ts";
import { ImportExportButtons } from "./import-export-buttons.tsx";

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
    expect(useAppStore.getState().data.settings.lastExportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("clicking Import triggers the hidden file input click", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(screen.getByTestId("import-button"));
    expect(clickSpy).toHaveBeenCalledWith();
  });

  it("file change with no file selected does nothing", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput);
    expect(screen.queryByTestId("import-error")).not.toBeInTheDocument();
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInputAfter = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([VALID_IMPORT_JSON], "data.json", { type: "application/json" });
    await userEvent.upload(fileInputAfter, file);
    await waitFor(() => {
      expect(useAppStore.getState().data.assets).toHaveLength(0);
    });
  });

  it("importing invalid JSON shows an error alert", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("import-error")).toHaveTextContent(/invalid json/i);
  });

  it("dismissing the error alert removes it", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("dismiss-error-button"));
    expect(screen.queryByTestId("import-error")).not.toBeInTheDocument();
  });

  it("clicking Import clears a previously shown error", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("import-button"));
    expect(screen.queryByTestId("import-error")).not.toBeInTheDocument();
  });

  it("shows export error when jsonStringify fails", () => {
    expect.hasAssertions();
    const asset = makeAsset();
    useAppStore.setState({ data: { ...defaultAppData, assets: [asset] }, isLoading: false, loadError: undefined });
    vi.mocked(jsonStringify).mockReturnValueOnce(undefined);
    render(<ImportExportButtons />);
    fireEvent.click(screen.getByTestId("export-button"));
    expect(screen.getByTestId("export-error")).toBeInTheDocument();
    expect(screen.getByTestId("export-error")).toHaveTextContent(/export failed/i);
  });
});
