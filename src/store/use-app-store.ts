import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type AppData, type Settings, SettingsSchema } from "../schemas/index.ts";

const defaultSettings: Settings = SettingsSchema.parse({});

export const defaultAppData: AppData = {
  assets: [],
  portfolios: [],
  settings: defaultSettings,
};

type AppStore = {
  data: AppData;
  isLoading: boolean;
  loadError: Error | undefined;
  loadData: (data: AppData) => void;
  setSort: (sort: Settings["sort"]) => void;
  setColumnVisibility: (cv: Record<string, boolean>) => void;
  setColumnOrder: (order: string[]) => void;
  setLastExportedAt: (date: string) => void;
  setLoadError: (error: Error) => void;
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(set => ({
    data: defaultAppData,
    isLoading: true,
    loadData: data => set({ data, isLoading: false, loadError: undefined }),
    loadError: undefined,
    setColumnOrder: columnOrder =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, columnOrder } },
      })),
    setColumnVisibility: columnVisibility =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, columnVisibility } },
      })),
    setLastExportedAt: lastExportedAt =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, lastExportedAt } },
      })),
    setLoadError: loadError => set({ isLoading: false, loadError }),
    setSort: sort =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, sort } },
      })),
  })),
);
