import { useMemo, useState } from "react";
import type { Allocation, Asset } from "../schemas/index.ts";
import { AssetTable } from "./asset-table.tsx";
import { AllocationChart } from "./charts/allocation.tsx";
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

function averageAllocation(maps: Allocation[]): Allocation {
  if (maps.length === 0) return {};
  const totals = new Map<string, number>();

  for (const allocationMap of maps)
    for (const [key, value] of Object.entries(allocationMap)) {
      if (value === undefined) continue;
      totals.set(key, (totals.get(key) ?? 0) + value);
    }

  return Object.fromEntries(Array.from(totals.entries()).map(([key, value]) => [key, value / maps.length]));
}

function buildProjectedAllocations(assets: Asset[], selectedIsins: Set<string>) {
  const selectedAssets = assets.filter(asset => selectedIsins.has(asset.isin));
  return {
    geo: averageAllocation(selectedAssets.map(asset => asset.geoAllocation)),
    sector: averageAllocation(selectedAssets.map(asset => asset.sectorAllocation)),
  };
}

function renderPickerList({ assets, selected, toggle }: RenderListArgs) {
  if (assets.length === 0)
    return (
      <p data-testid="no-assets-message" className="p-4 text-center text-base-content/60">
        No instruments available. Import assets first.
      </p>
    );
  return <AssetTable assets={assets} selectedIsins={selected} onToggleSelect={toggle} />;
}

export function AssetPickerModal({ assets, initialSelected, onCancel, onConfirm, title }: Props) {
  const { handleConfirm, selected, toggle } = useAssetPicker(initialSelected, onConfirm);
  const beforeAllocations = useMemo(() => buildProjectedAllocations(assets, initialSelected), [assets, initialSelected]);
  const afterAllocations = useMemo(() => buildProjectedAllocations(assets, selected), [assets, selected]);

  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box w-11/12 max-w-none bg-base-200">
        <ModalHeader title={title} onClose={onCancel} />
        <div className="mb-3 flex justify-between pb-2" data-testid="allocation-preview-row">
          <AllocationChart data={beforeAllocations.geo} title="Current geography" name="before-geo-allocation" />
          <AllocationChart data={afterAllocations.geo} title="Selected geography" name="after-geo-allocation" />
          <div className="w-32 bg-transparent" />
          <AllocationChart data={beforeAllocations.sector} title="Current sectors" name="before-sector-allocation" />
          <AllocationChart data={afterAllocations.sector} title="Selected sectors" name="after-sector-allocation" />
        </div>
        <div className="max-h-144 overflow-y-auto rounded-box border border-base-200">{renderPickerList({ assets, selected, toggle })}</div>
        <p data-testid="selected-count" className="mt-2 text-sm text-base-content/60">
          {selected.size} selected
        </p>
        <ModalActions onCancel={onCancel} onConfirm={handleConfirm} confirmText="Confirm" type="default" />
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}
