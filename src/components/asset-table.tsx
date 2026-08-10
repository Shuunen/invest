// oxlint-disable max-lines
import { useNavigate } from "@tanstack/react-router";
import { flexRender, type ColumnDef, type Header, type SortingState, type Table } from "@tanstack/react-table";
import { CheckIcon, PencilLineIcon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { computeScore, type Asset } from "../schemas/asset.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles.ts";
import { useTranslation, type Translate } from "../utils/translations.ts";
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
  makeTargetAmountColumn,
  makeTargetAmountUpdatedAtColumn,
  makeValueColumn,
} from "./asset-table-columns.tsx";
import { useHydration } from "./asset-table-db.ts";
import { renderColumnFilter, renderPresetFilters, renderSearchFilter, type PresetFilters } from "./asset-table-header.tsx";
import { matchesFilter, useTableInstance } from "./asset-table-hooks.ts";
import { renderSkeleton } from "./asset-table-skeleton.tsx";
import { computeQuintileClasses, defaultColumnVisibility, getAriaSortValue, getScoreDotClass } from "./asset-table-utils.ts";
import { Empty } from "./empty.tsx";
import { PageHeader } from "./page-header.tsx";

type Props = AssetTableMeta & {
  assets?: Asset[];
  onDismissSimilarity?: (isin: string, matchedIsin: string) => void;
  onRemoveAsset?: (isin: string) => void;
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
    <button type="button" data-testid={`sort-${header.id}`} title={title} className={cn("btn btn-ghost", { "text-base-content": sorted })} onClick={header.column.getToggleSortingHandler()}>
      {label}
      <span className={cn("scale-75")}>{getSortIndicator(sorted)}</span>
    </button>
  );
}

function buildActiveColumns({
  onToggleSelect,
  onRemoveAsset,
  onAmountChange,
  onTargetAmountChange,
  onDismissSimilarity,
  onPriceChange,
  noteMap,
  amountMap,
  amountUpdatedAtMap,
  targetAmountMap,
  targetAmountUpdatedAtMap,
  assets,
}: Pick<
  Props,
  "onToggleSelect" | "onRemoveAsset" | "onAmountChange" | "onTargetAmountChange" | "onDismissSimilarity" | "onPriceChange" | "noteMap" | "amountMap" | "amountUpdatedAtMap" | "targetAmountMap" | "targetAmountUpdatedAtMap" | "assets"
>): ColumnDef<Asset>[] {
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
    ...(onTargetAmountChange ? [makeTargetAmountColumn(targetAmountMap)] : []),
    ...(targetAmountUpdatedAtMap ? [makeTargetAmountUpdatedAtColumn(targetAmountUpdatedAtMap)] : []),
    ...(onAmountChange && assets ? [makeSimilarityColumn(assets, onDismissSimilarity)] : []),
    ...(isPortfolioMode ? [makeNoteColumn(noteMap)] : []),
    ...(onAmountChange ? [makeValueColumn(amountMap)] : []),
    ...(onRemoveAsset ? [makeRemoveColumn(onRemoveAsset)] : []),
  ];
}

function usePresetFilters(): PresetFilters {
  const onlyPea = useAppStore(state => state.data.settings.onlyPea);
  const withRr5y = useAppStore(state => state.data.settings.withRr5y);
  const scoreAbove50 = useAppStore(state => state.data.settings.scoreAbove50);
  const setPresetFilters = useAppStore(state => state.setPresetFilters);
  const setOnlyPea = useCallback((value: boolean) => setPresetFilters({ onlyPea: value, scoreAbove50, withRr5y }), [setPresetFilters, scoreAbove50, withRr5y]);
  const setWithRr5y = useCallback((value: boolean) => setPresetFilters({ onlyPea, scoreAbove50, withRr5y: value }), [setPresetFilters, onlyPea, scoreAbove50]);
  const setScoreAbove50 = useCallback((value: boolean) => setPresetFilters({ onlyPea, scoreAbove50: value, withRr5y }), [setPresetFilters, onlyPea, withRr5y]);
  return { onlyPea, scoreAbove50, setOnlyPea, setScoreAbove50, setWithRr5y, withRr5y };
}

const minScoreFilterThreshold = 50;

type UseFilteredAssetsOpts = {
  applyPresetFilters: boolean;
  assets: Asset[];
  filterText: string;
  presetFilters: PresetFilters;
};

function useFilteredAssets({ applyPresetFilters, assets, filterText, presetFilters }: UseFilteredAssetsOpts) {
  const { onlyPea, scoreAbove50, withRr5y } = presetFilters;
  return useMemo(() => {
    const lower = filterText.trim().toLowerCase();
    const bySearch = assets.filter(row => !lower || matchesFilter(row, lower));
    if (!applyPresetFilters) return bySearch;
    return bySearch
      .filter(row => !onlyPea || row.availableForPea)
      .filter(row => !withRr5y || row.riskReward5y !== undefined)
      .filter(row => !scoreAbove50 || (computeScore(row) ?? 0) > minScoreFilterThreshold);
  }, [assets, filterText, onlyPea, scoreAbove50, withRr5y, applyPresetFilters]);
}

function useRetry() {
  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = () => {
    useAppStore.setState({ isLoading: true, loadError: undefined });
    setRetryKey(prevKey => prevKey + 1);
  };
  useHydration(retryKey);
  return handleRetry;
}

function buildTableMeta(
  props: Pick<
    Props,
    | "amountMap"
    | "amountUpdatedAtMap"
    | "isEditing"
    | "noteMap"
    | "onAmountChange"
    | "onNoteChange"
    | "onPriceChange"
    | "onTargetAmountChange"
    | "onToggleSelect"
    | "selectedIsins"
    | "targetAmountMap"
    | "targetAmountUpdatedAtMap"
    | "totalValue"
    | "targetTotalValue"
  >,
): AssetTableMeta | undefined {
  const { amountMap, amountUpdatedAtMap, isEditing, noteMap, onAmountChange, onNoteChange, onPriceChange, onTargetAmountChange, onToggleSelect, selectedIsins, targetAmountMap, targetAmountUpdatedAtMap, totalValue, targetTotalValue } =
    props;
  if (!(onToggleSelect ?? onAmountChange ?? onPriceChange ?? onTargetAmountChange ?? amountUpdatedAtMap ?? targetAmountUpdatedAtMap)) return undefined;
  return {
    amountMap,
    amountUpdatedAtMap,
    isEditing,
    noteMap,
    onAmountChange,
    onNoteChange,
    onPriceChange,
    onTargetAmountChange,
    onToggleSelect,
    selectedIsins,
    targetAmountMap,
    targetAmountUpdatedAtMap,
    targetTotalValue,
    totalValue,
  };
}

function useAssetTableState(props: Props = {}) {
  const { amountMap, amountUpdatedAtMap, assets: propAssets, noteMap, targetAmountUpdatedAtMap } = props;
  const { onAmountChange, onDismissSimilarity, onPriceChange, onRemoveAsset, onTargetAmountChange, onToggleSelect, targetAmountMap } = props;
  const data = useAppStore(state => state.data);
  const isLoading = useAppStore(state => state.isLoading);
  const loadError = useAppStore(state => state.loadError);
  const setSort = useAppStore(state => state.setSort);
  const setColumnVisibility = useAppStore(state => state.setColumnVisibility);
  const [filterText, setFilterText] = useState("");
  const presetFilters = usePresetFilters();
  const handleRetry = useRetry();
  const resolvedVisibility = useMemo(() => ({ ...defaultColumnVisibility, ...data.settings.columnVisibility }), [data.settings.columnVisibility]);
  const activeColumns = useMemo(
    () =>
      buildActiveColumns({ amountMap, amountUpdatedAtMap, assets: propAssets, noteMap, onAmountChange, onDismissSimilarity, onPriceChange, onRemoveAsset, onTargetAmountChange, onToggleSelect, targetAmountMap, targetAmountUpdatedAtMap }),
    [amountMap, amountUpdatedAtMap, propAssets, noteMap, onAmountChange, onDismissSimilarity, onPriceChange, onRemoveAsset, onTargetAmountChange, onToggleSelect, targetAmountMap, targetAmountUpdatedAtMap],
  );
  const sorting: SortingState = useMemo(() => {
    const { column, direction } = data.settings.sort;
    if (column === "amount" && !onAmountChange) return [];
    return [{ desc: direction === "desc", id: column }];
  }, [data.settings.sort, onAmountChange]);
  const filteredAssets = useFilteredAssets({ applyPresetFilters: !propAssets, assets: propAssets ?? data.assets, filterText, presetFilters });
  const meta = buildTableMeta(props);
  const table = useTableInstance({ columns: activeColumns, filteredAssets, meta, resolvedVisibility, setColumnVisibility, setSort, sorting });
  return {
    data,
    filterText,
    handleRetry,
    isLoading,
    loadError,
    presetFilters,
    quintileClasses: computeQuintileClasses(table.getRowModel().rows),
    setFilterText,
    table,
    visibleLeafCount: table.getVisibleLeafColumns().length,
  };
}

function renderError(error: Error, handleRetry: () => void, translate: Translate) {
  return (
    <div className="p-4 text-left">
      <div role="alert" data-testid="error-alert" className="alert alert-error">
        <span data-testid="error-message">{translate("error-failed-to-load", { message: error.message })}</span>
        <button type="button" data-testid="retry-button" className="btn btn-sm" onClick={handleRetry}>
          {translate("action-retry")}
        </button>
      </div>
    </div>
  );
}

function renderNoResults(colCount: number, filterText: string) {
  return (
    <tbody>
      <tr>
        <td colSpan={colCount}>
          <Empty name="filter-no-results" title={`No results found for "${filterText}"`} description="Try adjusting your search criteria" />
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
    <thead className="sticky top-12 z-10 bg-base-100">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th
              key={header.id}
              aria-sort={header.column.getCanSort() ? getAriaSortValue(header.column.getIsSorted()) : undefined}
              className={cn(header.column.getIsSorted() ? "font-semibold" : undefined, header.column.columnDef.meta?.center ? "text-center" : "pl-0")}
              colSpan={header.colSpan}
              scope="col"
            >
              {renderThContent(header)}
            </th>
          ))}
        </tr>
      ))}
      <tr>
        <th colSpan={table.getVisibleLeafColumns().length} className="p-0" />
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
          className={cn("rounded outline-1 -outline-offset-1 outline-transparent transition-colors hover:outline-base-content/30 hover:backdrop-brightness-105", onRowClick && "cursor-pointer select-none")}
          onClick={onRowClick ? () => onRowClick(row.original.isin) : undefined}
        >
          {row.getVisibleCells().map(cell => {
            const qClass = quintileClasses.get(cell.column.id)?.get(row.id);
            const isScoreCol = cell.column.id === "score";
            const tdClass = cn("whitespace-nowrap", { "font-semibold": isScoreCol }, { "text-center": cell.column.columnDef.meta?.center }, qClass);
            const cellNode = flexRender(cell.column.columnDef.cell, cell.getContext());
            return (
              <td key={cell.id} className={tdClass}>
                {isScoreCol && (
                  <span className="flex items-center gap-1.5">
                    <span className={`score-dot ${getScoreDotClass(qClass)}`} />
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

export function AssetTable(props: Props = {}) {
  const { assets: propAssets, onPriceChange: propOnPriceChange } = props;
  const { translate } = useTranslation();
  const { onPriceChange, priceEditActions } = useAssetsPriceEditState(propAssets, propOnPriceChange);
  const { data, filterText, handleRetry, isLoading, loadError, presetFilters, quintileClasses, setFilterText, table, visibleLeafCount } = useAssetTableState({ ...props, onPriceChange });
  if (!propAssets && isLoading) return renderSkeleton();
  if (!propAssets && loadError) return renderError(loadError, handleRetry, translate);
  if (!propAssets && data.assets.length === 0) return <Empty name="no-assets" title="No instruments added yet" description="Use the Import button in the top bar to get started" />;
  const filterReturnedNoResults = filterText.trim() !== "" && table.getRowModel().rows.length === 0;
  return (
    <div className="flex grow flex-col bg-base-100">
      {!propAssets && renderAssetsHeader(data.assets, priceEditActions)}
      <div className="relative container mx-auto overflow-auto" data-testid="asset-table">
        <div className="sticky top-0 z-20 flex gap-4 bg-base-100 pt-4">
          {renderSearchFilter(filterText, setFilterText)}
          {!propAssets && renderPresetFilters(presetFilters, translate)}
          {renderColumnFilter(table, visibleLeafCount, translate)}
        </div>
        <table className="table-hover table w-full">
          <caption className="sr-only">{translate("assets-table-caption")}</caption>
          {renderTableHeader(table)}
          {filterReturnedNoResults ? renderNoResults(table.getVisibleLeafColumns().length, filterText) : renderTableBody(table, quintileClasses, props.onToggleSelect)}
        </table>
      </div>
    </div>
  );
}
