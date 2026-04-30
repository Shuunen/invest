import { useEffect } from "react";
import sampleJson from "../../data/sample.json";
import { db } from "../db/db.ts";
import { AppDataSchema, type AppData } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";

const DEBOUNCE_MS = 300;
const seedResult = AppDataSchema.safeParse(sampleJson);
/* v8 ignore next -- sample.json is always valid; the false branch is unreachable */
export const seedData: AppData = seedResult.success ? seedResult.data : { ...defaultAppData };

export function useHydration(retryKey: number) {
  useEffect(() => {
    let cancelled = false;
    if (useAppStore.getState().isLoading) {
      const load = async () => {
        try {
          const record = await db.appdata.get(1);
          if (cancelled) return;
          const raw = record?.data ?? seedData;
          useAppStore.getState().loadData(AppDataSchema.parse(raw));
        } catch (error: unknown) {
          /* v8 ignore next 2 -- cancelled=true on unmount-during-error and non-Error throws are defensive */
          if (!cancelled) {
            const err = error instanceof Error ? error : new Error(String(error));
            useAppStore.getState().setLoadError(err);
          }
        }
      };
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [retryKey]);
}

export function useDexieSync() {
  useEffect(() => {
    let writeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    const unsubscribe = useAppStore.subscribe(
      state => state.data,
      newData => {
        clearTimeout(writeTimer);
        writeTimer = setTimeout(() => {
          const save = async () => {
            try {
              await db.appdata.put({ data: newData, id: 1 });
            } catch {
              // Silently ignore: write failure is non-critical (in-memory state stays correct)
            }
          };
          void save();
        }, DEBOUNCE_MS);
      },
    );
    return () => {
      unsubscribe();
      clearTimeout(writeTimer);
    };
  }, []);
}
