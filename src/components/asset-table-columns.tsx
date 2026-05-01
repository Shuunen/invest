import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { computeScore, type Asset } from "../schemas/index.ts";
import { cn } from "../utils/browser-styles.ts";
import { formatNumber, formatPercent, formatPrice, SCORE_MISSING_VALUE } from "./asset-table-utils.ts";

declare module "@tanstack/react-table" {
  // oxlint-disable-next-line typescript-eslint/consistent-type-definitions
  interface ColumnMeta<TData, TValue> {
    center?: boolean;
    title?: string;
  }
}

export type AssetTableMeta = {
  onAmountChange?: (isin: string, amount: number) => void;
  onPriceChange?: (isin: string, price: number) => void;
  onToggleSelect?: (isin: string) => void;
  selectedIsins?: Set<string>;
  amountMap?: Map<string, number>;
};

function booleanCell(isin: string, field: string, value: boolean) {
  return (
    <span data-testid={`bool-${field}-${isin.toLowerCase()}`} aria-label={value ? "Yes" : "No"} className={cn("badge", { "bg-error/10": !value, "bg-success/10": value })}>
      {value ? "Yes" : "No"}
    </span>
  );
}

export function makeSelectColumn(): ColumnDef<Asset> {
  return {
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      return (
        <input
          type="checkbox"
          data-testid={`select-${row.original.isin.toLowerCase()}`}
          className="checkbox checkbox-sm checkbox-primary"
          checked={meta?.selectedIsins?.has(row.original.isin) ?? false}
          onChange={() => meta?.onToggleSelect?.(row.original.isin)}
          onClick={event => event.stopPropagation()}
        />
      );
    },
    enableHiding: false,
    enableSorting: false,
    header: "",
    id: "select",
  };
}

export function makeValueColumn(amountMap: Map<string, number> | undefined): ColumnDef<Asset> {
  return {
    accessorFn: row => (amountMap?.get(row.isin) ?? 0) * (row.price ?? 0),
    cell: ({ getValue, row }) => <span data-testid={`value-${row.original.isin.toLowerCase()}`}>{`${formatNumber(getValue<number>())} €`}</span>,
    header: "Value",
    id: "value",
    meta: { center: true, title: "Value : amount * price in €" },
  };
}

export function makeAmountColumn(amountMap: Map<string, number> | undefined): ColumnDef<Asset> {
  return {
    accessorFn: row => amountMap?.get(row.isin) ?? 0,
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const { isin } = row.original;
      const value = meta?.amountMap?.get(isin) ?? 0;
      return (
        <input
          type="number"
          className="input input-xs w-12 text-center"
          min={0}
          defaultValue={value}
          key={value}
          id={`amount-input-${isin.toLowerCase()}`}
          data-testid={`amount-input-${isin.toLowerCase()}`}
          aria-label={`Amount for ${row.original.name}`}
          onClick={event => event.stopPropagation()}
          onBlur={event => {
            const amount = Math.max(0, Number(event.target.value) || 0);
            if (amount !== value) meta?.onAmountChange?.(isin, amount);
          }}
        />
      );
    },
    header: "Amount",
    id: "amount",
    meta: { center: true, title: "Amount of units held" },
  };
}

export function makePriceEditColumn(): ColumnDef<Asset> {
  return {
    accessorKey: "price",
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const { isin } = row.original;
      const value = row.original.price;
      return (
        <input
          type="number"
          className="input input-xs w-20 text-center"
          min={0}
          step={0.01}
          defaultValue={value}
          key={value}
          id={`price-input-${isin.toLowerCase()}`}
          data-testid={`price-input-${isin.toLowerCase()}`}
          aria-label={`Price for ${row.original.name}`}
          onClick={event => event.stopPropagation()}
          onBlur={event => {
            const price = Math.max(0, Number(event.target.value) || 0);
            if (price !== value) meta?.onPriceChange?.(isin, price);
          }}
        />
      );
    },
    header: "Price",
    id: "price",
    meta: { center: true, title: "Price of one asset in €" },
  };
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
    cell: ({ getValue }) => (
      <span className="font-mono text-xs" data-testid={`isin-${getValue<string>().toLowerCase()}`}>
        {getValue<string>()}
      </span>
    ),
    header: "ISIN",
  },
  {
    accessorKey: "tickers",
    cell: ({ getValue, row }) => <span data-testid={`tickers-${row.original.isin.toLowerCase()}`}>{getValue<string[]>().join(", ")}</span>,
    header: "Tickers",
    sortingFn: (rowA, rowB) => {
      const tickersA = rowA.original.tickers.join(", ");
      const tickersB = rowB.original.tickers.join(", ");
      return tickersA.localeCompare(tickersB);
    },
  },
  {
    accessorKey: "name",
    cell: ({ getValue, row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const name = getValue<string>();
      const { isin } = row.original;
      const inner = (
        <span className={cn("block max-w-xs truncate", { "link link-primary link-hover": !meta?.onToggleSelect })} data-testid={`name-${isin.toLowerCase()}`} title={name}>
          {name}
        </span>
      );
      if (meta?.onToggleSelect) return inner;
      return (
        <Link to="/assets/$isin" params={{ isin }}>
          {inner}
        </Link>
      );
    },
    header: "Name",
  },
  {
    accessorKey: "isAccumulating",
    cell: ({ getValue, row }) => booleanCell(row.original.isin, "is-accumulating", getValue<boolean>()),
    header: "Acc",
    meta: { title: "Accumulating" },
  },
  {
    accessorKey: "availableOnBroker",
    cell: ({ getValue, row }) => booleanCell(row.original.isin, "available-on-broker", getValue<boolean>()),
    header: "Broker",
    meta: { title: "Broker availability" },
  },
  {
    accessorKey: "availableForPlan",
    cell: ({ getValue, row }) => booleanCell(row.original.isin, "available-for-plan", getValue<boolean>()),
    header: "Plan",
    meta: { title: "Plan compatibility" },
  },
  {
    accessorKey: "fees",
    cell: ({ getValue }) => formatPercent(getValue<number>()),
    header: "Fees",
    meta: { center: true, title: "Fees in %" },
  },
  {
    accessorKey: "performance1y",
    cell: ({ getValue, row }) => <span data-testid={`performance1y-${row.original.isin.toLowerCase()}`}>{formatNumber(getValue<number | undefined>())}</span>,
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
    cell: ({ getValue, row }) => <span data-testid={`risk-reward1y-${row.original.isin.toLowerCase()}`}>{formatNumber(getValue<number | undefined>())}</span>,
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
    cell: ({ getValue }) => formatPrice(getValue<number | undefined>()),
    header: "Price",
    id: "price",
    meta: { center: true, title: "Price of one asset in €" },
  },
];

export function makeRemoveColumn(onRemove: (isin: string) => void): ColumnDef<Asset> {
  return {
    cell: ({ row }) => (
      <button type="button" data-testid={`remove-${row.original.isin.toLowerCase()}`} className="btn text-error btn-ghost btn-xs" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original.isin)}>
        <Trash2 size={14} />
      </button>
    ),
    enableHiding: false,
    enableSorting: false,
    header: "",
    id: "remove",
  };
}
