import { FormActions, type FormActionsProps } from "./form/actions";

export function ModalActions({ onCancel, onConfirm, onReset, confirmText, type }: FormActionsProps) {
  return (
    <div className="modal-action">
      <FormActions onCancel={onCancel} onConfirm={onConfirm} onReset={onReset} confirmText={confirmText} type={type} />
    </div>
  );
}
