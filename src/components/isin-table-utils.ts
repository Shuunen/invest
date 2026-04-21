import type { Row } from "@tanstack/react-table";
import { computeScore, type Isin } from "../schemas/index.ts";

export const DECIMAL_PLACES = 2;
export const MIN_ROWS_FOR_FORMATTING = 10;
export const QUINTILE_HIGH_THRESHOLD = 0.8;
export const QUINTILE_LOW_THRESHOLD = 0.2;
export const SCORE_WARNING_THRESHOLD = 100;
export const SKELETON_COLS = 9;
export const SKELETON_ROWS = 5;

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  availableForPlan: false,
  availableOnBroker: false,
  isAccumulating: false,
  performance1y: false,
  riskReward1y: false,
  tickers: false,
};

const NUMERIC_COL_IDS = [
  "fees",
  "performance1y",
  "performance3y",
  "performance5y",
  "riskReward1y",
  "riskReward3y",
  "riskReward5y",
  "score",
];

export function quintileClass(value: number | undefined, allValues: (number | undefined)[]): string | undefined {
  if (value === undefined) return undefined;
  const defined = allValues.filter((val): val is number => val !== undefined);
  if (defined.length < MIN_ROWS_FOR_FORMATTING) return undefined;
  const below = defined.filter(num => num < value).length;
  const pct = below / defined.length;
  if (pct >= QUINTILE_HIGH_THRESHOLD) return "bg-success/20 text-success-content";
  if (pct < QUINTILE_LOW_THRESHOLD) return "bg-error/20 text-error-content";
  return undefined;
}

export function formatNumber(val: number | undefined): string {
  return val === undefined ? "—" : val.toFixed(DECIMAL_PLACES);
}

export function computeQuintileClasses(rows: Row<Isin>[]): Map<string, Map<string, string | undefined>> {
  return new Map(
    NUMERIC_COL_IDS.map(colId => {
      const allValues = rows.map((row): number | undefined =>
        colId === "score" ? computeScore(row.original) : (row.original[colId as keyof Isin] as number | undefined),
      );
      const rowClassMap = new Map(
        rows.map(row => {
          const cellValue =
            colId === "score" ? computeScore(row.original) : (row.original[colId as keyof Isin] as number | undefined);
          return [row.id, quintileClass(cellValue, allValues)];
        }),
      );
      return [colId, rowClassMap];
    }),
  );
}
