import { invariant } from "es-toolkit";
import { CheckIcon, ListIcon, PencilLineIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AssetPickerModal } from "../components/asset-picker-modal.tsx";
import { AssetTable } from "../components/asset-table.tsx";
import type { MetricItem } from "../components/metric.tsx";
import { ModalActions } from "../components/modal-actions.tsx";
import { ModalHeader } from "../components/modal-header.tsx";
import { PageHeader } from "../components/page-header.tsx";
import { computeDataScore, type Asset, type PortfolioEntry } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isinToDelete, setIsinToDelete] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const selectedIsins = useMemo(() => new Set(entries.map(entry => entry.isin)), [entries]);
  const onPriceChange = useCallback((isin: string, price: number) => {
    useAppStore.getState().updateAssetPrice(isin, price);
  }, []);
  const onAmountChange = useCallback((isin: string, amount: number) => updatePortfolioEntryAmount(portfolioId, isin, amount), [portfolioId, updatePortfolioEntryAmount]);
  const onNoteChange = useCallback((isin: string, note: string) => updatePortfolioEntryNote(portfolioId, isin, note), [portfolioId, updatePortfolioEntryNote]);
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
  return { actions, handleConfirmDelete, handlePickerConfirm, isEditing, isinToDelete, onAmountChange, onNoteChange, onPriceChange, pickerOpen, selectedIsins, setIsinToDelete, setPickerOpen };
}

function usePortfolioData(portfolioId: string) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const entries = useMemo(() => portfolio?.entries ?? [], [portfolio]);
  const portfolioAssets = useMemo(() => (portfolio?.entries ?? []).map(entry => assets.find(ast => ast.isin === entry.isin)).filter((ast): ast is Asset => ast !== undefined), [assets, portfolio]);
  const amountMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.amount])), [portfolio]);
  const amountUpdatedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of portfolio?.entries ?? []) if (entry.amountUpdatedAt !== undefined) map.set(entry.isin, entry.amountUpdatedAt);
    return map;
  }, [portfolio]);
  const totalValue = useTotalValue(entries, assets);
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
  return { amountMap, amountUpdatedAtMap, assets, dismissSimilarity, entries, headerMetrics, noteMap, portfolio, portfolioAssets };
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

type Props = {
  portfolioId: string;
};

export function PortfolioPage({ portfolioId }: Props) {
  const { amountMap, amountUpdatedAtMap, assets, dismissSimilarity, entries, headerMetrics, noteMap, portfolio, portfolioAssets } = usePortfolioData(portfolioId);
  const { actions, handleConfirmDelete, handlePickerConfirm, isEditing, isinToDelete, onAmountChange, onNoteChange, onPriceChange, pickerOpen, selectedIsins, setIsinToDelete, setPickerOpen } = usePortfolioActions(portfolioId, entries);

  if (!portfolio) return renderNotFound();
  const { broker, name } = portfolio;
  const assetToDelete = isinToDelete === undefined ? undefined : assets.find(asset => asset.isin === isinToDelete);

  return (
    <div className="flex flex-col">
      <PageHeader title={name} subtitle={`Broker : ${broker}`} assets={portfolioAssets} metrics={headerMetrics} actions={actions} />
      {portfolioAssets.length === 0 ? (
        renderNoAssets()
      ) : (
        <AssetTable
          assets={portfolioAssets}
          onRemoveAsset={setIsinToDelete}
          onAmountChange={onAmountChange}
          onDismissSimilarity={dismissSimilarity}
          onPriceChange={onPriceChange}
          onNoteChange={onNoteChange}
          amountMap={amountMap}
          amountUpdatedAtMap={amountUpdatedAtMap}
          noteMap={noteMap}
          isEditing={isEditing}
        />
      )}
      {pickerOpen && <AssetPickerModal assets={assets} initialSelected={selectedIsins} onCancel={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} title={`${name} portfolio assets`} />}
      {isinToDelete !== undefined &&
        renderDeleteConfirmModal({
          assetName: assetToDelete?.name ?? isinToDelete,
          onCancel: () => setIsinToDelete(undefined),
          onConfirm: handleConfirmDelete,
        })}
    </div>
  );
}
