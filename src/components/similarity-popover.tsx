import { X } from "lucide-react";
import { useTranslation } from "../utils/translations.ts";

type Props = {
  isin: string;
  matchedIsin: string;
  matchedName: string;
  onDismiss: ((isin: string, matchedIsin: string) => void) | undefined;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  pct: string;
};

export function SimilarityPopover({ isin, matchedIsin, matchedName, onDismiss, onMouseEnter, onMouseLeave, pct }: Props) {
  const { translate } = useTranslation();
  return (
    <span data-testid={`similarity-popover-${isin.toLowerCase()}`} className="popover-content top-1/2 right-full mr-2 -translate-y-1/2" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span className="text-sm">
        {pct} {translate("similarity-similar-to")} <strong>{matchedName}</strong>
      </span>
      {onDismiss && (
        <button
          type="button"
          data-testid={`similarity-dismiss-${isin.toLowerCase()}`}
          className="btn btn-ghost text-base-content/60 btn-xs hover:text-error"
          aria-label={`Dismiss similarity with ${matchedName}`}
          title="Dismiss this similarity (reversible)"
          onClick={() => onDismiss(isin, matchedIsin)}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
