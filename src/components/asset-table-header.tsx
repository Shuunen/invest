import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import type { Asset } from "../schemas/index.ts";

export function renderColumnFilter(table: Table<Asset>, visibleLeafCount: number) {
  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn text-gray-500 btn-ghost btn-sm">
        Columns <EyeIcon size={16} />
      </button>
      <div tabIndex={0} className="dropdown-content menu z-9999 w-lg rounded-box bg-base-100 p-2 shadow-2xl">
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
                <span className="label-text">{column.columnDef.meta?.title ?? String(column.columnDef.header)}</span>
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
      className="input-bordered input input-sm w-full max-w-sm outline-gray-300"
      placeholder="Search ISIN, name, tickers…"
      value={filterText}
      onChange={event => {
        setFilterText(event.target.value);
      }}
    />
  );
}
