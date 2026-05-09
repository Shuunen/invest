import type { Asset } from "../../schemas/index.ts";
import { maxPercentage } from "../../utils/constants.ts";
import { formatPercent } from "../../utils/format-numbers.ts";
import { ProgressBar } from "./progress-bar.tsx";

const MAX_ABBREVIATION_LENGTH = 2;

function formatAllocationKey(key: string): string {
  const words = key
    .replaceAll(/([A-Z])/gu, " $1")
    .trim()
    .split(/\s+/u);
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
  const totalGeo = Object.values(geoAllocation).reduce((sum, val) => sum + val, 0) * maxPercentage;
  const totalSector = Object.values(sectorAllocation).reduce((sum, val) => sum + val, 0) * maxPercentage;

  return (
    <>
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Geographic allocation</h2>
          <ProgressBar name="geo-allocation" total={totalGeo} />
          <p data-testid="geo-allocation-text">{renderAllocation(geoAllocation)}</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Sector allocation</h2>
          <ProgressBar name="sector-allocation" total={totalSector} />
          <p data-testid="sector-allocation-text">{renderAllocation(sectorAllocation)}</p>
        </div>
      </div>
    </>
  );
}
