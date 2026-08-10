import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import type { Asset } from "../schemas/asset.ts";
import { cn } from "../utils/browser-styles.ts";
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

export type PresetFilters = {
  onlyPea: boolean;
  scoreAbove50: boolean;
  setOnlyPea: (value: boolean) => void;
  setScoreAbove50: (value: boolean) => void;
  setWithRr5y: (value: boolean) => void;
  withRr5y: boolean;
};

export function renderPresetFilters({ onlyPea, scoreAbove50, setOnlyPea, setScoreAbove50, setWithRr5y, withRr5y }: PresetFilters, translate: Translate) {
  return (
    <div className="flex gap-2">
      <button type="button" data-testid="filter-only-pea" className={cn("btn btn-sm", { "btn-active": onlyPea })} onClick={() => setOnlyPea(!onlyPea)}>
        {translate("filter-only-pea")}
      </button>
      <button type="button" data-testid="filter-with-rr5y" className={cn("btn btn-sm", { "btn-active": withRr5y })} onClick={() => setWithRr5y(!withRr5y)}>
        {translate("filter-with-rr5y")}
      </button>
      <button type="button" data-testid="filter-score-above-50" className={cn("btn btn-sm", { "btn-active": scoreAbove50 })} onClick={() => setScoreAbove50(!scoreAbove50)}>
        {translate("filter-score-above-50")}
      </button>
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
