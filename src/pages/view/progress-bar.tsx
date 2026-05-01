import { kebabCase } from "es-toolkit";
import { formatPercent } from "../../components/asset-table-utils";
import { cn } from "../../utils/browser-styles";

const errorUntil = 33;
const warningUntil = 66;
const errorAfter = 100;

export function ProgressBar({ name, total }: { name: string; total: number }) {
  return (
    <div className="mb-2 flex items-center gap-4">
      <progress
        className={cn("progress w-full", {
          "progress-error": total < errorUntil || total > errorAfter,
          "progress-success": total > warningUntil && total <= errorAfter,
          "progress-warning": total >= errorUntil && total <= warningUntil,
        })}
        value={total}
        max="100"
      />
      <span
        className={cn("flex font-medium whitespace-nowrap", {
          "text-error": total < errorUntil || total > errorAfter,
          "text-success": total > warningUntil && total <= errorAfter,
          "text-warning": total >= errorUntil && total <= warningUntil,
        })}
        data-testid={kebabCase(`progress-bar-${name}`)}
      >
        {formatPercent(total)}
      </span>
    </div>
  );
}
