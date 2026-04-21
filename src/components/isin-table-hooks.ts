import { getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import type { Isin } from "../schemas/index.ts";
import { columns } from "./isin-table-columns.tsx";

export function matchesFilter(isin: Isin, lower: string): boolean {
  if (isin.isin.toLowerCase().includes(lower)) return true;
  if (isin.name.toLowerCase().includes(lower)) return true;
  if (isin.provider.toLowerCase().includes(lower)) return true;
  return isin.tickers.some(ticker => ticker.toLowerCase().includes(lower));
}

type UseTableInstanceOptions = {
  filteredIsins: Isin[];
  resolvedVisibility: Record<string, boolean>;
  setColumnVisibility: (vis: Record<string, boolean>) => void;
  setSort: (sort: { column: string; direction: "asc" | "desc" }) => void;
  sorting: SortingState;
};

export function useTableInstance({
  filteredIsins,
  resolvedVisibility,
  setColumnVisibility,
  setSort,
  sorting,
}: UseTableInstanceOptions) {
  return useReactTable({
    columns,
    data: filteredIsins,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: updater => {
      const next = typeof updater === "function" ? updater(resolvedVisibility) : updater;
      setColumnVisibility(next);
    },
    onSortingChange: updater => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length > 0) {
        const [{ id, desc }] = next;
        setSort({ column: id, direction: desc ? "desc" : "asc" });
      } else setSort({ column: sorting[0]?.id ?? "score", direction: "asc" });
    },
    sortDescFirst: false,
    state: { columnVisibility: resolvedVisibility, sorting },
  });
}
