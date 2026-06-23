import { renderHook, waitFor } from "@testing-library/react";
import { messages } from "../locales/en";
import { createTranslate, selectPlural, useTranslation } from "./translations";
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
    await waitFor(() => expect(result.current.translate("export-un-exported", { nbModifications: 0 })).toBe("No un-exported edits"));
  });

  it("selects the one plural variant", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported", { nbModifications: 1 })).toBe("One un-exported edit"));
  });

  it("selects the many plural variant and interpolates count", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported", { nbModifications: 5 })).toBe("5 un-exported edits"));
  });

  it("selects the many plural variant when no interpolation is needed", async () => {
    expect.hasAssertions();
    const { result } = renderHook(() => useTranslation(), { wrapper: TranslationProvider });
    await waitFor(() => expect(result.current.translate("export-un-exported-no-interpolation", { count: 2 })).toBe("Several un-exported edits"));
  });
});

describe("translate type safety", () => {
  const translate = createTranslate(messages);

  it("non-plural key with no placeholders accepts no params", () => {
    expect.assertions(0);
    expectTypeOf(translate("action-back")).toBeString();
  });

  it("non-plural key with no placeholders rejects any params", () => {
    expect.assertions(0);
    // @ts-expect-error — no params allowed for this key
    translate("action-back", { count: 1 });
  });

  it("non-plural key with placeholder requires its param", () => {
    expect.assertions(0);
    expectTypeOf(translate("error-failed-to-load", { message: "oops" })).toBeString();
  });

  it("non-plural key with placeholder rejects missing param", () => {
    expect.assertions(0);
    // @ts-expect-error — message param is required
    translate("error-failed-to-load");
  });

  it("non-plural key with placeholder rejects wrong param name", () => {
    expect.assertions(0);
    // @ts-expect-error — count is not the expected param; message is
    translate("error-failed-to-load", { count: 1 });
  });

  it("plural key with no placeholders requires count", () => {
    expect.assertions(0);
    expectTypeOf(translate("export-un-exported-no-interpolation", { count: 2 })).toBeString();
  });

  it("plural key with no placeholders rejects missing count", () => {
    expect.assertions(0);
    // @ts-expect-error — count is required for plural key without placeholders
    translate("export-un-exported-no-interpolation");
  });

  it("plural key with no placeholders rejects wrong param name", () => {
    expect.assertions(0);
    // @ts-expect-error — must pass count, not nbModifications
    translate("export-un-exported-no-interpolation", { nbModifications: 2 });
  });

  it("plural key with single non-count placeholder requires that placeholder", () => {
    expect.assertions(0);
    expectTypeOf(translate("export-un-exported", { nbModifications: 5 })).toBeString();
  });

  it("plural key with single non-count placeholder rejects missing param", () => {
    expect.assertions(0);
    // @ts-expect-error — nbModifications is required
    translate("export-un-exported");
  });

  it("plural key with single non-count placeholder rejects wrong param name", () => {
    expect.assertions(0);
    // @ts-expect-error — must pass nbModifications, not count
    translate("export-un-exported", { count: 2 });
  });

  it("plural key with count placeholder requires count", () => {
    expect.assertions(0);
    expectTypeOf(translate("time-day", { count: 2 })).toBeString();
  });

  it("plural key with count placeholder rejects missing count", () => {
    expect.assertions(0);
    // @ts-expect-error — count is required
    translate("time-day");
  });
});
