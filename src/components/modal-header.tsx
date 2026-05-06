import { XIcon } from "lucide-react";
import { cn } from "../utils/browser-styles";

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  type?: "default" | "danger";
};

export function ModalHeader({ title, subtitle, onClose, type = "default" }: ModalHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex justify-between", {
        "text-error": type === "danger",
      })}
    >
      <div className="grid gap-2">
        <h3 data-testid="modal-title" className="text-lg font-bold">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-base-content/70">{subtitle}</p>}
      </div>
      <button type="button" data-testid="modal-close-button" className="btn btn-circle btn-ghost btn-sm" aria-label="Close" onClick={onClose}>
        <XIcon size={16} />
      </button>
    </div>
  );
}
