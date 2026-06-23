import { act, renderHook, waitFor } from "@testing-library/react";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { TranslationProvider } from "./translations-provider.tsx";
import { useTranslation, type Locale } from "./translations.ts";

describe("TranslationProvider", () => {
  it("loads fr locale messages when locale switches to fr", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const consoleInfo = vi.spyOn(console, "info").mockReturnValue(undefined);
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    act(() => {
      result.current.setLocale("fr");
    });
    await waitFor(() => expect(consoleInfo).toHaveBeenCalledWith('loaded locale "fr"'));
    expect(result.current.translate("export-title")).toBe("Statut d'export");
    consoleInfo.mockRestore();
  });

  it("keeps en messages and throws for an unrecognized locale", async () => {
    expect.hasAssertions();
    const consoleInfo = vi.spyOn(console, "info").mockReturnValue(undefined);
    const rejectionHandler = vi.fn<() => void>();
    process.on("unhandledRejection", rejectionHandler);
    useAppStore.setState({
      data: { ...defaultAppData, settings: { ...defaultAppData.settings, locale: "de" as unknown as Locale } },
      isLoading: false,
      loadError: undefined,
    });
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(consoleInfo).toHaveBeenCalledWith('locale changed to "de"'));
    expect(result.current.translate("export-title")).toBe("Export status");
    process.off("unhandledRejection", rejectionHandler);
    consoleInfo.mockRestore();
  });
});
