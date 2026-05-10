import { useRef, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { computeMaxSimilarity, similarityErrorThreshold, similarityWarningThreshold } from "../utils/asset-similarity.ts";
import { cn } from "../utils/browser-styles.ts";
import { maxPercentage } from "../utils/constants.ts";
import { SimilarityPopover } from "./similarity-popover.tsx";

const popoverHideDelayMs = 150;

type Props = {
  asset: Asset;
  assets: Asset[];
  onDismiss: ((isin: string, matchedIsin: string) => void) | undefined;
};

export function SimilarityCell({ asset, assets, onDismiss }: Props) {
  const { isin, dismissedSimilarities } = asset;
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const matchedResult = computeMaxSimilarity(asset, assets, dismissedSimilarities);
  const score = matchedResult?.score;

  function showPopover() {
    clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setVisible(false), popoverHideDelayMs);
  }

  if (score === undefined)
    return (
      <span data-testid={`similarity-${isin.toLowerCase()}`} className="flex items-center justify-center">
        –
      </span>
    );

  const pct = `${Math.round(score * maxPercentage)}%`;
  const isError = score > similarityErrorThreshold;
  const isWarning = score > similarityWarningThreshold;

  if (!isWarning) return undefined;

  const dotClass = isError ? "bg-error" : "bg-warning";
  /* v8 ignore next -- matchedResult non-null when score defined */
  const matchedAsset = assets.find(ast => ast.isin === matchedResult?.matchedIsin);
  /* v8 ignore next -- matchedResult is defined whenever score is defined */
  const matchedIsin = matchedResult?.matchedIsin ?? "";
  /* v8 ignore next -- matchedIsin originates from assets list in computeMaxSimilarity */
  const matchedName = matchedAsset?.name ?? matchedIsin;

  return (
    <span className="relative flex items-center gap-1.5" onMouseEnter={showPopover} onMouseLeave={scheduleHide}>
      <span data-testid={`similarity-${isin.toLowerCase()}`} className="flex items-center gap-1.5">
        <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", dotClass)} />
        <span className="w-8 text-center">{pct}</span>
      </span>
      {visible && <SimilarityPopover isin={isin} matchedIsin={matchedIsin} matchedName={matchedName} onDismiss={onDismiss} onMouseEnter={showPopover} onMouseLeave={scheduleHide} pct={pct} />}
    </span>
  );
}
