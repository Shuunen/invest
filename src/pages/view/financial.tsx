import type { Asset } from "../../schemas/index.ts";
import { formatNumber, formatPercent, formatPrice } from "../../utils/format-numbers.ts";
import { FieldRow } from "./field-row.tsx";

type Props = {
  asset: Asset;
};

export function ViewFinancialSection({ asset }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Financial</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldRow label="Fees" value={formatPercent(asset.fees)} name="fees" />
          <FieldRow label="Price" value={formatPrice(asset.price)} name="price" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <FieldRow label="Performance 1 year" value={formatPercent(asset.performance1y)} name="performance-1y" />
            <FieldRow label="Performance 3 years" value={formatPercent(asset.performance3y)} name="performance-3y" />
            <FieldRow label="Performance 5 years" value={formatPercent(asset.performance5y)} name="performance-5y" />
          </div>
          <div className="grid gap-4">
            <FieldRow label="Risk/Reward 1 year" value={formatNumber(asset.riskReward1y)} name="risk-reward-1y" />
            <FieldRow label="Risk/Reward 3 years" value={formatNumber(asset.riskReward3y)} name="risk-reward-3y" />
            <FieldRow label="Risk/Reward 5 years" value={formatNumber(asset.riskReward5y)} name="risk-reward-5y" />
          </div>
        </div>
      </div>
    </div>
  );
}
