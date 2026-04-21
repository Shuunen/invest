import type { ColumnDef } from "@tanstack/react-table";
import { computeScore, type Isin } from "../schemas/index.ts";
import { DECIMAL_PLACES, formatNumber, SCORE_WARNING_THRESHOLD } from "./isin-table-utils.ts";

function booleanCell(value: boolean) {
  return (
    <span aria-label={value ? "Yes" : "No"} className={`badge ${value ? "badge-success" : "badge-ghost"}`}>
      {value ? "Yes" : "No"}
    </span>
  );
}

function getAriaSortValue(sorted: "asc" | "desc" | false): "ascending" | "descending" | "none" {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
}

export { getAriaSortValue };

export const columns: ColumnDef<Isin>[] = [
  {
    accessorFn: row => computeScore(row),
    cell: ({ getValue }) => {
      const score = getValue<number | undefined>();
      if (score === undefined) return "—";
      const cls = Math.abs(score) > SCORE_WARNING_THRESHOLD ? "text-warning" : "";
      return (
        <span className={cls} title="Score = 3y performance + (3y risk/reward × 5) − (fees × 10)">
          {score.toFixed(DECIMAL_PLACES)}
        </span>
      );
    },
    header: "Score",
    id: "score",
    sortingFn: (rowA, rowB) => {
      const sa = computeScore(rowA.original);
      const sb = computeScore(rowB.original);
      if (sa === undefined && sb === undefined) return 0;
      if (sa === undefined) return 1;
      if (sb === undefined) return -1;
      return sa - sb;
    },
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
    enableSorting: false,
    header: "Tickers",
  },
  {
    accessorKey: "name",
    cell: ({ getValue }) => (
      <span className="max-w-xs block truncate" title={getValue<string>()}>
        {getValue<string>()}
      </span>
    ),
    header: "Name",
  },
  {
    accessorKey: "isAccumulating",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    enableSorting: false,
    header: "Acc",
  },
  {
    accessorKey: "availableOnBroker",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    enableSorting: false,
    header: "Broker",
  },
  {
    accessorKey: "availableForPlan",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    enableSorting: false,
    header: "Plan",
  },
  {
    accessorKey: "fees",
    cell: ({ getValue }) => `${getValue<number>().toFixed(DECIMAL_PLACES)}%`,
    header: "Fees",
  },
  {
    columns: [
      {
        accessorKey: "performance1y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "1y",
      },
      {
        accessorKey: "performance3y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "3y",
      },
      {
        accessorKey: "performance5y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "5y",
      },
    ],
    header: "Performance",
    id: "performance",
  },
  {
    columns: [
      {
        accessorKey: "riskReward1y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "1y",
      },
      {
        accessorKey: "riskReward3y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "3y",
      },
      {
        accessorKey: "riskReward5y",
        cell: ({ getValue }) => formatNumber(getValue<number | undefined>()),
        header: "5y",
      },
    ],
    header: "Risk/Reward",
    id: "riskReward",
  },
];
