import { XIcon } from "lucide-react";
import { cn } from "../utils/browser-styles";

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  type?: "default" | "danger";
};

export function ModalHeader({ title, onClose, type = "default" }: ModalHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex items-center justify-between", {
        "text-error": type === "danger",
      })}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <button type="button" className="btn btn-circle btn-ghost btn-sm" aria-label="Close" onClick={onClose}>
        <XIcon size={16} />
      </button>
    </div>
  );
}
