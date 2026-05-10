import { X } from "lucide-react";

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
  return (
    <span
      data-testid={`similarity-popover-${isin.toLowerCase()}`}
      className="absolute top-1/2 right-full z-50 mr-2 flex -translate-y-1/2 items-center gap-2 rounded-lg border bg-base-100 px-3 py-2 whitespace-nowrap shadow-md"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="text-sm">
        {pct} similar to <strong>{matchedName}</strong>
      </span>
      {onDismiss && (
        <button
          type="button"
          data-testid={`similarity-dismiss-${isin.toLowerCase()}`}
          className="btn text-base-content/60 btn-ghost btn-xs hover:text-error"
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
