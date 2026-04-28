import { FormActions, type FormActionsProps } from "./form-actions";

export function ModalActions({ onCancel, onConfirm, confirmText, type }: FormActionsProps) {
  return (
    <div className="modal-action">
      <FormActions onCancel={onCancel} onConfirm={onConfirm} confirmText={confirmText} type={type} />
    </div>
  );
}
