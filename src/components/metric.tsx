import { kebabCase } from "es-toolkit";
import { cn } from "../utils/browser-styles";
import { formatNumber } from "../utils/format-numbers";
import { TextRoll } from "./animations/text-roll";

export type MetricItem = {
  color: "success" | "neutral" | "error" | "warning" | "info";
  label: string | number;
  value: string | number | undefined;
};

export function Metric({ label, value, color }: MetricItem) {
  const displayValue = typeof value === "number" ? formatNumber(value) : (value ?? "—");
  return (
    <div className="flex flex-col gap-2 py-2">
      <span
        data-testid={`metric-${kebabCase(String(label))}-value`}
        className={cn(`font-mono text-xl font-bold tracking-tight`, {
          "text-error": color === "error",
          "text-info": color === "info",
          "text-neutral": color === "neutral",
          "text-success": color === "success",
          "text-warning": color === "warning",
        })}
      >
        <TextRoll>{displayValue}</TextRoll>
      </span>
      <span data-testid={`metric-${kebabCase(String(label))}-label`} className="text-xs font-medium tracking-widest text-base-content/40 uppercase">
        {label}
      </span>
    </div>
  );
}
