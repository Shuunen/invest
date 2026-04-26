import { cn } from "../utils/browser-styles";

export type FormActionsProps = {
  onConfirm?: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: "default" | "danger";
};

export function FormActions({ onCancel, onConfirm, confirmText = "Confirm", type = "default" }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={cn(`btn btn-outline`, { "btn-error": type === "danger", "btn-primary": type === "default" })} onClick={onConfirm}>
        {confirmText}
      </button>
    </div>
  );
}
