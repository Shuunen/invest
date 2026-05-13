import { useMemo, useRef, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { computeWeightedAllocationsFromSelection } from "../utils/allocation-charts.ts";
import { AssetTable } from "./asset-table.tsx";
import { AllocationChart } from "./charts/allocation.tsx";
import { ModalActions } from "./modal-actions.tsx";
import { ModalHeader } from "./modal-header.tsx";

type Props = {
  /** The list of all available assets to choose from in the picker */
  assets: Asset[];
  /** The ISINs of the assets that should be initially selected when the modal opens */
  initialSelected: Set<string>;
  /** Optional amount map used to compute capital-weighted allocation previews */
  amountByIsin?: Map<string, number>;
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
  if (assets.length === 0)
    return (
      <p data-testid="no-assets-message" className="p-4 text-center text-base-content/60">
        No instruments available. Import assets first.
      </p>
    );
  return <AssetTable assets={assets} selectedIsins={selected} onToggleSelect={toggle} />;
}

type AllocationPreviewArgs = {
  amountByIsin?: Map<string, number>;
  assets: Asset[];
  initialSelected: Set<string>;
  selected: Set<string>;
};

function useAllocationPreview({ amountByIsin, assets, initialSelected, selected }: AllocationPreviewArgs) {
  const [newSelectionInvestmentAmount, setNewSelectionInvestmentAmount] = useState(0);
  const assetByIsin = useMemo(() => new Map(assets.map(asset => [asset.isin, asset])), [assets]);

  const selectedWithoutAmount = useMemo(() => {
    if (amountByIsin === undefined) return [];
    return [...selected].filter(isin => !amountByIsin.has(isin));
  }, [amountByIsin, selected]);

  const afterAmountByIsin = useMemo(() => {
    if (amountByIsin === undefined) return undefined;
    if (selectedWithoutAmount.length === 0) return amountByIsin;

    const nextAmountByIsin = new Map(amountByIsin);
    const eurosPerNewAsset = newSelectionInvestmentAmount / selectedWithoutAmount.length;
    for (const isin of selectedWithoutAmount) {
      const price = assetByIsin.get(isin)?.price;
      const amountInUnits = price === undefined || price <= 0 ? 0 : eurosPerNewAsset / price;
      nextAmountByIsin.set(isin, amountInUnits);
    }
    return nextAmountByIsin;
  }, [amountByIsin, assetByIsin, newSelectionInvestmentAmount, selectedWithoutAmount]);

  const beforeAllocations = useMemo(() => computeWeightedAllocationsFromSelection({ amountByIsin, assets, defaultAmount: amountByIsin === undefined ? 1 : 0, selectedIsins: initialSelected }), [amountByIsin, assets, initialSelected]);
  const afterAllocations = useMemo(
    () => computeWeightedAllocationsFromSelection({ amountByIsin: afterAmountByIsin, assets, defaultAmount: amountByIsin === undefined ? 1 : 0, selectedIsins: selected }),
    [afterAmountByIsin, amountByIsin, assets, selected],
  );

  return { afterAllocations, beforeAllocations, newSelectionInvestmentAmount, selectedWithoutAmount, setNewSelectionInvestmentAmount };
}

type RenderSelectionInvestmentInputArgs = {
  newSelectionCount: number;
  value: number;
  onChange: (nextValue: number) => void;
};

function renderSelectionInvestmentInput({ newSelectionCount, onChange, value }: RenderSelectionInvestmentInputArgs) {
  return (
    <div className="flex w-52 items-center justify-center bg-transparent">
      <label className="form-control w-full max-w-xs" data-testid="new-selection-investment-control">
        <div className="label">
          <span className="label-text text-xs">Investment for new selection (€)</span>
        </div>
        <input
          type="number"
          min={0}
          step={100}
          value={value}
          onChange={event => {
            const next = Number(event.target.value);
            onChange(Number.isFinite(next) && next >= 0 ? next : 0);
          }}
          className="input-bordered input input-sm w-full"
          data-testid="new-selection-investment-input"
        />
        <div className="label">
          <span className="label-text-alt text-xs text-base-content/60">Split equally across {newSelectionCount} new asset(s)</span>
        </div>
      </label>
    </div>
  );
}

export function AssetPickerModal({ assets, initialSelected, amountByIsin, onCancel, onConfirm, title }: Props) {
  const { handleConfirm, selected, toggle } = useAssetPicker(initialSelected, onConfirm);
  const initialSelectedRef = useRef(initialSelected);
  const { afterAllocations, beforeAllocations, newSelectionInvestmentAmount, selectedWithoutAmount, setNewSelectionInvestmentAmount } = useAllocationPreview({
    amountByIsin,
    assets,
    initialSelected: initialSelectedRef.current,
    selected,
  });

  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box w-11/12 max-w-none bg-base-200">
        <ModalHeader title={title} onClose={onCancel} />
        <div className="mb-3 flex justify-between pb-2" data-testid="allocation-preview-row">
          <AllocationChart data={beforeAllocations.geo} title="Current geography" name="before-geo-allocation" />
          <AllocationChart data={afterAllocations.geo} title="Selected geography" name="after-geo-allocation" />
          {selectedWithoutAmount.length > 0 && renderSelectionInvestmentInput({ newSelectionCount: selectedWithoutAmount.length, onChange: setNewSelectionInvestmentAmount, value: newSelectionInvestmentAmount })}
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
