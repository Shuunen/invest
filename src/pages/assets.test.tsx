import { render, screen } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { IndexPage } from "./assets.tsx";

describe("IndexPage", () => {
  it("renders the AssetTable inside an ErrorBoundary", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: { ...defaultAppData, assets: [] }, isLoading: false, loadError: undefined });
    render(<IndexPage />);
    expect(screen.getByTestId("empty-table-message")).toBeInTheDocument();
  });
});
