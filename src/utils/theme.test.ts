import { renderHook } from "@testing-library/react";
import { useThemeColorSync } from "./theme.ts";

describe("useThemeColorSync", () => {
  it("sets data-theme on documentElement and updates theme-color meta", async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const existingMeta = document.createElement("meta");
    existingMeta.name = "theme-color";
    document.head.append(existingMeta);
    renderHook(() => useThemeColorSync("dark"));
    await vi.runAllTimersAsync();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(existingMeta.content).toBeDefined();
    vi.useRealTimers();
  });

  it("creates theme-color meta if it does not exist", async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    for (const meta of document.querySelectorAll("meta[name='theme-color']")) meta.remove();
    renderHook(() => useThemeColorSync("light"));
    await vi.runAllTimersAsync();
    expect(document.documentElement.dataset.theme).toBe("light");
    const meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    expect(meta).toBeDefined();
    vi.useRealTimers();
  });
});
