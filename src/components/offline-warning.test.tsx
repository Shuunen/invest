import { render, screen } from "@testing-library/react";
import { TranslationProvider } from "../utils/translations-provider.tsx";
import { OfflineWarning } from "./offline-warning.tsx";

describe("OfflineWarning", () => {
  it("renders the warning when offline", () => {
    expect.hasAssertions();
    render(<OfflineWarning isOffline />, { wrapper: TranslationProvider });
    const warning = screen.getByTestId("offline-warning");
    expect(warning).toBeVisible();
    expect(warning).toHaveTextContent("You are offline. Your local data is still available.");
  });

  it("does not render the warning when online", () => {
    expect.hasAssertions();
    render(<OfflineWarning isOffline={false} />, { wrapper: TranslationProvider });
    expect(screen.queryByTestId("offline-warning")).toBeNull();
  });
});
