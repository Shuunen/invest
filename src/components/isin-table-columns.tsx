import type { ColumnDef } from "@tanstack/react-table";
import { computeScore, type Asset } from "../schemas/index.ts";
import { cn } from "../utils/browser-styles.ts";
import { DECIMAL_PLACES, formatNumber, SCORE_HIGH_THRESHOLD, SCORE_MISSING_VALUE } from "./isin-table-utils.ts";

function booleanCell(value: boolean) {
  return (
    <span aria-label={value ? "Yes" : "No"} className={`badge ${value ? cn("bg-success/40") : cn("badge-ghost")}`}>
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

function getScoreDotClass(score: number): string {
  if (score >= SCORE_HIGH_THRESHOLD) return "bg-success";
  if (score < 0) return "bg-error";
  return "bg-warning";
}

export const columns: ColumnDef<Asset>[] = [
  {
    accessorFn: row => computeScore(row) ?? SCORE_MISSING_VALUE,
    cell: ({ getValue }) => {
      const score = getValue<number>();
      const isMissing = score === SCORE_MISSING_VALUE;
      if (isMissing) return <span className="text-base-content/40">—</span>;
      const dotClass = getScoreDotClass(score);
      return (
        <span className="flex items-center gap-1.5" title="Score = 3y performance + (3y risk/reward × 5) − (fees × 10)">
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
          {score.toFixed(DECIMAL_PLACES)}
        </span>
      );
    },
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
    cell: ({ getValue }) => (
      <span className="block max-w-xs truncate" title={getValue<string>()}>
        {getValue<string>()}
      </span>
    ),
    header: "Name",
  },
  {
    accessorKey: "isAccumulating",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    header: "Acc",
  },
  {
    accessorKey: "availableOnBroker",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
    header: "Broker",
  },
  {
    accessorKey: "availableForPlan",
    cell: ({ getValue }) => booleanCell(getValue<boolean>()),
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
