import { renderHook, waitFor } from "@testing-library/react";
import { selectPlural, useTranslation } from "./translations";
import { TranslationProvider } from "./translations-provider";

describe("selectPlural", () => {
  it("returns the template unchanged when there are no variants", () => {
    expect.hasAssertions();
    expect(selectPlural("hello", 5)).toBe("hello");
  });

  it("returns zero variant for count 0", () => {
    expect.hasAssertions();
    expect(selectPlural("none | one | many", 0)).toBe("none");
  });

  it("returns one variant for count 1", () => {
    expect.hasAssertions();
    expect(selectPlural("none | one | many", 1)).toBe("one");
  });

  it("returns many variant for count > 1", () => {
    expect.hasAssertions();
    expect(selectPlural("none | one | many", 2)).toBe("many");
  });

  it("handle invalid templates gracefully", () => {
    expect.hasAssertions();
    expect(selectPlural("only one variant", 0)).toBe("only one variant");
    expect(selectPlural("zero | only one variant", 0)).toBe("zero");
  });
});

describe("useTranslation", () => {
  it("throws when used outside TranslationProvider", () => {
    expect.hasAssertions();
    expect(() => renderHook(() => useTranslation())).toThrow("useTranslation must be used inside <TranslationProvider>");
  });

  it("returns the message for a known key", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("app-description")).toContain("A personal ETF"));
  });

  it("selects the zero plural variant", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported", { count: 0 })).toBe("No un-exported edits"));
  });

  it("selects the one plural variant", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported", { count: 1 })).toBe("One un-exported edit"));
  });

  it("selects the many plural variant and interpolates count", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported", { count: 5 })).toBe("5 un-exported edits"));
  });

  it("selects the many plural variant when no interpolation is needed", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported-no-interpolation", { count: 2 })).toBe("Several un-exported edits"));
  });
});
