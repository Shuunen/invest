import { formatNumber, formatPercent, formatPrice } from "../../components/asset-table-utils.ts";
import { computeScore, type Asset } from "../../schemas/index.ts";
import { FieldRow } from "./field-row.tsx";

type Props = {
  asset: Asset;
};

export function ViewFinancialSection({ asset }: Props) {
  const score = computeScore(asset);
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body p-4">
        <h2 className="mb-3 card-title text-base">Financial</h2>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm text-base-content/60">Score</span>
          <span className="text-3xl font-bold">{score === undefined ? "—" : formatNumber(score)}</span>
        </div>
        <FieldRow label="Fees" value={formatPercent(asset.fees)} />
        <FieldRow label="Price" value={formatPrice(asset.price)} />
        <FieldRow label="Performance 1y" value={formatNumber(asset.performance1y)} />
        <FieldRow label="Performance 3y" value={formatNumber(asset.performance3y)} />
        <FieldRow label="Performance 5y" value={formatNumber(asset.performance5y)} />
        <FieldRow label="Risk/Reward 1y" value={formatNumber(asset.riskReward1y)} />
        <FieldRow label="Risk/Reward 3y" value={formatNumber(asset.riskReward3y)} />
        <FieldRow label="Risk/Reward 5y" value={formatNumber(asset.riskReward5y)} />
      </div>
    </div>
  );
}
