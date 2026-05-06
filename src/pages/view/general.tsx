import { kebabCase } from "es-toolkit/string";
import type { Asset } from "../../schemas/index.ts";
import { cn } from "../../utils/browser-styles.ts";
import { formatDate } from "../../utils/format-numbers.ts";
import { FieldRow } from "./field-row.tsx";

function booleanBadge(value: boolean, label: string) {
  return (
    <span aria-label={value ? `${label}: Yes` : `${label}: No`} data-testid={`${kebabCase(label)}-badge`} className={cn("badge", { "bg-error/20": !value, "bg-success/20": value })}>
      {value ? "Yes" : "No"}
    </span>
  );
}

type Props = { asset: Asset };

export function ViewGeneralSection({ asset }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">General</h2>
        <FieldRow label="ISIN" name="isin" value={asset.isin} />
        <FieldRow label="Provider" value={asset.provider || "—"} name="provider" />
        <FieldRow label="Tickers" value={asset.tickers.length > 0 ? asset.tickers.join(", ") : "—"} name="tickers" />
        <FieldRow label="Accumulating" value={booleanBadge(asset.isAccumulating, "Accumulating")} name="accumulating" />
        <FieldRow label="Broker availability" value={booleanBadge(asset.availableOnBroker, "Broker")} name="broker-availability" />
        <FieldRow label="Plan compatibility" value={booleanBadge(asset.availableForPlan, "Plan")} name="plan-compatibility" />
        <FieldRow label="Last updated" value={formatDate(asset.updatedAt)} name="updated-at" />
      </div>
    </div>
  );
}
