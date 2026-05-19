// oxlint-disable max-lines
import { invariant } from "es-toolkit";
import { CheckIcon, ListIcon, PencilLineIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AssetPickerModal } from "../components/asset-picker-modal.tsx";
import { AssetTable } from "../components/asset-table.tsx";
import { AllocationChart } from "../components/charts/allocation.tsx";
import type { MetricItem } from "../components/metric.tsx";
import { ModalActions } from "../components/modal-actions.tsx";
import { ModalHeader } from "../components/modal-header.tsx";
import { PageHeader } from "../components/page-header.tsx";
import { computeDataScore, computeScore, type Allocation, type Asset, type PortfolioEntry } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { computePortfolioWeightedAllocations } from "../utils/allocation-charts.ts";
import { maxPercentage } from "../utils/constants.ts";
import { formatPrice } from "../utils/format-numbers.ts";

const dataScoreHeaderWarnThreshold = 95;

function computeAveragePortfolioDataScore(entries: PortfolioEntry[], assets: Asset[]): number | undefined {
  if (entries.length === 0) return undefined;

  const assetByIsin = new Map(assets.map(asset => [asset.isin, asset]));
  let totalScore = 0;
  let count = 0;

  for (const entry of entries) {
    const asset = assetByIsin.get(entry.isin);
    if (asset === undefined) continue;
    totalScore += computeDataScore(asset, entry);
    count += 1;
  }

  if (count === 0) return undefined;
  return Math.round(totalScore / count);
}

function getAverageDataScoreColor(averageDataScore: number | undefined): MetricItem["color"] {
  if (averageDataScore === undefined || averageDataScore === maxPercentage) return "success" as const;
  if (averageDataScore > dataScoreHeaderWarnThreshold) return "warning" as const;
  return "error" as const;
}

function computeAverageScore(assets: Asset[]): number | undefined {
  const scores = assets.map(asset => computeScore(asset)).filter((score): score is number => score !== undefined);
  if (scores.length === 0) return undefined;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function computePerformer(assets: Asset[]): string | undefined {
  let topAsset: Asset | undefined = undefined;
  let topScore = Number.NEGATIVE_INFINITY;
  for (const asset of assets) {
    const score = computeScore(asset);
    if (score === undefined || score <= topScore) continue;
    topScore = score;
    topAsset = asset;
  }
  return topAsset ? (topAsset.tickers[0] ?? topAsset.isin) : undefined;
}

function usePortfolioActions(portfolioId: string, entries: PortfolioEntry[]) {
  const setPortfolioAssets = useAppStore(state => state.setPortfolioAssets);
  const updatePortfolioEntryAmount = useAppStore(state => state.updatePortfolioEntryAmount);
  const updatePortfolioEntryNote = useAppStore(state => state.updatePortfolioEntryNote);
  const updatePortfolioEntryTargetAmount = useAppStore(state => state.updatePortfolioEntryTargetAmount);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isinToDelete, setIsinToDelete] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const selectedIsins = useMemo(() => new Set(entries.map(entry => entry.isin)), [entries]);
  const onPriceChange = useCallback((isin: string, price: number) => {
    useAppStore.getState().updateAssetPrice(isin, price);
  }, []);
  const onAmountChange = useCallback((isin: string, amount: number) => updatePortfolioEntryAmount(portfolioId, isin, amount), [portfolioId, updatePortfolioEntryAmount]);
  const onNoteChange = useCallback((isin: string, note: string) => updatePortfolioEntryNote(portfolioId, isin, note), [portfolioId, updatePortfolioEntryNote]);
  const onTargetAmountChange = useCallback((isin: string, targetAmount: number) => updatePortfolioEntryTargetAmount(portfolioId, isin, targetAmount), [portfolioId, updatePortfolioEntryTargetAmount]);
  const actions = useMemo(
    () => [
      { icon: <ListIcon size={16} />, label: "Select assets", onClick: () => setPickerOpen(true) },
      { icon: isEditing ? <CheckIcon size={16} /> : <PencilLineIcon size={16} />, label: isEditing ? "Done" : "Edit", onClick: () => setIsEditing(prev => !prev) },
    ],
    [isEditing],
  );
  function handlePickerConfirm(newIsins: string[]) {
    setPortfolioAssets(portfolioId, buildEntries(newIsins, entries));
    setPickerOpen(false);
  }
  function handleConfirmDelete() {
    invariant(isinToDelete, "Expected isinToDelete to be set when confirming delete");
    setPortfolioAssets(portfolioId, removeEntry(entries, isinToDelete));
    setIsinToDelete(undefined);
  }
  return { actions, handleConfirmDelete, handlePickerConfirm, isEditing, isinToDelete, onAmountChange, onNoteChange, onPriceChange, onTargetAmountChange, pickerOpen, selectedIsins, setIsinToDelete, setPickerOpen };
}

function usePortfolioAssets(entries: PortfolioEntry[], assets: Asset[]) {
  const assetByIsin = useMemo(() => new Map(assets.map(asset => [asset.isin, asset])), [assets]);
  const portfolioAssets = useMemo(() => entries.map(entry => assetByIsin.get(entry.isin)).filter((asset): asset is Asset => asset !== undefined), [assetByIsin, entries]);
  return { assetByIsin, portfolioAssets };
}

function useEntryMaps(entries: PortfolioEntry[]) {
  const amountMap = useMemo(() => new Map(entries.map(entry => [entry.isin, entry.amount])), [entries]);
  const targetAmountMap = useMemo(() => new Map(entries.map(entry => [entry.isin, entry.targetAmount])), [entries]);
  const amountUpdatedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) if (entry.amountUpdatedAt !== undefined) map.set(entry.isin, entry.amountUpdatedAt);
    return map;
  }, [entries]);
  const targetAmountUpdatedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) if (entry.targetAmountUpdatedAt !== undefined) map.set(entry.isin, entry.targetAmountUpdatedAt);
    return map;
  }, [entries]);
  const noteMap = useMemo(() => new Map(entries.map(entry => [entry.isin, entry.notes])), [entries]);
  return { amountMap, amountUpdatedAtMap, noteMap, targetAmountMap, targetAmountUpdatedAtMap };
}

function useTargetTotalValue(entries: PortfolioEntry[], assetByIsin: Map<string, Asset>) {
  return useMemo(() => {
    let total = 0;
    for (const entry of entries) total += entry.targetAmount * (assetByIsin.get(entry.isin)?.price ?? 0);
    return total;
  }, [assetByIsin, entries]);
}

function useAllocations(config: { entries: PortfolioEntry[]; assets: Asset[]; totalValue: number; targetTotalValue: number }) {
  const { assets, entries, targetTotalValue, totalValue } = config;
  const portfolioAllocations = useMemo(() => computePortfolioWeightedAllocations(entries, assets, totalValue), [assets, entries, totalValue]);
  const targetAllocations = useMemo(() => {
    const targetEntries = entries.map(entry => ({ ...entry, amount: entry.targetAmount }));
    return computePortfolioWeightedAllocations(targetEntries, assets, targetTotalValue);
  }, [assets, entries, targetTotalValue]);
  return { portfolioAllocations, targetAllocations };
}

function useHeaderMetrics(config: { entries: PortfolioEntry[]; portfolioAssets: Asset[]; totalValue: number; targetTotalValue: number }) {
  const { entries, portfolioAssets, targetTotalValue, totalValue } = config;
  const averageDataScore = useMemo(() => computeAveragePortfolioDataScore(entries, portfolioAssets), [entries, portfolioAssets]);
  const averageDataScoreColor = useMemo(() => getAverageDataScoreColor(averageDataScore), [averageDataScore]);
  const averageScore = useMemo(() => computeAverageScore(portfolioAssets), [portfolioAssets]);
  const performer = useMemo(() => computePerformer(portfolioAssets), [portfolioAssets]);

  return useMemo(() => {
    const targetAssets = entries.filter(entry => entry.targetAmount > 0).length;
    const showTargetAssetsMetric = portfolioAssets.length !== targetAssets;
    const baseMetrics = [
      { color: "neutral" as const, label: "Avg Score", value: averageScore },
      { color: averageDataScoreColor, label: "Avg Data", value: averageDataScore === undefined ? undefined : `${averageDataScore}%` },
      { color: "success" as const, label: "Performer", value: performer },
      { color: "info" as const, label: "Nb Assets", value: portfolioAssets.length.toFixed(0) },
      { color: "info" as const, label: "Total Value", value: formatPrice(totalValue) },
    ] satisfies MetricItem[];

    if (targetAssets === 0) return baseMetrics;
    return [
      ...baseMetrics,
      ...(showTargetAssetsMetric ? [{ color: "warning" as const, label: "Target Assets", value: targetAssets.toFixed(0) }] : []),
      { color: "warning" as const, label: "Target Invest", value: formatPrice(targetTotalValue - totalValue) },
    ] satisfies MetricItem[];
  }, [averageDataScore, averageDataScoreColor, averageScore, entries, performer, portfolioAssets.length, targetTotalValue, totalValue]);
}

function usePortfolioData(portfolioId: string) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const entries = useMemo(() => portfolio?.entries ?? [], [portfolio]);
  const { assetByIsin, portfolioAssets } = usePortfolioAssets(entries, assets);
  const { amountMap, amountUpdatedAtMap, noteMap, targetAmountMap, targetAmountUpdatedAtMap } = useEntryMaps(entries);
  const totalValue = useTotalValue(entries, assetByIsin);
  const targetTotalValue = useTargetTotalValue(entries, assetByIsin);
  const { portfolioAllocations, targetAllocations } = useAllocations({ assets, entries, targetTotalValue, totalValue });
  const headerMetrics = useHeaderMetrics({ entries, portfolioAssets, targetTotalValue, totalValue });
  const dismissSimilarity = useAppStore(state => state.dismissSimilarity);
  return {
    amountMap,
    amountUpdatedAtMap,
    assets,
    dismissSimilarity,
    entries,
    headerMetrics,
    noteMap,
    portfolio,
    portfolioAllocations,
    portfolioAssets,
    targetAllocations,
    targetAmountMap,
    targetAmountUpdatedAtMap,
    targetTotalValue,
    totalValue,
  };
}
function buildEntries(selectedIsins: string[], existingEntries: PortfolioEntry[]): PortfolioEntry[] {
  return selectedIsins.map(isin => {
    const existing = existingEntries.find(entry => entry.isin === isin);
    return existing ?? { amount: 0, inPEA: false, isin, notes: "", positionValue: 0, targetAmount: 0 };
  });
}

function removeEntry(entries: PortfolioEntry[], isin: string): PortfolioEntry[] {
  return entries.filter(en => en.isin !== isin);
}
function renderNoAssets() {
  return (
    <div className="p-8 text-center">
      <p className="mb-4 text-4xl">📂</p>
      <h2 data-testid="no-assets-message" className="mb-2 text-lg font-semibold">
        No assets yet
      </h2>
      <p className="mb-4 text-base-content/60">
        Click <strong className="text-primary">Select assets</strong> to add instruments to this portfolio.
      </p>
    </div>
  );
}

function renderNotFound() {
  return (
    <div className="p-8 text-center">
      <p data-testid="not-found" className="text-base-content/60">
        Portfolio not found.
      </p>
    </div>
  );
}

type RenderDeleteConfirmModalOptions = {
  assetName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function renderDeleteConfirmModal({ assetName, onCancel, onConfirm }: RenderDeleteConfirmModalOptions) {
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box">
        <ModalHeader title="Remove asset" onClose={onCancel} type="error" />
        Remove{" "}
        <span data-testid="modal-asset-name" className="font-semibold">
          {assetName}
        </span>{" "}
        from this portfolio? This cannot be undone.
        <ModalActions onCancel={onCancel} onConfirm={onConfirm} confirmText="Remove" type="error" />
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}

function renderAllocationCharts(portfolioAllocations: { geo: Allocation; sector: Allocation }, targetAllocations: { geo: Allocation; sector: Allocation }) {
  return (
    <div className="p-4">
      <hr />
      <div data-testid="allocation-charts" className="flex h-72 justify-evenly gap-4 p-4">
        <AllocationChart data={portfolioAllocations.geo} title="Actual geography" name="portfolio-geo" />
        <AllocationChart data={targetAllocations.geo} title="Target geography" name="target-geo" />
        <AllocationChart data={portfolioAllocations.sector} title="Actual sectors" name="portfolio-sector" />
        <AllocationChart data={targetAllocations.sector} title="Target sectors" name="target-sector" />
      </div>
    </div>
  );
}

function useTotalValue(entries: PortfolioEntry[], assetByIsin: Map<string, Asset>) {
  return useMemo(() => {
    let total = 0;
    for (const entry of entries) total += entry.amount * (assetByIsin.get(entry.isin)?.price ?? 0);
    return total;
  }, [assetByIsin, entries]);
}

function renderAssetTableSection(
  portfolioAssets: Asset[],
  setIsinToDelete: (isin: string | undefined) => void,
  config: {
    handlers: {
      onAmountChange: (isin: string, amount: number) => void;
      onDismissSimilarity: (isin: string, matchedIsin: string) => void;
      onNoteChange: (isin: string, note: string) => void;
      onPriceChange: (isin: string, price: number) => void;
      onTargetAmountChange: (isin: string, targetAmount: number) => void;
    };
    maps: {
      amountMap?: Map<string, number>;
      amountUpdatedAtMap?: Map<string, string>;
      noteMap?: Map<string, string>;
      targetAmountMap?: Map<string, number>;
      targetAmountUpdatedAtMap?: Map<string, string>;
    };
    isEditing: boolean;
    portfolioAllocations: { geo: Allocation; sector: Allocation };
    targetAllocations: { geo: Allocation; sector: Allocation };
    targetTotalValue: number;
    totalValue: number;
  },
) {
  return (
    <div className="flex grow flex-col">
      <div className={config.totalValue > 0 || config.targetTotalValue > 0 ? "flex max-h-[calc(100dvh-37rem)] grow overflow-y-auto" : undefined}>
        <AssetTable
          assets={portfolioAssets}
          onRemoveAsset={setIsinToDelete}
          onAmountChange={config.handlers.onAmountChange}
          onDismissSimilarity={config.handlers.onDismissSimilarity}
          onPriceChange={config.handlers.onPriceChange}
          onNoteChange={config.handlers.onNoteChange}
          onTargetAmountChange={config.handlers.onTargetAmountChange}
          amountMap={config.maps.amountMap}
          amountUpdatedAtMap={config.maps.amountUpdatedAtMap}
          noteMap={config.maps.noteMap}
          targetAmountMap={config.maps.targetAmountMap}
          targetAmountUpdatedAtMap={config.maps.targetAmountUpdatedAtMap}
          isEditing={config.isEditing}
          targetTotalValue={config.targetTotalValue}
          totalValue={config.totalValue}
        />
      </div>
      {(config.totalValue > 0 || config.targetTotalValue > 0) && renderAllocationCharts(config.portfolioAllocations, config.targetAllocations)}
    </div>
  );
}

type Props = {
  portfolioId: string;
};

// oxlint-disable-next-line max-lines-per-function
export function PortfolioPage({ portfolioId }: Props) {
  const {
    amountMap,
    amountUpdatedAtMap,
    assets,
    dismissSimilarity,
    entries,
    headerMetrics,
    noteMap,
    portfolio,
    portfolioAllocations,
    portfolioAssets,
    targetAllocations,
    targetAmountMap,
    targetAmountUpdatedAtMap,
    targetTotalValue,
    totalValue,
  } = usePortfolioData(portfolioId);
  const { actions, handleConfirmDelete, handlePickerConfirm, isEditing, isinToDelete, onAmountChange, onNoteChange, onPriceChange, onTargetAmountChange, pickerOpen, selectedIsins, setIsinToDelete, setPickerOpen } = usePortfolioActions(
    portfolioId,
    entries,
  );

  if (!portfolio) return renderNotFound();
  const { broker, name } = portfolio;
  const assetToDelete = isinToDelete === undefined ? undefined : assets.find(asset => asset.isin === isinToDelete);

  return (
    <div className="flex grow flex-col">
      <PageHeader title={name} subtitle={`Broker : ${broker}`} assets={portfolioAssets} metrics={headerMetrics} replaceDefaultMetrics actions={actions} />
      {portfolioAssets.length === 0
        ? renderNoAssets()
        : renderAssetTableSection(portfolioAssets, setIsinToDelete, {
            handlers: {
              onAmountChange,
              onDismissSimilarity: dismissSimilarity,
              onNoteChange,
              onPriceChange,
              onTargetAmountChange,
            },
            isEditing,
            maps: {
              amountMap,
              amountUpdatedAtMap,
              noteMap,
              targetAmountMap,
              targetAmountUpdatedAtMap,
            },
            portfolioAllocations,
            targetAllocations,
            targetTotalValue,
            totalValue,
          })}
      {pickerOpen && <AssetPickerModal assets={assets} initialSelected={selectedIsins} amountByIsin={amountMap} onCancel={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} title={`${name} portfolio assets`} />}
      {isinToDelete !== undefined &&
        renderDeleteConfirmModal({
          assetName: assetToDelete?.name ?? isinToDelete,
          onCancel: () => setIsinToDelete(undefined),
          onConfirm: handleConfirmDelete,
        })}
    </div>
  );
}
