import { Dexie, type Table } from "dexie";
import type { AppData } from "../schemas/index.ts";

export type AppDataRecord = {
  data: AppData;
  id: number;
};

export class AppDataDb extends Dexie {
  public appdata!: Table<AppDataRecord>;

  public constructor() {
    super("invest-app");
    this.version(1).stores({ appdata: "id" });
  }
}

export const db = new AppDataDb();
