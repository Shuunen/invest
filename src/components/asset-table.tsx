import { flexRender, type ColumnDef, type Header, type SortingState, type Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles.ts";
import { columns } from "./asset-table-columns.tsx";
import { useDexieSync, useHydration } from "./asset-table-db.ts";
import { renderColumnFilter, renderSearchFilter, renderPageHeader } from "./asset-table-header.tsx";
import { matchesFilter, useTableInstance } from "./asset-table-hooks.ts";
import { computeQuintileClasses, DEFAULT_COLUMN_VISIBILITY, getAriaSortValue, SKELETON_COLS, SKELETON_ROWS } from "./asset-table-utils.ts";

type AssetTableMeta = { onToggleSelect?: (isin: string) => void; selectedIsins?: Set<string> };

function makeSelectColumn(): ColumnDef<Asset> {
  return {
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      return (
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
          checked={meta?.selectedIsins?.has(row.original.isin) ?? false}
          onChange={() => meta?.onToggleSelect?.(row.original.isin)}
          onClick={event => event.stopPropagation()}
        />
      );
    },
    enableSorting: false,
    header: "",
    id: "select",
  };
}

function makeRemoveColumn(onRemove: (isin: string) => void): ColumnDef<Asset> {
  return {
    cell: ({ row }) => (
      <button type="button" className="btn text-error btn-ghost btn-xs" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original.isin)}>
        <Trash2 size={14} />
      </button>
    ),
    enableSorting: false,
    header: "",
    id: "remove",
  };
}

type Props = {
  assets?: Asset[];
  hideFilters?: boolean;
  onRemoveAsset?: (isin: string) => void;
  onToggleSelect?: (isin: string) => void;
  selectedIsins?: Set<string>;
};

function getSortIndicator(sorted: "asc" | "desc" | false): string {
  if (sorted === "asc") return " ▲";
  if (sorted === "desc") return " ▼";
  return "";
}

function renderThContent(header: Header<Asset, unknown>) {
  if (header.isPlaceholder) return undefined;
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) return <span>{label}</span>;
  return (
    <button type="button" className={cn("btn", sorted ? "btn-soft btn-primary" : "btn-ghost")} onClick={header.column.getToggleSortingHandler()}>
      {label}
      <span className="scale-75">{getSortIndicator(sorted)}</span>
    </button>
  );
}

function buildActiveColumns(onToggleSelect: ((isin: string) => void) | undefined, onRemoveAsset: ((isin: string) => void) | undefined): ColumnDef<Asset>[] {
  return [...(onToggleSelect ? [makeSelectColumn()] : []), ...columns, ...(onRemoveAsset ? [makeRemoveColumn(onRemoveAsset)] : [])];
}

function useAssetTableState({ assets: propAssets, onRemoveAsset, onToggleSelect, selectedIsins }: Props = {}) {
  const data = useAppStore(state => state.data);
  const isLoading = useAppStore(state => state.isLoading);
  const loadError = useAppStore(state => state.loadError);
  const setSort = useAppStore(state => state.setSort);
  const setColumnVisibility = useAppStore(state => state.setColumnVisibility);
  const [retryKey, setRetryKey] = useState(0);
  const [filterText, setFilterText] = useState("");
  const handleRetry = () => {
    useAppStore.setState({ isLoading: true, loadError: undefined });
    setRetryKey(prevKey => prevKey + 1);
  };
  useHydration(retryKey);
  useDexieSync();
  const resolvedVisibility = useMemo(() => ({ ...DEFAULT_COLUMN_VISIBILITY, ...data.settings.columnVisibility }), [data.settings.columnVisibility]);
  const sorting: SortingState = useMemo(() => [{ desc: data.settings.sort.direction === "desc", id: data.settings.sort.column }], [data.settings.sort]);
  const filteredAssets = useMemo(() => {
    const lower = filterText.trim().toLowerCase();
    if (!lower) return propAssets ?? data.assets;
    return (propAssets ?? data.assets).filter(row => matchesFilter(row, lower));
  }, [data.assets, filterText, propAssets]);
  const activeColumns = buildActiveColumns(onToggleSelect, onRemoveAsset);
  const table = useTableInstance({
    columns: activeColumns,
    filteredAssets,
    meta: onToggleSelect ? { onToggleSelect, selectedIsins } : undefined,
    resolvedVisibility,
    setColumnVisibility,
    setSort,
    sorting,
  });
  const visibleLeafCount = table.getVisibleLeafColumns().length;
  return {
    data,
    filterText,
    handleRetry,
    isLoading,
    loadError,
    quintileClasses: computeQuintileClasses(table.getRowModel().rows),
    setFilterText,
    table,
    visibleLeafCount,
  };
}

function renderSkeleton() {
  return (
    <div className="p-4 text-left">
      <div className="w-full overflow-x-auto">
        <table className="table w-full">
          <tbody>
            {Array.from({ length: SKELETON_ROWS }, (_el, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: SKELETON_COLS }, (_colEl, colIdx) => (
                  <td key={colIdx}>
                    <div className="h-4 w-full skeleton" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderError(error: Error, handleRetry: () => void) {
  return (
    <div className="p-4 text-left">
      <div role="alert" className="alert alert-error">
        <span>Failed to load data: {error.message}</span>
        <button type="button" className="btn btn-sm" onClick={handleRetry}>
          Retry
        </button>
      </div>
    </div>
  );
}

function renderEmpty() {
  return (
    <div className="p-8 text-center">
      <p className="mb-4 text-4xl">📊</p>
      <h2>No instruments added yet</h2>
      <p className="mb-4 text-base-content/60">Use the Import button in the top bar to get started</p>
    </div>
  );
}

function renderTableHeader(table: Table<Asset>) {
  return (
    <thead className="sticky top-0 z-10 bg-base-100">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th
              key={header.id}
              aria-sort={header.column.getCanSort() ? getAriaSortValue(header.column.getIsSorted()) : undefined}
              className={cn(header.column.getIsSorted() ? "font-semibold" : undefined, "pl-2")}
              colSpan={header.colSpan}
              scope="col"
            >
              {renderThContent(header)}
            </th>
          ))}
        </tr>
      ))}
      <tr>
        <th colSpan={table.getVisibleLeafColumns().length} className="p-0 shadow" />
      </tr>
    </thead>
  );
}

function renderTableBody(table: Table<Asset>, quintileClasses: Map<string, Map<string, string | undefined>>, onRowClick?: (isin: string) => void) {
  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr
          key={row.id}
          className={cn("rounded outline-1 -outline-offset-1 outline-transparent transition-colors hover:outline-primary hover:backdrop-brightness-105", onRowClick && "cursor-pointer select-none")}
          onClick={onRowClick ? () => onRowClick(row.original.isin) : undefined}
        >
          {row.getVisibleCells().map(cell => {
            const qClass = quintileClasses.get(cell.column.id)?.get(row.id);
            const isScoreCol = cell.column.id === "score";
            const tdClass = cn({ "font-semibold": isScoreCol }, qClass);
            const cellNode = flexRender(cell.column.columnDef.cell, cell.getContext());
            return (
              <td key={cell.id} className={tdClass}>
                {cellNode}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

export function AssetTable({ assets: propAssets, onRemoveAsset, onToggleSelect, selectedIsins }: Props = {}) {
  const { data, filterText, handleRetry, isLoading, loadError, quintileClasses, setFilterText, table, visibleLeafCount } = useAssetTableState({ assets: propAssets, onRemoveAsset, onToggleSelect, selectedIsins });
  if (!propAssets) {
    if (isLoading) return renderSkeleton();
    if (loadError) return renderError(loadError, handleRetry);
    if (data.assets.length === 0) return renderEmpty();
  }
  return (
    <>
      {!propAssets && renderPageHeader(data.assets)}
      <div className="relative p-4 text-left">
        <div className="sticky top-5 z-20 -mb-9 ml-2 flex gap-4">
          {renderSearchFilter(filterText, setFilterText)}
          {renderColumnFilter(table, visibleLeafCount)}
        </div>
        <table className="table-hover table w-full">
          <caption className="sr-only">ISINs reference data table</caption>
          {renderTableHeader(table)}
          {renderTableBody(table, quintileClasses, onToggleSelect)}
        </table>
      </div>
    </>
  );
}
