import { cn } from "../../utils/browser-styles";

export type FormActionsProps = {
  onConfirm?: () => void;
  onCancel: () => void;
  onReset?: () => void;
  confirmText?: string;
  type?: "default" | "danger";
};

export function FormActions({ onCancel, onConfirm, onReset, confirmText = "Confirm", type = "default" }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <button type="button" data-testid="form-cancel-button" className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
      {onReset && (
        <button type="button" data-testid="form-reset-button" className="btn btn-outline" onClick={onReset}>
          Reset
        </button>
      )}
      <button type="submit" data-testid="form-confirm-button" className={cn(`btn btn-outline`, { "btn-error": type === "danger", "btn-primary": type === "default" })} onClick={onConfirm}>
        {confirmText}
      </button>
    </div>
  );
}
