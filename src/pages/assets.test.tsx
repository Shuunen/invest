import { render, screen } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { TranslationProvider } from "../utils/translations-provider.tsx";
import { IndexPage } from "./assets.tsx";

describe("IndexPage", () => {
  it("renders the AssetTable inside an ErrorBoundary", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [] }, isLoading: false, loadError: undefined });
    render(<IndexPage />, { wrapper: TranslationProvider });
    expect(screen.getByTestId("empty-no-assets")).toBeInTheDocument();
  });
});
