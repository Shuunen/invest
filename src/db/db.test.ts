import { AppDataSchema } from "../schemas/index.ts";
import { type AppDataRecord, db } from "./db.ts";

describe("AppDataDb", () => {
  it("returns undefined for missing record", async () => {
    await db.delete();
    await db.open();
    const record = await db.appdata.get(1);
    expect(record).toBeUndefined();
  });

  it("stores and retrieves AppData", async () => {
    await db.delete();
    await db.open();
    const result = AppDataSchema.safeParse({ isins: [], portfolios: [], settings: {} });
    expect(result.success).toBe(true);
    if (!result.success) return;
    await db.appdata.put({ data: result.data, id: 1 });
    const record = await db.appdata.get(1);
    expect(record?.data.isins).toHaveLength(0);
  });

  it("re-parsing through Zod catches corrupted data", async () => {
    await db.delete();
    await db.open();
    const malformed = { data: { isins: "not-an-array" }, id: 1 };
    await db.appdata.put(malformed as unknown as AppDataRecord);
    const record = await db.appdata.get(1);
    expect(() => AppDataSchema.parse(record?.data)).toThrow("expected array, received string");
  });

  it("handles Dexie open after delete", async () => {
    await db.delete();
    await db.open();
    const count = await db.appdata.count();
    expect(count).toBe(0);
  });
});
