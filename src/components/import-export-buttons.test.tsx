import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { ImportExportButtons } from "./import-export-buttons.tsx";

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
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  it("Export is disabled when no assets", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    expect(screen.getByRole("button", { name: /export/i })).toBeDisabled();
  });

  it("Export is enabled when assets exist", () => {
    useAppStore.setState({
      data: { ...defaultAppData, assets: [makeAsset()] },
      isLoading: false,
      loadError: undefined,
    });
    render(<ImportExportButtons />);
    expect(screen.getByRole("button", { name: /export/i })).not.toBeDisabled();
  });

  it("clicking Export triggers a download and updates lastExportedAt", () => {
    useAppStore.setState({
      data: { ...defaultAppData, assets: [makeAsset()] },
      isLoading: false,
      loadError: undefined,
    });
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL");
    render(<ImportExportButtons />);
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(useAppStore.getState().data.settings.lastExportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("clicking Import triggers the hidden file input click", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(screen.getByRole("button", { name: /import/i }));
    expect(clickSpy).toHaveBeenCalledWith();
  });

  it("file change with no file selected does nothing", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("importing valid JSON calls loadData", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([VALID_IMPORT_JSON], "data.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(useAppStore.getState().data.assets).toHaveLength(0);
    });
  });

  it("importing invalid JSON shows an error alert", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it("dismissing the error alert removes it", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /dismiss error/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clicking Import clears a previously shown error", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<ImportExportButtons />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not valid json {{"], "bad.json", { type: "application/json" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /import/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
