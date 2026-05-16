import { ArrowDownToDot, type LucideIcon, EqualIcon, TrendingDown, TrendingUp } from "lucide-react";

const almostEqualThreshold = 0.02;
const significantChangeThreshold = 0.1;
const suspiciousChangeThreshold = 0.2;

export type Trend = "almost-equal" | "decreased-a-bit" | "decreased-a-lot" | "increased-a-bit" | "increased-a-lot" | "decreased-to-zero";

export type TrendResult = {
  Icon: LucideIcon;
  trend: Trend;
  message: string;
  showWarning: boolean;
  color?: string;
};

const trendResults: Record<Trend, Omit<TrendResult, "showWarning" | "trend">> = {
  "almost-equal": { Icon: EqualIcon, color: "var(--color-base-300)", message: "Almost equals" },
  "decreased-a-bit": { Icon: TrendingDown, color: "var(--color-error)", message: "Decreased a bit" },
  "decreased-a-lot": { Icon: TrendingDown, color: "var(--color-error)", message: "Decreased a lot" },
  "decreased-to-zero": { Icon: ArrowDownToDot, color: "var(--color-error)", message: "Decreased to zero" },
  "increased-a-bit": { Icon: TrendingUp, color: "var(--color-success)", message: "Increased a bit" },
  "increased-a-lot": { Icon: TrendingUp, color: "var(--color-success)", message: "Increased a lot" },
};

function createTrendResult(trend: Trend, showWarning: boolean): TrendResult {
  return { ...trendResults[trend], showWarning, trend };
}

function getTrendFromChange(change: number): Trend {
  if (change <= -significantChangeThreshold) return "decreased-a-lot";
  if (change < -almostEqualThreshold) return "decreased-a-bit";
  if (change <= almostEqualThreshold) return "almost-equal";
  if (change < significantChangeThreshold) return "increased-a-bit";
  return "increased-a-lot";
}

export function computeTrend(before: number, after: number): TrendResult {
  if (before > 0 && after === 0) {
    const change = (after - before) / Math.abs(before);
    const showWarning = Math.abs(change) >= suspiciousChangeThreshold;
    return createTrendResult("decreased-to-zero", showWarning);
  }
  if (before === 0) {
    if (after === 0) return createTrendResult("almost-equal", false);
    const change = after > 0 ? significantChangeThreshold : -significantChangeThreshold;
    const showWarning = Math.abs(change) >= suspiciousChangeThreshold;
    return after > 0 ? createTrendResult("increased-a-lot", showWarning) : createTrendResult("decreased-a-lot", showWarning);
  }
  const change = (after - before) / Math.abs(before);
  const showWarning = Math.abs(change) >= suspiciousChangeThreshold;
  return createTrendResult(getTrendFromChange(change), showWarning);
}
