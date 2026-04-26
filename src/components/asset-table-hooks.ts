import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import type { Asset } from "../schemas/index.ts";

export function matchesFilter(asset: Asset, lower: string): boolean {
  if (asset.isin.toLowerCase().includes(lower)) return true;
  if (asset.name.toLowerCase().includes(lower)) return true;
  if (asset.provider.toLowerCase().includes(lower)) return true;
  return asset.tickers.some(ticker => ticker.toLowerCase().includes(lower));
}

type UseTableInstanceOptions = {
  columns: ColumnDef<Asset>[];
  filteredAssets: Asset[];
  meta?: { onToggleSelect?: (isin: string) => void; selectedIsins?: Set<string> };
  resolvedVisibility: Record<string, boolean>;
  setColumnVisibility: (vis: Record<string, boolean>) => void;
  setSort: (sort: { column: string; direction: "asc" | "desc" }) => void;
  sorting: SortingState;
};

export function useTableInstance({ columns, filteredAssets, meta, resolvedVisibility, setColumnVisibility, setSort, sorting }: UseTableInstanceOptions) {
  return useReactTable({
    columns,
    data: filteredAssets,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
    onColumnVisibilityChange: updater => {
      /* v8 ignore next -- TanStack Table always passes a function updater; direct value path is defensive */
      const next = typeof updater === "function" ? updater(resolvedVisibility) : updater;
      setColumnVisibility(next);
    },
    onSortingChange: updater => {
      /* v8 ignore next -- TanStack Table always passes a function updater; direct value path is defensive */
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length > 0) {
        const [{ id, desc }] = next;
        setSort({ column: id, direction: desc ? "desc" : "asc" });
        return;
      }
      /* v8 ignore next -- sorting is always a 1-element array; "score" fallback is unreachable */
      setSort({ column: sorting[0]?.id ?? "score", direction: "asc" });
    },
    sortDescFirst: false,
    state: { columnVisibility: resolvedVisibility, sorting },
  });
}
