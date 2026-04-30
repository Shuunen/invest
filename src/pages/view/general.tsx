import type { Asset } from "../../schemas/index.ts";
import { FieldRow } from "./field-row.tsx";

function booleanBadge(value: boolean, label: string) {
  return (
    <span aria-label={value ? `${label}: Yes` : `${label}: No`} className={`badge ${value ? "bg-success/40" : "badge-ghost"}`}>
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
        <FieldRow label="ISIN" value={<span className="font-mono">{asset.isin}</span>} />
        <FieldRow label="Provider" value={asset.provider || "—"} />
        <FieldRow label="Tickers" value={asset.tickers.length > 0 ? asset.tickers.join(", ") : "—"} />
        <FieldRow label="Accumulating" value={booleanBadge(asset.isAccumulating, "Accumulating")} />
        <FieldRow label="Broker availability" value={booleanBadge(asset.availableOnBroker, "Broker")} />
        <FieldRow label="Plan compatibility" value={booleanBadge(asset.availableForPlan, "Plan")} />
      </div>
    </div>
  );
}
