import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { matchesFilter } from "./asset-table-hooks.ts";

type Props = {
  assets: Asset[];
  initialSelected: Set<string>;
  onCancel: () => void;
  onConfirm: (selectedIsins: string[]) => void;
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

type RenderContentArgs = {
  assets: Asset[];
  filtered: Asset[];
  selected: Set<string>;
  toggle: (isin: string) => void;
};

function renderPickerContent({ assets, filtered, selected, toggle }: RenderContentArgs) {
  if (assets.length === 0)
    return <p className="p-4 text-center text-base-content/60">No instruments available. Import assets first.</p>;
  if (filtered.length === 0)
    return <p className="p-4 text-center text-base-content/60">No instruments match your search.</p>;
  return (
    <table className="table w-full table-sm">
      <thead className="sticky top-0 bg-base-100">
        <tr>
          <th className="w-8" />
          <th>ISIN</th>
          <th>Name</th>
          <th>Provider</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(asset => (
          <tr key={asset.isin} className="hover cursor-pointer" onClick={() => toggle(asset.isin)}>
            <td>
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={selected.has(asset.isin)}
                onChange={() => toggle(asset.isin)}
                onClick={event => event.stopPropagation()}
              />
            </td>
            <td className="font-mono text-xs">{asset.isin}</td>
            <td>{asset.name}</td>
            <td className="text-base-content/60">{asset.provider}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AssetPickerModal({ assets, initialSelected, onCancel, onConfirm }: Props) {
  const { filter, filtered, handleConfirm, selected, setFilter, toggle } = useAssetPicker(
    assets,
    initialSelected,
    onConfirm,
  );
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Select Assets</h3>
          <button type="button" className="btn btn-circle btn-ghost btn-sm" aria-label="Close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <input
          type="search"
          className="input-bordered input mb-3 w-full"
          placeholder="Filter by name, ISIN, ticker…"
          value={filter}
          onChange={event => setFilter(event.target.value)}
          autoFocus
        />
        <div className="max-h-96 overflow-y-auto rounded-box border border-base-200">
          {renderPickerContent({ assets, filtered, selected, toggle })}
        </div>
        <p className="mt-2 text-sm text-base-content/60">{selected.size} selected</p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}
