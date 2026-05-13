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
import { computeDataScore, type Allocation, type Asset, type PortfolioEntry } from "../schemas/index.ts";
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

// oxlint-disable-next-line max-lines-per-function
function usePortfolioData(portfolioId: string) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const entries = useMemo(() => portfolio?.entries ?? [], [portfolio]);
  const portfolioAssets = useMemo(() => (portfolio?.entries ?? []).map(entry => assets.find(ast => ast.isin === entry.isin)).filter((ast): ast is Asset => ast !== undefined), [assets, portfolio]);
  const amountMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.amount])), [portfolio]);
  const targetAmountMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.targetAmount])), [portfolio]);
  const amountUpdatedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of portfolio?.entries ?? []) if (entry.amountUpdatedAt !== undefined) map.set(entry.isin, entry.amountUpdatedAt);
    return map;
  }, [portfolio]);
  const targetAmountUpdatedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of portfolio?.entries ?? []) if (entry.targetAmountUpdatedAt !== undefined) map.set(entry.isin, entry.targetAmountUpdatedAt);
    return map;
  }, [portfolio]);
  const totalValue = useTotalValue(entries, assets);
  const portfolioAllocations = useMemo(() => computePortfolioWeightedAllocations(entries, assets, totalValue), [entries, assets, totalValue]);
  const targetTotalValue = useMemo(() => {
    let total = 0;
    for (const entry of entries) {
      const asset = assets.find(data => data.isin === entry.isin);
      total += entry.targetAmount * (asset?.price ?? 0);
    }
    return total;
  }, [entries, assets]);
  const targetAllocations = useMemo(() => {
    const targetEntries = entries.map(entry => ({ ...entry, amount: entry.targetAmount }));
    return computePortfolioWeightedAllocations(targetEntries, assets, targetTotalValue);
  }, [entries, assets, targetTotalValue]);
  const averageDataScore = useMemo(() => computeAveragePortfolioDataScore(entries, assets), [assets, entries]);
  const averageDataScoreColor = useMemo(() => getAverageDataScoreColor(averageDataScore), [averageDataScore]);
  const headerMetrics = useMemo(
    () =>
      [
        { color: "info" as const, label: "Total Value", value: formatPrice(totalValue) },
        { color: averageDataScoreColor, label: "Average Data Score", value: averageDataScore === undefined ? undefined : `${averageDataScore}%` },
      ] satisfies MetricItem[],
    [averageDataScore, averageDataScoreColor, totalValue],
  );
  const noteMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.notes])), [portfolio]);
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
    <div className="mt-6 flex gap-4 p-4">
      <AllocationChart data={portfolioAllocations.geo} title="Actual geography" name="portfolio-geo" />
      <AllocationChart data={targetAllocations.geo} title="Target geography" name="target-geo" />
      <div className="grow" />
      <AllocationChart data={portfolioAllocations.sector} title="Actual sectors" name="portfolio-sector" />
      <AllocationChart data={targetAllocations.sector} title="Target sectors" name="target-sector" />
    </div>
  );
}

function useTotalValue(entries: PortfolioEntry[], assets: Asset[]) {
  return useMemo(() => {
    let total = 0;
    for (const entry of entries) {
      const asset = assets.find(data => data.isin === entry.isin);
      total += entry.amount * (asset?.price ?? 0);
    }
    return total;
  }, [entries, assets]);
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
    <>
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
      {(config.totalValue > 0 || config.targetTotalValue > 0) && renderAllocationCharts(config.portfolioAllocations, config.targetAllocations)}
    </>
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
    <div className="flex flex-col">
      <PageHeader title={name} subtitle={`Broker : ${broker}`} assets={portfolioAssets} metrics={headerMetrics} actions={actions} />
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
