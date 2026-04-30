import type { Asset } from "../schemas/index.ts";
import { nbDecimals } from "../utils/constants.ts";
import { formatNumber, formatPrice } from "./asset-table-utils.ts";
import { FieldRow } from "./asset-view-field-row.tsx";

type Props = {
  asset: Asset;
};

export function ViewFinancialSection({ asset }: Props) {
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body p-4">
        <h2 className="mb-3 card-title text-base">Financial</h2>
        <FieldRow label="Fees" value={`${asset.fees.toFixed(nbDecimals)}%`} />
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
