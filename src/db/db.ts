import { Dexie, type Table } from "dexie";
import type { AppData } from "../schemas/index.ts";

export type AppDataRecord = {
  data: AppData;
  id: number;
};

const DB_VERSION = 2;

export class AppDataDb extends Dexie {
  public appdata!: Table<AppDataRecord>;

  public constructor() {
    super("invest-app");
    this.version(1).stores({ appdata: "id" });
    this.version(DB_VERSION)
      .stores({ appdata: "id" })
      .upgrade(tx =>
        tx
          .table("appdata")
          .toCollection()
          .modify(record => {
            const raw = record.data as Record<string, unknown>;
            if ("isins" in raw && !("assets" in raw)) {
              raw.assets = raw.isins;
              delete raw.isins;
            }
          }),
      );
  }
}

export const db = new AppDataDb();
