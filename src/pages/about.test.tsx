import { fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import type { ReactNode } from "react";
import { stalenessTierPresets } from "../components/import-export-utils.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { TranslationProvider } from "../utils/translations-provider.tsx";
import { AboutPage } from "./about.tsx";

function wrapper({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}

describe("AboutPage", () => {
  it("renders the app title", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />, { wrapper });
    expect(screen.getByTestId("page-title")).toHaveTextContent("Invest");
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
    render(<AboutPage />, { wrapper });
    expect(screen.getByTestId("export-status-title")).toHaveTextContent("Export status");
    expect(screen.getByTestId("last-exported-at")).toHaveTextContent("Last export was");
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("12 un-exported edits");
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
    render(<AboutPage />, { wrapper });
    expect(screen.getByTestId("last-exported-at")).toHaveTextContent("Last export was Never");
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent("No un-exported edits");
  });

  it("renders buttons for every staleness tier preset", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />, { wrapper });
    for (const preset of stalenessTierPresets) expect(screen.getByTestId(`set-edit-count-${preset.tier}`)).toHaveAttribute("type", "button");
  });

  it("tier preset buttons update the un-exported edit count", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<AboutPage />, { wrapper });
    const criticalPreset = stalenessTierPresets.find(preset => preset.tier === "5-critical");
    const lowPreset = stalenessTierPresets.find(preset => preset.tier === "2-low");
    invariant(criticalPreset, "Expected 5-critical preset to exist");
    invariant(lowPreset, "Expected 2-low preset to exist");
    fireEvent.click(screen.getByTestId("set-edit-count-5-critical"));
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent(String(criticalPreset.editCount));
    fireEvent.click(screen.getByTestId("set-edit-count-2-low"));
    expect(screen.getByTestId("unexported-edit-count")).toHaveTextContent(String(lowPreset.editCount));
  });
});
