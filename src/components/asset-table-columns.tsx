import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { computeScore, type Asset } from "../schemas/index.ts";
import { cn } from "../utils/browser-styles.ts";
import { DECIMAL_PLACES, formatNumber, SCORE_MISSING_VALUE } from "./asset-table-utils.ts";

declare module "@tanstack/react-table" {
  // oxlint-disable-next-line typescript-eslint/consistent-type-definitions
  interface ColumnMeta<TData, TValue> {
    center?: boolean;
    title?: string;
  }
}

function booleanCell(value: boolean) {
  return (
    <span aria-label={value ? "Yes" : "No"} className={`badge ${value ? cn("bg-success/40") : cn("badge-ghost")}`}>
      {value ? "Yes" : "No"}
    </span>
  );
}

export const columns: ColumnDef<Asset>[] = [
  {
    accessorFn: row => computeScore(row) ?? SCORE_MISSING_VALUE,
    cell: ({ getValue }) => formatNumber(getValue<number>()),
    header: "Score",
    id: "score",
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
  {
    accessorKey: "isin",
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    header: "ISIN",
  },
  {
    accessorKey: "tickers",
    cell: ({ getValue }) => getValue<string[]>().join(", "),
    header: "Tickers",
    sortingFn: (rowA, rowB) => {
      const tickersA = rowA.original.tickers.join(", ");
      const tickersB = rowB.original.tickers.join(", ");
      return tickersA.localeCompare(tickersB);
    },
  },
  {
    accessorKey: "name",
    cell: ({ getValue, row }) => (
      <Link to="/assets/$isin" params={{ isin: row.original.isin }}>
        <span className="block max-w-xs link truncate link-primary link-hover" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      </Link>
    ),
    header: "Name",
  },
  {
    accessorKey: "isAccumulating",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    header: "Acc",
    meta: { title: "Accumulating" },
  },
  {
    accessorKey: "availableOnBroker",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    header: "Broker",
    meta: { title: "Broker availability" },
  },
  {
    accessorKey: "availableForPlan",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    header: "Plan",
    meta: { title: "Plan compatibility" },
  },
  {
    accessorKey: "fees",
    cell: ({ getValue }) => `${getValue<number>().toFixed(DECIMAL_PLACES)}%`,
    header: "Fees",
    meta: { center: true, title: "Fees in %" },
  },
  {
    accessorKey: "performance1y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "P1y",
    meta: { center: true, title: "Performance over 1 year" },
  },
  {
    accessorKey: "performance3y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "P3y",
    meta: { center: true, title: "Performance over 3 years" },
  },
  {
    accessorKey: "performance5y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "P5y",
    meta: { center: true, title: "Performance over 5 years" },
  },
  {
    accessorKey: "riskReward1y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "RR1y",
    meta: { center: true, title: "Risk/Reward over 1 year" },
  },
  {
    accessorKey: "riskReward3y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "RR3y",
    meta: { center: true, title: "Risk/Reward over 3 years" },
  },
  {
    accessorKey: "riskReward5y",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "RR5y",
    meta: { center: true, title: "Risk/Reward over 5 years" },
  },
  {
    accessorKey: "price",
    cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
    header: "Price",
    id: "price",
    meta: { center: true, title: "Price of one asset in €" },
  },
];

export function makeRemoveColumn(onRemove: (isin: string) => void): ColumnDef<Asset> {
  return {
    cell: ({ row }) => (
      <button type="button" className="btn text-error btn-ghost btn-xs" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original.isin)}>
        <Trash2 size={14} />
      </button>
    ),
    enableHiding: false,
    enableSorting: false,
    header: "",
    id: "remove",
  };
}
