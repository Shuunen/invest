import { formatPercent } from "../../components/asset-table-utils.ts";
import type { Asset } from "../../schemas/index.ts";
import { maxPercentage } from "../../utils/constants.ts";

const MAX_ABBREVIATION_LENGTH = 2;

function formatAllocationKey(key: string): string {
  const words = key
    .replaceAll(/([A-Z])/g, " $1")
    .trim()
    .split(/\s+/);
  return words.map(word => (word.length <= MAX_ABBREVIATION_LENGTH ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))).join(" ");
}

function renderAllocation(map: Asset["geoAllocation"] | Asset["sectorAllocation"]): string {
  const entries = Object.entries(map);
  if (entries.length === 0) return "—";
  return entries
    .toSorted(([, valueA], [, valueB]) => valueB - valueA)
    .map(([key, pct]) => `${formatAllocationKey(key)}: ${formatPercent(pct * maxPercentage)}`)
    .join(" · ");
}

type Props = {
  geoAllocation: Asset["geoAllocation"];
  sectorAllocation: Asset["sectorAllocation"];
};

export function ViewAllocationsSection({ geoAllocation, sectorAllocation }: Props) {
  return (
    <>
      <div className="card mb-4 border border-base-200 bg-base-100">
        <div className="card-body p-4">
          <h2 className="mb-3 card-title text-base">Geographic allocation</h2>
          <p data-testid="geo-allocation-text" className="text-sm leading-relaxed">
            {renderAllocation(geoAllocation)}
          </p>
        </div>
      </div>
      <div className="card border border-base-200 bg-base-100">
        <div className="card-body p-4">
          <h2 className="mb-3 card-title text-base">Sector allocation</h2>
          <p data-testid="sector-allocation-text" className="text-sm leading-relaxed">
            {renderAllocation(sectorAllocation)}
          </p>
        </div>
      </div>
    </>
  );
}
