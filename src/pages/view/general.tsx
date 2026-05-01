import { kebabCase } from "es-toolkit/string";
import type { Asset } from "../../schemas/index.ts";
import { cn } from "../../utils/browser-styles.ts";
import { FieldRow } from "./field-row.tsx";

function booleanBadge(value: boolean, label: string) {
  return (
    <span aria-label={value ? `${label}: Yes` : `${label}: No`} data-testid={`${kebabCase(label)}-badge`} className={cn("badge", { "badge-ghost": !value, "bg-success/40": value })}>
      {value ? "Yes" : "No"}
    </span>
  );
}

type Props = { asset: Asset };

export function ViewGeneralSection({ asset }: Props) {
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body p-4">
        <h2 className="mb-3 card-title text-base">General</h2>
        <FieldRow
          label="ISIN"
          name="isin"
          value={
            <span className="font-mono" data-testid="isin-display">
              {asset.isin}
            </span>
          }
        />
        <FieldRow label="Provider" value={asset.provider || "—"} name="provider" />
        <FieldRow label="Tickers" value={asset.tickers.length > 0 ? asset.tickers.join(", ") : "—"} name="tickers" />
        <FieldRow label="Accumulating" value={booleanBadge(asset.isAccumulating, "Accumulating")} name="accumulating" />
        <FieldRow label="Broker availability" value={booleanBadge(asset.availableOnBroker, "Broker")} name="broker-availability" />
        <FieldRow label="Plan compatibility" value={booleanBadge(asset.availableForPlan, "Plan")} name="plan-compatibility" />
      </div>
    </div>
  );
}
