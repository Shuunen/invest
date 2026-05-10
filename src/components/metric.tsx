import { kebabCase } from "es-toolkit/string";
import { cn } from "../utils/browser-styles";
import { formatNumber } from "../utils/format-numbers";

export type MetricItem = {
  color: "success" | "neutral" | "error" | "warning" | "info";
  label: string | number;
  value: string | number | undefined;
};

export function Metric({ label, value, color }: MetricItem) {
  const displayValue = typeof value === "number" ? formatNumber(value) : (value ?? "—");
  return (
    <div className="flex flex-col gap-0.5">
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
        {displayValue}
      </span>
      <span data-testid={`metric-${kebabCase(String(label))}-label`} className="text-[10px] font-medium tracking-widest text-base-content/40 uppercase">
        {label}
      </span>
    </div>
  );
}
