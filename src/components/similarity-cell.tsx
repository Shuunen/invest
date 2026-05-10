import { invariant } from "es-toolkit";
import { useEffect, useRef, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { similarityErrorThreshold, similarityWarningThreshold } from "../utils/asset-similarity.ts";
import { cn } from "../utils/browser-styles.ts";
import { maxPercentage } from "../utils/constants.ts";
import { SimilarityPopover } from "./similarity-popover.tsx";

const popoverHideDelayMs = 150;

type SimilarityResult = { score: number; matchedIsin: string };

type Props = {
  asset: Asset;
  assets: Asset[];
  onDismiss: ((isin: string, matchedIsin: string) => void) | undefined;
  result: SimilarityResult | undefined;
};

export function SimilarityCell({ asset, assets, onDismiss, result }: Props) {
  const { isin } = asset;
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const score = result?.score;

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
  invariant(result, "result must be defined when score is defined");
  const { matchedIsin } = result;
  const matchedAsset = assets.find(ast => ast.isin === matchedIsin);
  const matchedName = matchedAsset?.name ?? matchedIsin;

  return (
    <span data-testid={`similarity-wrapper-${isin.toLowerCase()}`} className="relative flex items-center gap-1.5" onMouseEnter={showPopover} onMouseLeave={scheduleHide}>
      <span data-testid={`similarity-${isin.toLowerCase()}`} className="flex items-center gap-1.5">
        <span data-testid={`similarity-dot-${isin.toLowerCase()}`} className={cn("inline-block h-2 w-2 shrink-0 rounded-full", dotClass)} />
        <span className="w-8 text-center">{pct}</span>
      </span>
      {visible && <SimilarityPopover isin={isin} matchedIsin={matchedIsin} matchedName={matchedName} onDismiss={onDismiss} onMouseEnter={showPopover} onMouseLeave={scheduleHide} pct={pct} />}
    </span>
  );
}
