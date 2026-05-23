import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppStore, defaultAppData } from "../store/use-app-store.ts";
import { themes } from "../utils/theme.ts";
import { ThemeSwitcher } from "./theme-switcher.tsx";

function resetStore() {
  useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
}

describe("ThemeSwitcher", () => {
  it("renders the theme switcher trigger", () => {
    expect.hasAssertions();
    resetStore();
    render(<ThemeSwitcher />);
    expect(screen.getByTestId("theme-switcher")).toBeDefined();
    expect(screen.getByTestId("theme-switcher")).toHaveAttribute("aria-label", "Switch theme");
  });

  it("renders an option for each theme", () => {
    expect.hasAssertions();
    resetStore();
    render(<ThemeSwitcher />);
    for (const themeName of themes) expect(screen.getByTestId(`theme-option-${themeName}`)).toBeDefined();
  });

  it("shows a checkmark on the active theme (light by default)", () => {
    expect.hasAssertions();
    resetStore();
    render(<ThemeSwitcher />);
    const lightOption = screen.getByTestId("theme-option-light");
    expect(lightOption.querySelector("svg")).toBeDefined();
    const darkOption = screen.getByTestId("theme-option-dark");
    expect(darkOption.querySelector("svg")).toBeNull();
  });

  it("calls setTheme when clicking a theme option", async () => {
    expect.hasAssertions();
    resetStore();
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    await user.click(screen.getByTestId("theme-option-dracula"));
    expect(useAppStore.getState().data.settings.theme).toBe("dracula");
  });

  it("shows checkmark on newly active theme after selection", async () => {
    expect.hasAssertions();
    resetStore();
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    await user.click(screen.getByTestId("theme-option-dracula"));
    const draculaOption = screen.getByTestId("theme-option-dracula");
    expect(draculaOption.querySelector("svg")).toBeDefined();
    const lightOption = screen.getByTestId("theme-option-light");
    expect(lightOption.querySelector("svg")).toBeNull();
  });
});
