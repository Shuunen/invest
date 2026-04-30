import { jsonStringify } from "./json.ts";

describe("jsonStringify", () => {
  it("returns empty string and logs error for circular reference", () => {
    expect.hasAssertions();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const consoleSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
    expect(jsonStringify(circular)).toBe("");
    expect(consoleSpy).toHaveBeenCalledWith("Failed to stringify JSON :", expect.any(TypeError));
  });
});
