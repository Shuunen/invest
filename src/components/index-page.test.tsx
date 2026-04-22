import { render, screen } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { IndexPage } from "./index-page.tsx";

describe("IndexPage", () => {
  it("renders the IsinTable inside an ErrorBoundary", () => {
    useAppStore.setState({ data: { ...defaultAppData, assets: [] }, isLoading: false, loadError: undefined });
    render(<IndexPage />);
    expect(screen.getByText(/no instruments added yet/i)).toBeInTheDocument();
  });
});
