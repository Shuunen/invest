import { ModalActions } from "../../components/modal-actions.tsx";
import { ModalHeader } from "../../components/modal-header.tsx";
import { useTranslation } from "../../utils/translations.ts";

export type UnDismissConfirmState = { isin: string; matchedIsin: string; matchedName: string } | undefined;

type Props = {
  confirm: UnDismissConfirmState;
  onClose: () => void;
  onConfirm: () => void;
};

export function UnDismissConfirmModal({ confirm, onClose, onConfirm }: Props) {
  const { translate } = useTranslation();
  if (!confirm) return undefined;
  return (
    <dialog data-testid="un-dismiss-confirm-modal" open className="modal-open modal">
      <div className="modal-box">
        <ModalHeader title="Remove dismissed similarity" onClose={onClose} />
        <p className="text-sm">
          {translate("modal-un-dismiss-before")} <strong>{confirm.matchedName}</strong>
          {translate("modal-un-dismiss-suffix")}
        </p>
        <ModalActions onCancel={onClose} onConfirm={onConfirm} confirmText="Remove" type="error" />
      </div>
      <div data-testid="un-dismiss-confirm-backdrop" className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
