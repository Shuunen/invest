import { useState } from "react";
import type { Asset } from "../schemas/index.ts";
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

function useAssetPicker(initialSelected: Set<string>, onConfirm: (selectedIsins: string[]) => void) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));

  function toggle(isin: string) {
    const next = new Set(selected);
    if (next.has(isin)) next.delete(isin);
    else next.add(isin);
    setSelected(next);
  }

  function handleConfirm() {
    onConfirm([...selected]);
  }

  return { handleConfirm, selected, toggle };
}

type RenderListArgs = { assets: Asset[]; selected: Set<string>; toggle: (isin: string) => void };

function renderPickerList({ assets, selected, toggle }: RenderListArgs) {
  if (assets.length === 0) return <p className="p-4 text-center text-base-content/60">No instruments available. Import assets first.</p>;
  return <AssetTable assets={assets} selectedIsins={selected} onToggleSelect={toggle} />;
}

export function AssetPickerModal({ assets, initialSelected, onCancel, onConfirm, title }: Props) {
  const { handleConfirm, selected, toggle } = useAssetPicker(initialSelected, onConfirm);
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box max-w-none">
        <ModalHeader title={title} onClose={onCancel} />
        <div className="max-h-144 overflow-y-auto rounded-box border border-base-200">{renderPickerList({ assets, selected, toggle })}</div>
        <p className="mt-2 text-sm text-base-content/60">{selected.size} selected</p>
        <ModalActions onCancel={onCancel} onConfirm={handleConfirm} confirmText="Confirm" type="default" />
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}
