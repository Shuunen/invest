import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import type { Asset } from "../schemas/asset.ts";
import type { Translate } from "../utils/translations.ts";

export function renderColumnFilter(table: Table<Asset>, visibleLeafCount: number, translate: Translate) {
  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn btn-sm">
        {translate("action-columns")} <EyeIcon size={16} />
      </button>
      <div tabIndex={0} className="dropdown-content w-lg">
        <div className="grid grid-cols-2 gap-x-4">
          {table
            .getAllLeafColumns()
            .filter(column => column.columnDef.enableHiding !== false)
            .map(column => (
              <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-primary/30">
                <input
                  data-testid={`toggle-col-${column.id}`}
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={column.getIsVisible()}
                  disabled={column.getIsVisible() && visibleLeafCount <= 1}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <small>{column.columnDef.meta?.title ?? String(column.columnDef.header)}</small>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
}

export function renderSearchFilter(filterText: string, setFilterText: (value: string) => void) {
  return (
    <input
      data-testid="input-filter"
      type="search"
      className="input-bordered input w-full max-w-xs outline-base-100 input-sm md:max-w-sm"
      placeholder="Search ISIN, name, tickers…"
      value={filterText}
      onChange={event => {
        setFilterText(event.target.value);
      }}
    />
  );
}
