import { useMemo, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { matchesFilter } from "./asset-table-hooks.ts";
import { AssetTable } from "./asset-table.tsx";
import { ModalActions } from "./modal-actions.tsx";
import { ModalHeader } from "./modal-header.tsx";

type Props = {
  /** The list of all available assets to choose from in the picker */
  assets: Asset[];
  /** The ISINs of the assets that should be initially selected when the modal opens */
  initialSelected: Set<string>;
  /** Called when the user cancels the selection (e.g. by clicking outside the modal or on the Cancel button) */
  onCancel: () => void;
  /** Called with the new set of selected ISINs when the user confirms their selection */
  onConfirm: (selectedIsins: string[]) => void;
  /** The title of the modal */
  title: string;
};

function useAssetPicker(assets: Asset[], initialSelected: Set<string>, onConfirm: (selectedIsins: string[]) => void) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    if (!lower) return assets;
    return assets.filter(asset => matchesFilter(asset, lower));
  }, [assets, filter]);

  function toggle(isin: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(isin)) next.delete(isin);
      else next.add(isin);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selected]);
  }

  return { filter, filtered, handleConfirm, selected, setFilter, toggle };
}

type RenderListArgs = { assets: Asset[]; filtered: Asset[]; selected: Set<string>; toggle: (isin: string) => void };

function renderPickerList({ assets, filtered, selected, toggle }: RenderListArgs) {
  if (assets.length === 0) return <p className="p-4 text-center text-base-content/60">No instruments available. Import assets first.</p>;
  if (filtered.length === 0) return <p className="p-4 text-center text-base-content/60">No instruments match your search.</p>;
  return <AssetTable assets={filtered} selectedIsins={selected} onToggleSelect={toggle} />;
}

export function AssetPickerModal({ assets, initialSelected, onCancel, onConfirm, title }: Props) {
  const { filtered, handleConfirm, selected, toggle } = useAssetPicker(assets, initialSelected, onConfirm);
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box max-w-none">
        <ModalHeader title={title} onClose={onCancel} />
        <div className="max-h-144 overflow-y-auto rounded-box border border-base-200">{renderPickerList({ assets, filtered, selected, toggle })}</div>
        <p className="mt-2 text-sm text-base-content/60">{selected.size} selected</p>
        <ModalActions onCancel={onCancel} onConfirm={handleConfirm} confirmText="Confirm" type="default" />
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}
