import { flexRender, type Header, type SortingState, type Table } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import sampleJson from "../../data/sample.json";
import { db } from "../db/db.ts";
import { AppDataSchema, type AppData, type Asset } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles.ts";
import { renderColumnFilter, renderSearchFilter, renderPageHeader } from "./isin-table-header.tsx";
import { matchesFilter, useTableInstance } from "./isin-table-hooks.ts";
import {
  computeQuintileClasses,
  DEFAULT_COLUMN_VISIBILITY,
  getAriaSortValue,
  SKELETON_COLS,
  SKELETON_ROWS,
} from "./isin-table-utils.ts";

const DEBOUNCE_MS = 300;
const seedResult = AppDataSchema.safeParse(sampleJson);
/* v8 ignore next -- sample.json is always valid; the false branch is unreachable */
const seedData: AppData = seedResult.success ? seedResult.data : { ...defaultAppData };

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
    <button
      type="button"
      className={cn("btn", sorted ? "btn-soft btn-primary" : "btn-ghost")}
      onClick={header.column.getToggleSortingHandler()}
    >
      {label}
      <span className="scale-75">{getSortIndicator(sorted)}</span>
    </button>
  );
}

function useHydration(retryKey: number) {
  useEffect(() => {
    let cancelled = false;
    if (useAppStore.getState().isLoading) {
      const load = async () => {
        try {
          const record = await db.appdata.get(1);
          if (cancelled) return;
          const raw = record?.data ?? seedData;
          useAppStore.getState().loadData(AppDataSchema.parse(raw));
        } catch (error: unknown) {
          /* v8 ignore next 2 -- cancelled=true on unmount-during-error and non-Error throws are defensive */
          if (!cancelled) {
            const err = error instanceof Error ? error : new Error(String(error));
            useAppStore.getState().setLoadError(err);
          }
        }
      };
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [retryKey]);
}

function useDexieSync() {
  useEffect(() => {
    let writeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    const unsubscribe = useAppStore.subscribe(
      state => state.data,
      newData => {
        clearTimeout(writeTimer);
        writeTimer = setTimeout(() => {
          const save = async () => {
            try {
              await db.appdata.put({ data: newData, id: 1 });
            } catch {
              // Silently ignore: write failure is non-critical (in-memory state stays correct)
            }
          };
          void save();
        }, DEBOUNCE_MS);
      },
    );
    return () => {
      unsubscribe();
      clearTimeout(writeTimer);
    };
  }, []);
}

function useIsinTableState() {
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
  const resolvedVisibility = useMemo(
    () => ({ ...DEFAULT_COLUMN_VISIBILITY, ...data.settings.columnVisibility }),
    [data.settings.columnVisibility],
  );
  const sorting: SortingState = useMemo(
    () => [{ desc: data.settings.sort.direction === "desc", id: data.settings.sort.column }],
    [data.settings.sort],
  );
  const filteredAssets = useMemo(() => {
    const lower = filterText.trim().toLowerCase();
    if (!lower) return data.assets;
    return data.assets.filter(row => matchesFilter(row, lower));
  }, [data.assets, filterText]);
  const table = useTableInstance({ filteredAssets, resolvedVisibility, setColumnVisibility, setSort, sorting });
  const { rows } = table.getRowModel();
  const quintileClasses = useMemo(() => computeQuintileClasses(rows), [rows]);
  const visibleLeafCount = table.getVisibleLeafColumns().length;
  return {
    data,
    filterText,
    handleRetry,
    isLoading,
    loadError,
    quintileClasses,
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
    <thead className="sticky top-6 z-10 bg-base-100">
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

function renderTableBody(table: Table<Asset>, quintileClasses: Map<string, Map<string, string | undefined>>) {
  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className="hover">
          {row.getVisibleCells().map(cell => {
            const qClass = quintileClasses.get(cell.column.id)?.get(row.id);
            const isScoreCol = cell.column.id === "score";
            const bgClass = qClass ?? (isScoreCol ? "bg-base-200" : undefined);
            const tdClass = [isScoreCol ? "font-semibold" : undefined, bgClass].filter(Boolean).join(" ") || undefined;
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

export function IsinTable() {
  const {
    data,
    filterText,
    handleRetry,
    isLoading,
    loadError,
    quintileClasses,
    setFilterText,
    table,
    visibleLeafCount,
  } = useIsinTableState();
  if (isLoading) return renderSkeleton();
  if (loadError) return renderError(loadError, handleRetry);
  if (data.assets.length === 0) return renderEmpty();
  return (
    <>
      {renderPageHeader(data.assets)}
      <div className="relative p-4 text-left">
        <div className="absolute top-6 left-4 z-20 flex gap-4">
          {renderSearchFilter(filterText, setFilterText)}
          {renderColumnFilter(table, visibleLeafCount)}
        </div>
        <table className="table-hover table w-full">
          <caption className="sr-only">ISINs reference data table</caption>
          {renderTableHeader(table)}
          {renderTableBody(table, quintileClasses)}
        </table>
      </div>
    </>
  );
}
