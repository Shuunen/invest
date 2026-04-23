import { invariant } from "es-toolkit";
import { SquarePenIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import type { Asset, PortfolioEntry } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetPickerModal } from "./asset-picker-modal.tsx";
import { AssetTable } from "./asset-table.tsx";

function buildEntries(selectedIsins: string[], existingEntries: PortfolioEntry[]): PortfolioEntry[] {
  return selectedIsins.map(isin => {
    const existing = existingEntries.find(entry => entry.isin === isin);
    return existing ?? { inPEA: false, isin, notes: "", positionValue: 0, targetAmount: 0 };
  });
}

function removeEntry(entries: PortfolioEntry[], isin: string): PortfolioEntry[] {
  return entries.filter(en => en.isin !== isin);
}

type RenderHeaderOptions = {
  broker: string;
  entryCount: number;
  name: string;
  onAddAssets: () => void;
};

function renderPortfolioHeader({ broker, entryCount, name, onAddAssets }: RenderHeaderOptions) {
  return (
    <div className="border-b border-base-200 bg-base-100 px-4 pt-5 pb-4">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          {broker && <p className="mt-0.5 text-sm text-base-content/60">Broker: {broker}</p>}
        </div>
        <button type="button" className="btn btn-soft btn-primary" onClick={onAddAssets}>
          Edit assets
          <SquarePenIcon size={16} />
        </button>
      </div>
      <p className="text-sm text-base-content/60">
        {entryCount} asset{entryCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function renderNoAssets() {
  return (
    <div className="p-8 text-center">
      <p className="mb-4 text-4xl">📂</p>
      <h2 className="mb-2 text-lg font-semibold">No assets yet</h2>
      <p className="mb-4 text-base-content/60">Click Add / Edit assets to add instruments to this portfolio.</p>
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
        <div className="mb-4 flex items-center gap-3 text-error">
          <Trash2Icon size={20} />
          <h3 className="text-lg font-bold">Remove asset</h3>
        </div>
        <p className="mb-6 text-base-content/80">
          Remove <span className="font-semibold">{assetName}</span> from this portfolio? This cannot be undone.
        </p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-outline btn-error" onClick={onConfirm}>
            Remove
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}

type Props = {
  portfolioId: string;
};

// oxlint-disable-next-line max-lines-per-function
export function PortfolioPage({ portfolioId }: Props) {
  const portfolio = useAppStore(state => state.data.portfolios.find(port => port.id === portfolioId));
  const assets = useAppStore(state => state.data.assets);
  const setPortfolioAssets = useAppStore(state => state.setPortfolioAssets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isinToDelete, setIsinToDelete] = useState<string | undefined>(undefined);
  const portfolioAssets = useMemo(
    () =>
      (portfolio?.entries ?? [])
        .map(entry => assets.find(ast => ast.isin === entry.isin))
        .filter((ast): ast is Asset => ast !== undefined),
    [assets, portfolio],
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
      {renderPortfolioHeader({ broker, entryCount: entries.length, name, onAddAssets: () => setPickerOpen(true) })}
      {portfolioAssets.length === 0 ? (
        renderNoAssets()
      ) : (
        <AssetTable assets={portfolioAssets} onRemoveAsset={setIsinToDelete} />
      )}
      {pickerOpen && (
        <AssetPickerModal
          assets={assets}
          initialSelected={selectedIsins}
          onCancel={() => setPickerOpen(false)}
          onConfirm={handlePickerConfirm}
        />
      )}
      {isinToDelete !== undefined &&
        renderDeleteConfirmModal({
          assetName: assetToDelete?.name ?? isinToDelete,
          onCancel: () => setIsinToDelete(undefined),
          onConfirm: handleConfirmDelete,
        })}
    </div>
  );
}
