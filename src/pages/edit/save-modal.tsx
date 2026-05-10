import { kebabCase } from "es-toolkit";
import { ModalActions } from "../../components/modal-actions";
import { ModalHeader } from "../../components/modal-header";
import type { DiffRow } from "./form-diff.ts";

type Props = {
  diffRows: DiffRow[];
  onClose: () => void;
  onConfirm: () => void;
  onReset: () => void;
};

function renderDiffRowsTable(diffRows: DiffRow[]) {
  return (
    <div className="mt-4 max-h-96 overflow-auto rounded-box border border-base-300">
      <table className="table table-zebra table-sm" data-testid="confirm-save-diff-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Before</th>
            <th>After</th>
          </tr>
        </thead>
        <tbody>
          {diffRows.map(row => (
            <tr key={row.field} data-testid={`change-row-${kebabCase(row.field)}`}>
              <td>{row.field}</td>
              <td className="font-mono text-sm">{row.before}</td>
              <td className="font-mono text-sm">{row.after}</td>
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

export function SaveModal({ diffRows, onClose, onConfirm, onReset }: Props) {
  return (
    <dialog className="modal-open modal" aria-modal="true" data-testid="confirm-save-modal">
      <div className="modal-box max-w-3xl">
        <ModalHeader title="Confirm changes before saving" subtitle="Review what changed in this asset before applying the update." onClose={onClose} />
        {diffRows.length > 0 ? renderDiffRowsTable(diffRows) : renderNoChangesNotice()}
        <ModalActions onCancel={onClose} onConfirm={onConfirm} onReset={onReset} confirmText="Confirm and save" />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
