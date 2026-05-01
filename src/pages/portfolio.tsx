import { invariant } from "es-toolkit";
import { CheckIcon, ListIcon, PencilLineIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetPickerModal } from "../components/asset-picker-modal.tsx";
import { formatPrice } from "../components/asset-table-utils.ts";
import { AssetTable } from "../components/asset-table.tsx";
import { ModalActions } from "../components/modal-actions.tsx";
import { ModalHeader } from "../components/modal-header.tsx";
import { PageHeader } from "../components/page-header.tsx";
import type { Asset, PortfolioEntry } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";

function usePriceEditing() {
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const onPriceChange = useMemo(() => (isPriceEditing ? (isin: string, price: number) => useAppStore.getState().updateAssetPrice(isin, price) : undefined), [isPriceEditing]);
  return { isPriceEditing, onPriceChange, setIsPriceEditing };
}

function usePortfolioData(portfolioId: string) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const portfolioAssets = useMemo(() => (portfolio?.entries ?? []).map(entry => assets.find(ast => ast.isin === entry.isin)).filter((ast): ast is Asset => ast !== undefined), [assets, portfolio]);
  const amountMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.amount])), [portfolio]);
  const totalValue = useTotalValue(portfolio?.entries ?? [], assets);
  const headerMetrics = useMemo(() => [{ color: "success" as const, label: "Total Value", value: formatPrice(totalValue) }], [totalValue]);
  return { amountMap, assets, headerMetrics, portfolio, portfolioAssets };
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
        <ModalHeader title="Remove asset" onClose={onCancel} type="danger" />
        Remove <span className="font-semibold">{assetName}</span> from this portfolio ? This cannot be undone.
        <ModalActions onCancel={onCancel} onConfirm={onConfirm} confirmText="Remove" type="danger" />
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
  const { amountMap, assets, headerMetrics, portfolio, portfolioAssets } = usePortfolioData(portfolioId);
  const setPortfolioAssets = useAppStore(state => state.setPortfolioAssets);
  const updatePortfolioEntryAmount = useAppStore(state => state.updatePortfolioEntryAmount);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isinToDelete, setIsinToDelete] = useState<string | undefined>(undefined);
  const { isPriceEditing, onPriceChange, setIsPriceEditing } = usePriceEditing();
  const actions = useMemo(
    () => [
      { icon: <ListIcon size={16} />, label: "Select assets", onClick: () => setPickerOpen(true) },
      { icon: isPriceEditing ? <CheckIcon size={16} /> : <PencilLineIcon size={16} />, label: isPriceEditing ? "Set prices" : "Edit prices", onClick: () => setIsPriceEditing(prev => !prev) },
    ],
    [isPriceEditing, setIsPriceEditing],
  );

  if (!portfolio) return renderNotFound();
  const { broker, entries, name } = portfolio;
  const selectedIsins = new Set(entries.map(entry => entry.isin));

  function handlePickerConfirm(newIsins: string[]) {
    setPortfolioAssets(portfolioId, buildEntries(newIsins, entries));
    setPickerOpen(false);
  }

  function handleConfirmDelete() {
    invariant(isinToDelete, "Expected isinToDelete to be set when confirming delete");
    setPortfolioAssets(portfolioId, removeEntry(entries, isinToDelete));
    setIsinToDelete(undefined);
  }

  const assetToDelete = isinToDelete === undefined ? undefined : assets.find(asset => asset.isin === isinToDelete);

  return (
    <div className="flex flex-col">
      <PageHeader title={name} subtitle={`Broker : ${broker}`} assets={portfolioAssets} metrics={headerMetrics} actions={actions} />
      {portfolioAssets.length === 0 ? (
        renderNoAssets()
      ) : (
        <AssetTable assets={portfolioAssets} onRemoveAsset={setIsinToDelete} onAmountChange={(isin, amount) => updatePortfolioEntryAmount(portfolioId, isin, amount)} onPriceChange={onPriceChange} amountMap={amountMap} />
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
