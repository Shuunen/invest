import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { AssetCreatePage } from "./create.tsx";

const mockNavigate = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("AssetCreatePage", () => {
  it("renders the form with empty fields and an ISIN input", () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
    expect(screen.getByTestId("isin")).toBeInTheDocument();
    expect(screen.getByTestId("name")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
  });

  it("cancel button navigates back to assets page", () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("shows isin error when saving with invalid ISIN", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "My ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("isin-error")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("adds asset to store and navigates to / on valid save", async () => {
    expect.hasAssertions();
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
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
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
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
    mockNavigate.mockClear();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AssetCreatePage />);
    fireEvent.change(screen.getByTestId("name"), { target: { value: "My ETF" } });
    fireEvent.click(screen.getByTestId("save-button"));
    await waitFor(() => {
      expect(screen.getByTestId("isin-error")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId("isin"), { target: { value: "IE00B4L5Y983" } });
    expect(screen.queryByTestId("isin-error")).not.toBeInTheDocument();
  });
});
