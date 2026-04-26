import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { SettingsSchema, type AppData, type Portfolio, type PortfolioEntry, type Settings } from "../schemas/index.ts";

const defaultSettings: Settings = SettingsSchema.parse({});

export const defaultAppData: AppData = {
  assets: [],
  portfolios: [],
  settings: defaultSettings,
};

type AppStore = {
  addPortfolio: (portfolio: Portfolio) => void;
  data: AppData;
  deletePortfolio: (id: string) => void;
  isLoading: boolean;
  loadData: (data: AppData) => void;
  loadError: Error | undefined;
  setColumnOrder: (order: string[]) => void;
  setColumnVisibility: (cv: Record<string, boolean>) => void;
  setLastExportedAt: (date: string) => void;
  setLoadError: (error: Error) => void;
  setPortfolioAssets: (portfolioId: string, entries: PortfolioEntry[]) => void;
  setSort: (sort: Settings["sort"]) => void;
  updatePortfolio: (id: string, patch: Partial<Pick<Portfolio, "name" | "broker">>) => void;
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(set => ({
    addPortfolio: portfolio =>
      set(state => ({
        data: { ...state.data, portfolios: [...state.data.portfolios, portfolio] },
      })),
    data: defaultAppData,
    deletePortfolio: id =>
      set(state => ({
        data: { ...state.data, portfolios: state.data.portfolios.filter(portfolio => portfolio.id !== id) },
      })),
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
    setPortfolioAssets: (portfolioId, entries) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: state.data.portfolios.map(portfolio => (portfolio.id === portfolioId ? { ...portfolio, entries } : portfolio)),
        },
      })),
    setSort: sort =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, sort } },
      })),
    updatePortfolio: (id, patch) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: state.data.portfolios.map(portfolio => (portfolio.id === id ? { ...portfolio, ...patch } : portfolio)),
        },
      })),
  })),
);
