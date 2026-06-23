import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { TranslationProvider } from "../utils/translations-provider.tsx";
import { LocaleSwitcher } from "./locale-switcher.tsx";

function setup() {
  useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
  return render(<LocaleSwitcher />, { wrapper: TranslationProvider });
}

describe("LocaleSwitcher", () => {
  it("renders with current locale label", () => {
    expect.hasAssertions();
    const consoleInfo = vi.spyOn(console, "info").mockReturnValue(undefined);
    setup();
    expect(screen.getByTestId("locale-switcher")).toBeDefined();
    expect(screen.getByTestId("locale-switcher")).toHaveTextContent("en");
    consoleInfo.mockRestore();
  });

  it("switches to next locale on click", async () => {
    expect.hasAssertions();
    const consoleInfo = vi.spyOn(console, "info").mockReturnValue(undefined);
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTestId("locale-switcher"));
    expect(screen.getByTestId("locale-switcher")).toHaveTextContent("fr");
    consoleInfo.mockRestore();
  });

  it("cycles back to en after two clicks", async () => {
    expect.hasAssertions();
    const consoleInfo = vi.spyOn(console, "info").mockReturnValue(undefined);
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTestId("locale-switcher"));
    await user.click(screen.getByTestId("locale-switcher"));
    expect(screen.getByTestId("locale-switcher")).toHaveTextContent("en");
    consoleInfo.mockRestore();
  });
});
