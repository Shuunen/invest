import { formatNumber, formatPercent, formatPrice } from "../../components/asset-table-utils.ts";
import type { Asset } from "../../schemas/index.ts";
import { FieldRow } from "./field-row.tsx";

type Props = {
  asset: Asset;
};

export function ViewFinancialSection({ asset }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Financial</h2>
        <FieldRow label="Fees" value={formatPercent(asset.fees)} name="fees" />
        <FieldRow label="Price" value={formatPrice(asset.price)} name="price" />
        <FieldRow label="Performance 1y" value={formatNumber(asset.performance1y)} name="performance-1y" />
        <FieldRow label="Performance 3y" value={formatNumber(asset.performance3y)} name="performance-3y" />
        <FieldRow label="Performance 5y" value={formatNumber(asset.performance5y)} name="performance-5y" />
        <FieldRow label="Risk/Reward 1y" value={formatNumber(asset.riskReward1y)} name="risk-reward-1y" />
        <FieldRow label="Risk/Reward 3y" value={formatNumber(asset.riskReward3y)} name="risk-reward-3y" />
        <FieldRow label="Risk/Reward 5y" value={formatNumber(asset.riskReward5y)} name="risk-reward-5y" />
      </div>
    </div>
  );
}
