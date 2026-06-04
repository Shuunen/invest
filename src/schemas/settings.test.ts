import { jsonParse } from "../utils/json.ts";
import { themes } from "../utils/theme.ts";
import { SettingsSchema } from "./settings.ts";

describe("SettingsSchema", () => {
  it("coerces null lastExportedAt to undefined", () => {
    expect.hasAssertions();
    // JSON payloads use null for absent values; the schema must coerce to undefined
    const result = SettingsSchema.parse(jsonParse('{"lastExportedAt":null}'));
    expect(result.lastExportedAt).toBeUndefined();
  });
});

describe("SettingsSchema: datetime and range validation", () => {
  it("accepts a valid ISO datetime for lastExportedAt", () => {
    expect.hasAssertions();
    const result = SettingsSchema.parse({ lastExportedAt: "2024-01-15T12:00:00.000Z" });
    expect(result.lastExportedAt).toBe("2024-01-15T12:00:00.000Z");
  });

  it("rejects similarityThreshold below 0", () => {
    expect.hasAssertions();
    const result = SettingsSchema.safeParse({ similarityThreshold: -0.1 });
    expect(result.success).toBe(false);
  });

  it("rejects similarityThreshold above 1", () => {
    expect.hasAssertions();
    const result = SettingsSchema.safeParse({ similarityThreshold: 1.1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative editCount", () => {
    expect.hasAssertions();
    const result = SettingsSchema.safeParse({ editCount: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort direction", () => {
    expect.hasAssertions();
    const result = SettingsSchema.safeParse({ sort: { column: "name", direction: "up" } });
    expect(result.success).toBe(false);
  });
});

describe("SettingsSchema: default values", () => {
  it("applies scalar defaults when no fields supplied", () => {
    expect.hasAssertions();
    const result = SettingsSchema.parse({});
    expect(result.theme).toBe("light");
    expect(result.editCount).toBe(0);
    expect(result.similarityThreshold).toBe(0.85);
  });

  it("applies collection defaults when no fields supplied", () => {
    expect.hasAssertions();
    const result = SettingsSchema.parse({});
    expect(result.columnOrder).toStrictEqual([]);
    expect(result.columnVisibility).toStrictEqual({});
    expect(result.sort).toStrictEqual({ column: "score", direction: "desc" });
  });
});

describe("SettingsSchema: theme enum", () => {
  it("accepts all valid themes", () => {
    expect.hasAssertions();
    for (const themeName of themes) {
      const result = SettingsSchema.safeParse({ theme: themeName });
      expect(result.success).toBe(true);
    }
  });
});
