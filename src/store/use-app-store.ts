import { invariant } from "es-toolkit";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { maxIsins, maxPortfolios, SettingsSchema, type AppData, type Asset, type Portfolio, type PortfolioEntry, type Settings } from "../schemas/index.ts";

const defaultSettings: Settings = SettingsSchema.parse({});

function incrementEditCount(settings: Settings): Settings {
  return { ...settings, editCount: settings.editCount + 1 };
}

function patchPortfolioEntryAmount(portfolios: Portfolio[], { amount, isin, portfolioId }: { amount: number; isin: string; portfolioId: string }): Portfolio[] {
  const now = new Date().toISOString();
  return portfolios.map(portfolio => (portfolio.id === portfolioId ? { ...portfolio, entries: portfolio.entries.map(entry => (entry.isin === isin ? { ...entry, amount, amountUpdatedAt: now } : entry)) } : portfolio));
}

function patchPortfolioEntryNote(portfolios: Portfolio[], { isin, note, portfolioId }: { isin: string; note: string; portfolioId: string }): Portfolio[] {
  return portfolios.map(portfolio => (portfolio.id === portfolioId ? { ...portfolio, entries: portfolio.entries.map(entry => (entry.isin === isin ? { ...entry, notes: note } : entry)) } : portfolio));
}

function patchPortfolioEntryTargetAmount(portfolios: Portfolio[], { isin, portfolioId, targetAmount }: { isin: string; portfolioId: string; targetAmount: number }): Portfolio[] {
  return portfolios.map(portfolio => (portfolio.id === portfolioId ? { ...portfolio, entries: portfolio.entries.map(entry => (entry.isin === isin ? { ...entry, targetAmount } : entry)) } : portfolio));
}

export const defaultAppData: AppData = {
  assets: [],
  portfolios: [],
  settings: defaultSettings,
};

type AppStore = {
  addAsset: (asset: Asset) => void;
  addPortfolio: (portfolio: Portfolio) => void;
  data: AppData;
  deletePortfolio: (id: string) => void;
  dismissSimilarity: (isin: string, matchedIsin: string) => void;
  isLoading: boolean;
  loadData: (data: AppData) => void;
  loadError: Error | undefined;
  setColumnOrder: (order: string[]) => void;
  setColumnVisibility: (cv: Record<string, boolean>) => void;
  setEditCount: (count: number) => void;
  setLastExportedAt: (date: string) => void;
  setLoadError: (error: Error) => void;
  setPortfolioAssets: (portfolioId: string, entries: PortfolioEntry[]) => void;
  setSort: (sort: Settings["sort"]) => void;
  unDismissSimilarity: (isin: string, matchedIsin: string) => void;
  updateAsset: (isin: string, asset: Asset) => void;
  updateAssetPrice: (isin: string, price: number) => void;
  updatePortfolio: (id: string, patch: Partial<Pick<Portfolio, "name" | "broker">>) => void;
  updatePortfolioEntryAmount: (portfolioId: string, isin: string, amount: number) => void;
  updatePortfolioEntryNote: (portfolioId: string, isin: string, note: string) => void;
  updatePortfolioEntryTargetAmount: (portfolioId: string, isin: string, targetAmount: number) => void;
};

export const useAppStore = create<AppStore>()(
  // oxlint-disable-next-line max-lines-per-function
  subscribeWithSelector(set => ({
    addAsset: asset =>
      set(state => {
        if (state.data.assets.length >= maxIsins) return state;
        if (state.data.assets.some(existing => existing.isin === asset.isin)) return state;
        return {
          data: {
            ...state.data,
            assets: [...state.data.assets, { ...asset, updatedAt: new Date().toISOString() }],
            settings: incrementEditCount(state.data.settings),
          },
        };
      }),
    addPortfolio: portfolio =>
      set(state => {
        if (state.data.portfolios.length >= maxPortfolios) return state;
        return {
          data: {
            ...state.data,
            portfolios: [...state.data.portfolios, portfolio],
            settings: incrementEditCount(state.data.settings),
          },
        };
      }),
    data: defaultAppData,
    deletePortfolio: id =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: state.data.portfolios.filter(portfolio => portfolio.id !== id),
          settings: incrementEditCount(state.data.settings),
        },
      })),
    dismissSimilarity: (isin, matchedIsin) =>
      set(state => ({
        data: {
          ...state.data,
          assets: state.data.assets.map(asset => (asset.isin === isin && !asset.dismissedSimilarities.includes(matchedIsin) ? { ...asset, dismissedSimilarities: [...asset.dismissedSimilarities, matchedIsin] } : asset)),
          settings: incrementEditCount(state.data.settings),
        },
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
    setEditCount: editCount =>
      set(state => ({
        data: {
          ...state.data,
          settings: { ...state.data.settings, editCount: Math.max(0, Math.round(editCount)) },
        },
      })),
    setLastExportedAt: lastExportedAt =>
      set(state => ({
        data: {
          ...state.data,
          settings: { ...state.data.settings, editCount: 0, lastExportedAt },
        },
      })),
    setLoadError: loadError => set({ isLoading: false, loadError }),
    setPortfolioAssets: (portfolioId, entries) =>
      set(state => {
        const now = new Date().toISOString();
        return {
          data: {
            ...state.data,
            portfolios: state.data.portfolios.map(portfolio => (portfolio.id === portfolioId ? { ...portfolio, entries: entries.map(entry => (entry.amountUpdatedAt ? entry : { ...entry, amountUpdatedAt: now })) } : portfolio)),
            settings: incrementEditCount(state.data.settings),
          },
        };
      }),
    setSort: sort =>
      set(state => ({
        data: { ...state.data, settings: { ...state.data.settings, sort } },
      })),
    unDismissSimilarity: (isin, matchedIsin) =>
      set(state => ({
        data: {
          ...state.data,
          assets: state.data.assets.map(asset => (asset.isin === isin ? { ...asset, dismissedSimilarities: asset.dismissedSimilarities.filter(dismissed => dismissed !== matchedIsin) } : asset)),
          settings: incrementEditCount(state.data.settings),
        },
      })),
    updateAsset: (isin, asset) =>
      set(state => {
        if (!state.data.assets.some(data => data.isin === isin)) return state;
        const newIsin = asset.isin;
        const portfolios =
          isin === newIsin
            ? state.data.portfolios
            : state.data.portfolios.map(portfolio => ({
                ...portfolio,
                entries: portfolio.entries.map(entry => (entry.isin === isin ? { ...entry, isin: newIsin } : entry)),
              }));
        const assets =
          isin === newIsin
            ? state.data.assets.map(data => (data.isin === isin ? { ...asset, updatedAt: new Date().toISOString() } : data))
            : state.data.assets.map(data => {
                if (data.isin === isin) return { ...asset, updatedAt: new Date().toISOString() };
                if (!data.dismissedSimilarities.includes(isin)) return data;
                return { ...data, dismissedSimilarities: data.dismissedSimilarities.map(dismissed => (dismissed === isin ? newIsin : dismissed)) };
              });
        return {
          data: {
            ...state.data,
            assets,
            portfolios,
            settings: incrementEditCount(state.data.settings),
          },
        };
      }),
    updateAssetPrice: (isin, price) =>
      set(state => {
        const asset = state.data.assets.find(en => en.isin === isin);
        invariant(asset, `Asset ${isin} not found`);
        return {
          data: {
            ...state.data,
            assets: state.data.assets.map(data => (data.isin === isin ? { ...asset, price, updatedAt: new Date().toISOString() } : data)),
            settings: incrementEditCount(state.data.settings),
          },
        };
      }),
    updatePortfolio: (id, patch) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: state.data.portfolios.map(portfolio => (portfolio.id === id ? { ...portfolio, ...patch } : portfolio)),
          settings: incrementEditCount(state.data.settings),
        },
      })),
    updatePortfolioEntryAmount: (portfolioId, isin, amount) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: patchPortfolioEntryAmount(state.data.portfolios, { amount, isin, portfolioId }),
          settings: incrementEditCount(state.data.settings),
        },
      })),
    updatePortfolioEntryNote: (portfolioId, isin, note) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: patchPortfolioEntryNote(state.data.portfolios, { isin, note, portfolioId }),
          settings: incrementEditCount(state.data.settings),
        },
      })),
    updatePortfolioEntryTargetAmount: (portfolioId, isin, targetAmount) =>
      set(state => ({
        data: {
          ...state.data,
          portfolios: patchPortfolioEntryTargetAmount(state.data.portfolios, { isin, portfolioId, targetAmount }),
          settings: incrementEditCount(state.data.settings),
        },
      })),
  })),
);
