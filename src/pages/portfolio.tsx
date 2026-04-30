import { invariant } from "es-toolkit";
import { SquarePenIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetPickerModal } from "../components/asset-picker-modal.tsx";
import { AssetTable } from "../components/asset-table.tsx";
import { ModalActions } from "../components/modal-actions.tsx";
import { ModalHeader } from "../components/modal-header.tsx";
import { PageHeader } from "../components/page-header.tsx";
import type { Asset, PortfolioEntry } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
function buildEntries(selectedIsins: string[], existingEntries: PortfolioEntry[]): PortfolioEntry[] {
  return selectedIsins.map(isin => {
    const existing = existingEntries.find(entry => entry.isin === isin);
    return existing ?? { amount: 0, inPEA: false, isin, notes: "", positionValue: 0, targetAmount: 0 };
  });
}

function removeEntry(entries: PortfolioEntry[], isin: string): PortfolioEntry[] {
  return entries.filter(en => en.isin !== isin);
}

type RenderHeaderOptions = {
  broker: string;
  assets: Asset[];
  name: string;
  onAddAssets: () => void;
};

function renderPortfolioHeader({ assets, broker, name, onAddAssets }: RenderHeaderOptions) {
  return (
    <PageHeader title={name} subtitle={`Broker : ${broker}`} assets={assets}>
      <button type="button" className="btn btn-soft btn-primary" onClick={onAddAssets}>
        Edit assets
        <SquarePenIcon size={16} />
      </button>
    </PageHeader>
  );
}

function renderNoAssets() {
  return (
    <div className="p-8 text-center">
      <p className="mb-4 text-4xl">📂</p>
      <h2 className="mb-2 text-lg font-semibold">No assets yet</h2>
      <p className="mb-4 text-base-content/60">
        Click <strong className="text-primary">Edit assets</strong> to add instruments to this portfolio.
      </p>
    </div>
  );
}

function renderNotFound() {
  return (
    <div className="p-8 text-center">
      <p className="text-base-content/60">Portfolio not found.</p>
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
        Remove <span className="font-semibold">{assetName}</span> from this portfolio? This cannot be undone.
        <ModalActions onCancel={onCancel} onConfirm={onConfirm} confirmText="Remove" type="danger" />
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}

type Props = {
  portfolioId: string;
};

export function PortfolioPage({ portfolioId }: Props) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const setPortfolioAssets = useAppStore(state => state.setPortfolioAssets);
  const updatePortfolioEntryAmount = useAppStore(state => state.updatePortfolioEntryAmount);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isinToDelete, setIsinToDelete] = useState<string | undefined>(undefined);
  const portfolioAssets = useMemo(() => (portfolio?.entries ?? []).map(entry => assets.find(ast => ast.isin === entry.isin)).filter((ast): ast is Asset => ast !== undefined), [assets, portfolio]);
  const amountMap = useMemo(() => new Map((portfolio?.entries ?? []).map(entry => [entry.isin, entry.amount])), [portfolio]);

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
      {renderPortfolioHeader({ assets: portfolioAssets, broker, name, onAddAssets: () => setPickerOpen(true) })}
      {portfolioAssets.length === 0 ? renderNoAssets() : <AssetTable assets={portfolioAssets} onRemoveAsset={setIsinToDelete} onAmountChange={(isin, amount) => updatePortfolioEntryAmount(portfolioId, isin, amount)} amountMap={amountMap} />}
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
