import { invariant, startCase } from "es-toolkit";
import { PieChart } from "../../components/charts/pie.tsx";
import type { Asset } from "../../schemas/index.ts";

const OTHER_COLOR = "#777";
const OTHER_THRESHOLD = 0.95;
const FALLBACK_COLORS = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#56B4E9", "#CC79A7", "#F0E442", "#117733", "#AA4499", "#882255", "#332288"];

const keyMapping = {
  communicationServices: "Communication",
  consumerDiscretionary: "Luxury",
  consumerStaples: "Basic needs",
  uk: "UK",
  us: "USA",
};

function formatAllocationKey(key: string): string {
  return key in keyMapping ? keyMapping[key as keyof typeof keyMapping] : startCase(key);
}

function buildEntries(map: Asset["geoAllocation"] | Asset["sectorAllocation"], colorMap: Record<string, string>): { fill: string; key: string; label: string; value: number }[] | undefined {
  const entries = Object.entries(map).filter(([, val]) => val > 0);
  if (entries.length === 0) return undefined;

  const sorted = entries.toSorted(([, valueA], [, valueB]) => valueB - valueA);
  const sum = entries.reduce((acc, [, val]) => acc + val, 0);
  const result = sorted.map(([key, value], idx) => {
    const fallback = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    invariant(fallback !== undefined, "FALLBACK_COLORS index out of range");
    return { fill: colorMap[key] ?? fallback, key, label: formatAllocationKey(key), value };
  });

  if (sum < OTHER_THRESHOLD) result.push({ fill: OTHER_COLOR, key: "other", label: "Other", value: 1 - sum });

  return result;
}

type Props = {
  name: string;
  colorMap: Record<string, string>;
  map: Asset["geoAllocation"] | Asset["sectorAllocation"];
  title: string;
};

export function AllocationCard({ title, map, colorMap, name }: Props) {
  const entries = buildEntries(map, colorMap);

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {entries === undefined ? (
          <p className="text-center text-sm text-base-content/40" data-testid={`${name}-empty`}>
            No allocation data
          </p>
        ) : (
          <PieChart entries={entries} name={name} />
        )}
      </div>
    </div>
  );
}
