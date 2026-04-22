import type { Row } from "@tanstack/react-table";
import { computeScore, type Asset } from "../schemas/index.ts";

export const DECIMAL_PLACES = 2;
export const MIN_ROWS_FOR_FORMATTING = 10;
export const QUINTILE_HIGH_THRESHOLD = 0.8;
export const QUINTILE_LOW_THRESHOLD = 0.2;
export const SCORE_HIGH_THRESHOLD = 4;
export const SCORE_MISSING_VALUE = -100;
export const SCORE_TITLE = "Score = 3y performance + (3y risk/reward × 5) − (fees × 10)";

export function getAriaSortValue(sorted: "asc" | "desc" | false): "ascending" | "descending" | "none" {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
}

export function getScoreDotClass(score: number): string {
  if (score >= SCORE_HIGH_THRESHOLD) return "bg-success";
  if (score < 0) return "bg-error";
  return "bg-warning";
}
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

// Private: O(log n) quintile lookup using a pre-sorted defined-values array.
function quintileClassFromSorted(value: number | undefined, sortedDefined: number[]): string | undefined {
  if (value === undefined) return undefined;
  if (sortedDefined.length < MIN_ROWS_FOR_FORMATTING) return undefined;
  const below = sortedDefined.filter(val => val < value).length;
  const pct = below / sortedDefined.length;
  if (pct >= QUINTILE_HIGH_THRESHOLD) return "bg-success/20 text-success-content";
  if (pct < QUINTILE_LOW_THRESHOLD) return "bg-error/20 text-error-content";
  return undefined;
}

export function formatNumber(val: number | undefined): string {
  return val === undefined ? "—" : val.toFixed(DECIMAL_PLACES);
}

export function computeQuintileClasses(rows: Row<Asset>[]): Map<string, Map<string, string | undefined>> {
  // Pre-compute scores once per row to avoid redundant calls in the score column
  const scoreCache = new Map(rows.map(row => [row.id, computeScore(row.original)]));
  return new Map(
    NUMERIC_COL_IDS.map(colId => {
      const allValues = rows.map((row): number | undefined =>
        colId === "score" ? scoreCache.get(row.id) : (row.original[colId as keyof Asset] as number | undefined),
      );
      // Pre-filter undefined values once per column so quintileClassFromSorted can skip that work per-row
      const definedValues = allValues.filter((val): val is number => val !== undefined);
      const rowClassMap = new Map(
        rows.map((row, rowIdx) => [row.id, quintileClassFromSorted(allValues[rowIdx], definedValues)]),
      );
      return [colId, rowClassMap];
    }),
  );
}
