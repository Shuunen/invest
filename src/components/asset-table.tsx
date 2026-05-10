// oxlint-disable max-lines
import { useNavigate } from "@tanstack/react-router";
import { flexRender, type ColumnDef, type Header, type SortingState, type Table } from "@tanstack/react-table";
import { CheckIcon, PencilLineIcon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles.ts";
import {
  type AssetTableMeta,
  columns,
  makeAmountColumn,
  makeAmountUpdatedAtColumn,
  makeDataScoreColumn,
  makeNoteColumn,
  makePriceEditColumn,
  makePortfolioPriceColumn,
  makeRemoveColumn,
  makeSelectColumn,
  makeSimilarityColumn,
  makeValueColumn,
} from "./asset-table-columns.tsx";
import { useHydration } from "./asset-table-db.ts";
import { renderColumnFilter, renderSearchFilter } from "./asset-table-header.tsx";
import { matchesFilter, useTableInstance } from "./asset-table-hooks.ts";
import { renderSkeleton } from "./asset-table-skeleton.tsx";
import { computeQuintileClasses, defaultColumnVisibility, getAriaSortValue, getScoreDotClass } from "./asset-table-utils.ts";
import { PageHeader } from "./page-header.tsx";

type Props = {
  assets?: Asset[];
  isEditing?: boolean;
  noteMap?: Map<string, string>;
  onAmountChange?: (isin: string, amount: number) => void;
  onDismissSimilarity?: (isin: string, matchedIsin: string) => void;
  onNoteChange?: (isin: string, note: string) => void;
  onPriceChange?: (isin: string, price: number) => void;
  onRemoveAsset?: (isin: string) => void;
  onToggleSelect?: (isin: string) => void;
  selectedIsins?: Set<string>;
  amountMap?: Map<string, number>;
  amountUpdatedAtMap?: Map<string, string>;
};

function getSortIndicator(sorted: "asc" | "desc" | false): string {
  if (sorted === "asc") return " ▲";
  if (sorted === "desc") return " ▼";
  return "";
}

function renderThContent(header: Header<Asset, unknown>) {
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());
  const title = header.column.columnDef.meta?.title;
  if (!header.column.getCanSort()) return <span>{label}</span>;
  return (
    <button type="button" data-testid={`sort-${header.id}`} title={title} className={cn("btn", sorted ? "btn-soft btn-primary" : "btn-ghost")} onClick={header.column.getToggleSortingHandler()}>
      {label}
      <span className="scale-75">{getSortIndicator(sorted)}</span>
    </button>
  );
}

function buildActiveColumns({
  onToggleSelect,
  onRemoveAsset,
  onAmountChange,
  onDismissSimilarity,
  onPriceChange,
  amountMap,
  amountUpdatedAtMap,
  assets,
}: Pick<Props, "onToggleSelect" | "onRemoveAsset" | "onAmountChange" | "onDismissSimilarity" | "onPriceChange" | "amountMap" | "amountUpdatedAtMap" | "assets">): ColumnDef<Asset>[] {
  const isPortfolioMode = Boolean(onAmountChange);
  const baseCols = onPriceChange || isPortfolioMode ? columns.filter(col => col.id !== "price") : columns;
  // Insert data-score right after the first column (Score) so the two quality indicators sit together
  const colsWithDataScore = [baseCols[0], makeDataScoreColumn(amountMap, amountUpdatedAtMap), ...baseCols.slice(1)];
  return [
    ...(onToggleSelect ? [makeSelectColumn()] : []),
    ...colsWithDataScore,
    ...(onPriceChange && !isPortfolioMode ? [makePriceEditColumn()] : []),
    ...(isPortfolioMode ? [makePortfolioPriceColumn()] : []),
    ...(onAmountChange ? [makeAmountColumn(amountMap)] : []),
    ...(amountUpdatedAtMap ? [makeAmountUpdatedAtColumn(amountUpdatedAtMap)] : []),
    ...(onAmountChange && assets ? [makeSimilarityColumn(assets, onDismissSimilarity)] : []),
    ...(isPortfolioMode ? [makeNoteColumn()] : []),
    ...(onAmountChange ? [makeValueColumn(amountMap)] : []),
    ...(onRemoveAsset ? [makeRemoveColumn(onRemoveAsset)] : []),
  ];
}

function useAssetTableState({ assets: propAssets, onRemoveAsset, onAmountChange, onDismissSimilarity, onPriceChange, onToggleSelect, selectedIsins, amountMap, amountUpdatedAtMap, isEditing, noteMap, onNoteChange }: Props = {}) {
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
  const resolvedVisibility = useMemo(() => ({ ...defaultColumnVisibility, ...data.settings.columnVisibility }), [data.settings.columnVisibility]);
  const activeColumns = buildActiveColumns({ amountMap, amountUpdatedAtMap, assets: propAssets, onAmountChange, onDismissSimilarity, onPriceChange, onRemoveAsset, onToggleSelect });
  const sorting: SortingState = useMemo(() => {
    const { column, direction } = data.settings.sort;
    if (column === "amount" && !onAmountChange) return [];
    return [{ desc: direction === "desc", id: column }];
  }, [data.settings.sort, onAmountChange]);
  const filteredAssets = useMemo(() => {
    const lower = filterText.trim().toLowerCase();
    if (!lower) return propAssets ?? data.assets;
    return (propAssets ?? data.assets).filter(row => matchesFilter(row, lower));
  }, [data.assets, filterText, propAssets]);
  const meta: AssetTableMeta | undefined =
    (onToggleSelect ?? onAmountChange ?? onPriceChange ?? amountUpdatedAtMap) ? { amountMap, amountUpdatedAtMap, isEditing, noteMap, onAmountChange, onNoteChange, onPriceChange, onToggleSelect, selectedIsins } : undefined;
  const table = useTableInstance({
    columns: activeColumns,
    filteredAssets,
    meta,
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

function renderError(error: Error, handleRetry: () => void) {
  return (
    <div className="p-4 text-left">
      <div role="alert" data-testid="error-alert" className="alert alert-error">
        <span data-testid="error-message">Failed to load data: {error.message}</span>
        <button type="button" data-testid="retry-button" className="btn btn-sm" onClick={handleRetry}>
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
      <h2 data-testid="empty-table-message">No instruments added yet</h2>
      <p className="mb-4 text-base-content/60">Use the Import button in the top bar to get started</p>
    </div>
  );
}

function renderNoResults(colCount: number, filterText: string) {
  return (
    <tbody>
      <tr>
        <td colSpan={colCount} className="p-8 text-center">
          <p data-testid="no-results-message" className="mb-4 text-2xl">
            No results found for &quot;{filterText}&quot;
          </p>
          <p className="text-base-content/60">Try adjusting your search criteria</p>
        </td>
      </tr>
    </tbody>
  );
}

function renderAssetsHeader(assets: Asset[], actions: { icon: React.ReactNode; label: string; onClick: () => void }[]) {
  return <PageHeader assets={assets} title="Assets" subtitle="This is the list of available assets you can use to create and manage your portfolios." actions={actions} />;
}

function renderTableHeader(table: Table<Asset>) {
  return (
    <thead className="sticky top-12 z-10 bg-base-200">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th
              key={header.id}
              aria-sort={header.column.getCanSort() ? getAriaSortValue(header.column.getIsSorted()) : undefined}
              className={cn(header.column.getIsSorted() ? "font-semibold" : undefined, { "text-center": header.column.columnDef.meta?.center })}
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
          data-testid={`asset-row-${row.original.isin}`}
          className={cn("rounded outline-1 -outline-offset-1 outline-transparent transition-colors hover:outline-primary hover:backdrop-brightness-105", onRowClick && "cursor-pointer select-none")}
          onClick={onRowClick ? () => onRowClick(row.original.isin) : undefined}
        >
          {row.getVisibleCells().map(cell => {
            const qClass = quintileClasses.get(cell.column.id)?.get(row.id);
            const isScoreCol = cell.column.id === "score";
            const tdClass = cn({ "font-semibold": isScoreCol }, { "text-center": cell.column.columnDef.meta?.center }, qClass);
            const cellNode = flexRender(cell.column.columnDef.cell, cell.getContext());
            return (
              <td key={cell.id} className={tdClass}>
                {isScoreCol && (
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${getScoreDotClass(qClass)}`} />
                    <span className="w-6 text-center">{cellNode}</span>
                  </span>
                )}
                {!isScoreCol && cellNode}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

function useAssetsPriceEditState(propAssets: Asset[] | undefined, propOnPriceChange: ((isin: string, price: number) => void) | undefined) {
  const navigate = useNavigate();
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const stablePriceChange = useCallback((isin: string, price: number) => {
    useAppStore.getState().updateAssetPrice(isin, price);
  }, []);
  const priceEditActions = useMemo(() => {
    const icon = isPriceEditing ? <CheckIcon size={16} /> : <PencilLineIcon size={16} />;
    return [
      { icon: <PlusIcon size={16} />, label: "Add asset", onClick: () => void navigate({ to: "/assets/create" }) },
      { icon, label: isPriceEditing ? "Done" : "Edit prices", onClick: () => setIsPriceEditing(prev => !prev) },
    ];
  }, [isPriceEditing, navigate]);
  const onPriceChange = propOnPriceChange ?? (!propAssets && isPriceEditing ? stablePriceChange : undefined);
  return { onPriceChange, priceEditActions };
}

export function AssetTable({
  assets: propAssets,
  onRemoveAsset,
  onAmountChange,
  onDismissSimilarity,
  onToggleSelect,
  selectedIsins,
  amountMap,
  amountUpdatedAtMap,
  onPriceChange: propOnPriceChange,
  isEditing,
  noteMap,
  onNoteChange,
}: Props = {}) {
  const { onPriceChange, priceEditActions } = useAssetsPriceEditState(propAssets, propOnPriceChange);
  const { data, filterText, handleRetry, isLoading, loadError, quintileClasses, setFilterText, table, visibleLeafCount } = useAssetTableState({
    amountMap,
    amountUpdatedAtMap,
    assets: propAssets,
    isEditing,
    noteMap,
    onAmountChange,
    onDismissSimilarity,
    onNoteChange,
    onPriceChange,
    onRemoveAsset,
    onToggleSelect,
    selectedIsins,
  });
  if (!propAssets && isLoading) return renderSkeleton();
  if (!propAssets && loadError) return renderError(loadError, handleRetry);
  if (!propAssets && data.assets.length === 0) return renderEmpty();
  const filterReturnedNoResults = filterText.trim() !== "" && table.getRowModel().rows.length === 0;
  return (
    <>
      {!propAssets && renderAssetsHeader(data.assets, priceEditActions)}
      <div className="relative p-4 pt-0 text-left">
        <div className="sticky top-0 z-20 flex gap-4 bg-base-200 pt-4">
          {renderSearchFilter(filterText, setFilterText)}
          {renderColumnFilter(table, visibleLeafCount)}
        </div>
        <table className="table-hover table w-full">
          <caption className="sr-only">ISINs reference data table</caption>
          {renderTableHeader(table)}
          {filterReturnedNoResults ? renderNoResults(table.getVisibleLeafColumns().length, filterText) : renderTableBody(table, quintileClasses, onToggleSelect)}
        </table>
      </div>
    </>
  );
}
