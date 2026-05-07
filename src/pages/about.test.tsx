import { fireEvent, render, screen } from "@testing-library/react";
import { STALENESS_TIER_PRESETS } from "../components/import-export-utils.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { formatDate } from "../utils/format-numbers.ts";
import { AboutPage } from "./about.tsx";

describe("AboutPage", () => {
  it("renders the app title", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />);
    expect(screen.getByTestId("page-title")).toBeInTheDocument();
  });

  it("renders the score formula", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />);
    expect(screen.getByTestId("score-formula")).toBeInTheDocument();
  });

  it("renders export status values from settings", () => {
    expect.hasAssertions();
    const lastExportedAt = "2026-05-07T08:30:00.000Z";
    useAppStore.setState({
      data: {
        ...defaultAppData,
        settings: {
          ...defaultAppData.settings,
          editCount: 12,
          lastExportedAt,
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AboutPage />);
    expect(screen.getByTestId("export-status-title")).toBeInTheDocument();
    expect(screen.getByTestId("last-exported-at")).toHaveTextContent(formatDate(lastExportedAt));
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("12");
  });

  it("renders an empty last export state when no export happened yet", () => {
    expect.hasAssertions();
    useAppStore.setState({
      data: {
        ...defaultAppData,
        settings: {
          ...defaultAppData.settings,
          editCount: 0,
          lastExportedAt: undefined,
        },
      },
      isLoading: false,
      loadError: undefined,
    });
    render(<AboutPage />);
    expect(screen.getByTestId("last-exported-at")).toHaveTextContent("—");
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("0");
  });

  it("renders buttons for every staleness tier preset", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />);
    for (const preset of STALENESS_TIER_PRESETS) expect(screen.getByTestId(`set-edit-count-${preset.tier}`)).toBeInTheDocument();
  });

  it("tier preset buttons update the un-exported edit count", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />);
    fireEvent.click(screen.getByTestId("set-edit-count-5-critical"));
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("20");
    fireEvent.click(screen.getByTestId("set-edit-count-2-low"));
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("5");
  });
});
