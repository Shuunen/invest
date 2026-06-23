import { cn } from "../../utils/browser-styles";
import { useTranslation } from "../../utils/translations.ts";

export type FormActionsProps = {
  onConfirm?: () => void;
  onCancel: () => void;
  onReset?: () => void;
  confirmText?: string;
  type?: "default" | "error";
};

export function FormActions({ onCancel, onConfirm, onReset, confirmText, type = "default" }: FormActionsProps) {
  const { translate } = useTranslation();
  return (
    <div className="flex justify-end gap-4">
      <button type="button" data-testid="form-cancel-button" className="btn btn-ghost" onClick={onCancel}>
        {translate("action-cancel")}
      </button>
      {onReset && (
        <button type="button" data-testid="form-reset-button" className="btn btn-outline" onClick={onReset}>
          {translate("action-reset")}
        </button>
      )}
      <button type="submit" data-testid="form-confirm-button" className={cn(`btn btn-outline`, { "btn-error": type === "error", "btn-primary": type === "default" })} onClick={onConfirm}>
        {confirmText ?? translate("action-confirm")}
      </button>
    </div>
  );
}
