import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/browser-styles.ts";
import { formatPrice } from "../utils/format-numbers.ts";

const popoverHideDelayMs = 150;

type Props = {
  amount: number;
  amountPercentageLabel: string;
  isin: string;
  targetAmount: number | undefined;
  targetInvestment: number | undefined;
  trendIcon: ReactNode;
};

export function TargetAmountReadCell({ amount, amountPercentageLabel, isin, targetAmount, targetInvestment, trendIcon }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const normalizedIsin = isin.toLowerCase();
  const isPopoverVisible = targetAmount !== amount;
  const targetInvestmentLabel = targetInvestment === undefined ? "—" : formatPrice(targetInvestment);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function showPopover() {
    if (!isPopoverVisible) return;
    clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function scheduleHide() {
    if (!isPopoverVisible) return;
    hideTimer.current = setTimeout(() => setVisible(false), popoverHideDelayMs);
  }

  return (
    <span className="relative flex items-center justify-center" onMouseEnter={showPopover} onMouseLeave={scheduleHide}>
      <span className={cn("flex items-center justify-center gap-1", { "opacity-40": targetAmount === amount })} data-testid="target-amount-read">
        <span data-testid={`target-amount-${normalizedIsin}`}>{targetAmount ?? "—"}</span>
        {trendIcon}
        <span data-testid={`target-percent-${normalizedIsin}`}>{amountPercentageLabel}</span>
      </span>
      {visible && isPopoverVisible && (
        <span
          data-testid={`target-worth-popover-${normalizedIsin}`}
          className="absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-lg border bg-base-100 px-3 py-2 text-sm whitespace-nowrap shadow-md"
          onMouseEnter={showPopover}
          onMouseLeave={scheduleHide}
        >
          {`To invest : ${targetInvestmentLabel}`}
        </span>
      )}
    </span>
  );
}
