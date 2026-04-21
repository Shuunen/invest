import { flexRender, type Header, type SortingState, type Table } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import sampleJson from "../../data/sample.json";
import { db } from "../db/db.ts";
import { AppDataSchema, type AppData, type Isin } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { getAriaSortValue } from "./isin-table-columns.tsx";
import { matchesFilter, useTableInstance } from "./isin-table-hooks.ts";
import { computeQuintileClasses, DEFAULT_COLUMN_VISIBILITY, SKELETON_COLS, SKELETON_ROWS } from "./isin-table-utils.ts";

const DEBOUNCE_MS = 300;
const seedResult = AppDataSchema.safeParse(sampleJson);
const seedData: AppData = seedResult.success ? seedResult.data : { ...defaultAppData };

function getSortIndicator(sorted: "asc" | "desc" | false): string {
  if (sorted === "asc") return " ▲";
  if (sorted === "desc") return " ▼";
  return "";
}

function renderThContent(header: Header<Isin, unknown>) {
  if (header.isPlaceholder) return undefined;
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) return <span>{label}</span>;
  return (
    <button
      type="button"
      className="flex min-h-11 cursor-pointer items-center gap-1"
      onClick={header.column.getToggleSortingHandler()}
    >
      {label}
      {getSortIndicator(sorted)}
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
  const filteredIsins = useMemo(() => {
    const lower = filterText.trim().toLowerCase();
    if (!lower) return data.isins;
    return data.isins.filter(row => matchesFilter(row, lower));
  }, [data.isins, filterText]);
  const table = useTableInstance({ filteredIsins, resolvedVisibility, setColumnVisibility, setSort, sorting });
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
      <p className="mb-4 text-base-content/60">Import a JSON file to get started</p>
      <button type="button" className="btn btn-disabled" disabled>
        Import
      </button>
    </div>
  );
}

function renderColumnVisibility(table: Table<Isin>, visibleLeafCount: number) {
  return (
    <div className="mb-2 flex justify-end">
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
          ☰ Columns
        </div>
        <div tabIndex={0} className="dropdown-content menu z-9999 w-52 rounded-box bg-base-100 p-2 shadow">
          {table.getAllLeafColumns().map(column => (
            <label key={column.id} className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={column.getIsVisible()}
                disabled={column.getIsVisible() && visibleLeafCount <= 1}
                onChange={column.getToggleVisibilityHandler()}
              />
              <span className="label-text">{String(column.columnDef.header)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderTableHeader(table: Table<Isin>) {
  return (
    <thead className="sticky top-0 z-10 bg-base-100">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th
              key={header.id}
              aria-sort={header.column.getCanSort() ? getAriaSortValue(header.column.getIsSorted()) : undefined}
              className={header.column.getIsSorted() ? "font-semibold" : undefined}
              colSpan={header.colSpan}
              scope="col"
            >
              {renderThContent(header)}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

function renderTableBody(table: Table<Isin>, quintileClasses: Map<string, Map<string, string | undefined>>) {
  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className="hover">
          {row.getVisibleCells().map(cell => {
            const qClass = quintileClasses.get(cell.column.id)?.get(row.id);
            const isScoreCol = cell.column.id === "score";
            const bgClass = qClass ?? (isScoreCol ? "bg-base-200" : undefined);
            const tdClass = [isScoreCol ? "font-semibold" : undefined, bgClass].filter(Boolean).join(" ") || undefined;
            return (
              <td key={cell.id} className={tdClass}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

function renderFilter(filterText: string, setFilterText: (value: string) => void) {
  return (
    <input
      type="search"
      className="input-bordered input input-sm mb-2 w-full max-w-sm"
      placeholder="Search ISIN, name, tickers…"
      value={filterText}
      onChange={event => {
        setFilterText(event.target.value);
      }}
    />
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
  if (data.isins.length === 0) return renderEmpty();
  return (
    <div className="p-4 text-left">
      <div className="mb-2 flex items-center justify-between gap-2">
        {renderFilter(filterText, setFilterText)}
        {renderColumnVisibility(table, visibleLeafCount)}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="table-hover table w-full">
          <caption className="sr-only">ISINs reference data table</caption>
          {renderTableHeader(table)}
          {renderTableBody(table, quintileClasses)}
        </table>
      </div>
    </div>
  );
}
