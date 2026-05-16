import { kebabCase } from "es-toolkit";
import { TriangleAlertIcon } from "lucide-react";
import { ModalActions } from "../../components/modal-actions";
import { ModalHeader } from "../../components/modal-header";
import { cn } from "../../utils/browser-styles.ts";
import { computeTrend } from "../../utils/trend.ts";
import type { DiffRow } from "./form-diff.ts";

type Props = {
  diffRows: DiffRow[];
  onClose: () => void;
  onConfirm: () => void;
  onReset: () => void;
  onResetRow?: (row: DiffRow) => void;
};

function parseNumericDiffValue(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "-" || trimmed === "") return undefined;
  const numericPart = trimmed.replaceAll(",", ".").replaceAll(/[^\d.+-]/gu, "");
  if (numericPart === "" || numericPart === "+" || numericPart === "-" || numericPart === "." || numericPart === "+." || numericPart === "-.") return undefined;
  const parsed = Number(numericPart);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function renderAfterCell(row: DiffRow) {
  const before = parseNumericDiffValue(row.before);
  const after = parseNumericDiffValue(row.after);
  if (before === undefined || after === undefined) return row.after;
  const { Icon, color, message, showWarning, trend } = computeTrend(before, after);
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn({ "opacity-30": trend === "almost-equal" })}>{row.after}</span>
      <Icon aria-label={message} color={color} size={16} data-testid={`after-trend-${kebabCase(row.field)}`} />
      {/* oxlint-disable-next-line react/forbid-component-props */}
      {showWarning && <TriangleAlertIcon className="animate-pulse" color="var(--color-warning)" size={16} data-testid={`after-trend-warning-${kebabCase(row.field)}`} aria-label="Warning: large change" />}
    </span>
  );
}

function renderDiffRowsTable(diffRows: DiffRow[], onResetRow?: (row: DiffRow) => void) {
  return (
    <div className="mt-4 max-h-96 overflow-auto rounded-box">
      <table className="table table-zebra table-sm" data-testid="confirm-save-diff-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Before</th>
            <th>After</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {diffRows.map(row => (
            <tr key={row.field} data-testid={`change-row-${kebabCase(row.field)}`} className="group rounded outline-1 -outline-offset-1 outline-transparent transition-colors hover:outline-primary">
              <td className="whitespace-nowrap">{row.field}</td>
              <td className="font-mono text-sm whitespace-nowrap">{row.before}</td>
              <td className="font-mono text-sm whitespace-nowrap">{renderAfterCell(row)}</td>
              <td className="whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`reset-row-${kebabCase(row.field)}`}
                  className="btn h-auto min-h-0 p-0 btn-link opacity-0 transition-opacity btn-xs group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onResetRow?.(row)}
                >
                  Reset
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderNoChangesNotice() {
  return (
    <div className="mt-4 alert alert-outline alert-info" data-testid="confirm-save-no-changes">
      <span>No form changes detected. Saving will keep the current values.</span>
    </div>
  );
}

export function SaveModal({ diffRows, onClose, onConfirm, onReset, onResetRow }: Props) {
  return (
    <dialog className="modal-open modal" aria-modal="true" data-testid="confirm-save-modal">
      <div className="modal-box max-w-3xl">
        <ModalHeader title="Confirm changes before saving" subtitle="Review what changed in this asset before applying the update." onClose={onClose} />
        {diffRows.length > 0 ? renderDiffRowsTable(diffRows, onResetRow) : renderNoChangesNotice()}
        <ModalActions onCancel={onClose} onConfirm={onConfirm} onReset={onReset} confirmText="Confirm and save" />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
