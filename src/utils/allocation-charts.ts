import { invariant, startCase } from "es-toolkit";
import type { Allocation, Asset, PortfolioEntry } from "../schemas/index.ts";

const otherColor = "#777";
const otherThreshold = 0.95;
const fallbackColors = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#56B4E9", "#CC79A7", "#F0E442", "#117733", "#AA4499", "#882255", "#332288"];

const keyMapping = {
  communicationServices: "Communication",
  consumerDiscretionary: "Luxury",
  consumerStaples: "Basic needs",
  uk: "UK",
  us: "USA",
};

const colorMap: Record<string, string> = {
  africa: "var(--color-stone-800)",
  asia: "var(--color-orange-800)",
  australia: "var(--color-red-800)",
  austria: "var(--color-yellow-700)",
  belgium: "var(--color-cyan-800)",
  brazil: "var(--color-emerald-800)",
  canada: "var(--color-indigo-900)",
  china: "var(--color-red-900)",
  communicationServices: "var(--color-blue-800)",
  consumerDiscretionary: "var(--color-red-900)",
  consumerStaples: "var(--color-cyan-900)",
  denmark: "var(--color-amber-700)",
  energy: "var(--color-yellow-700)",
  europe: "var(--color-amber-900)",
  financials: "var(--color-amber-800)",
  finland: "var(--color-purple-900)",
  france: "var(--color-amber-800)",
  germany: "var(--color-lime-800)",
  healthcare: "var(--color-emerald-700)",
  hongKong: "var(--color-violet-900)",
  india: "var(--color-yellow-800)",
  indonesia: "var(--color-fuchsia-800)",
  industrials: "var(--color-red-900)",
  ireland: "var(--color-green-800)",
  israel: "var(--color-green-800)",
  italy: "var(--color-indigo-700)",
  japan: "var(--color-blue-700)",
  luxembourg: "var(--color-slate-700)",
  malaysia: "var(--color-teal-900)",
  materials: "var(--color-purple-800)",
  netherlands: "var(--color-cyan-700)",
  norway: "var(--color-green-900)",
  poland: "var(--color-stone-900)",
  realEstate: "var(--color-violet-800)",
  saudiArabia: "var(--color-teal-700)",
  southKorea: "var(--color-orange-900)",
  spain: "var(--color-orange-700)",
  sweden: "var(--color-red-700)",
  switzerland: "var(--color-teal-800)",
  taiwan: "var(--color-lime-900)",
  technology: "var(--color-sky-700)",
  thailand: "var(--color-yellow-900)",
  uk: "var(--color-sky-800)",
  us: "var(--color-sky-900)",
  utilities: "var(--color-green-700)",
};

export type AllocationChartEntry = {
  fill: string;
  key: string;
  label: string;
  value: number;
};

function formatAllocationKey(key: string): string {
  return key in keyMapping ? keyMapping[key as keyof typeof keyMapping] : startCase(key);
}

export function buildAllocationEntries(data: Allocation): AllocationChartEntry[] | undefined {
  const entries: Array<[string, number]> = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value <= 0) continue;
    entries.push([key, value]);
  }
  if (entries.length === 0) return undefined;

  const sorted = entries.toSorted(([, valueA], [, valueB]) => valueB - valueA);
  const sum = entries.reduce((acc, [, value]) => acc + value, 0);
  const result = sorted.map(([key, value], idx) => {
    const fallback = fallbackColors[idx % fallbackColors.length];
    invariant(fallback !== undefined, "fallbackColors index out of range");
    return { fill: colorMap[key] ?? fallback, key, label: formatAllocationKey(key), value };
  });

  if (sum < otherThreshold && sum <= 1) result.push({ fill: otherColor, key: "other", label: "Other", value: 1 - sum });
  return result;
}

/**
 * Compute capital-weighted portfolio allocations.
 *
 * For each entry in the portfolio, calculates its weight as:
 *   weight = (entry.amount × asset.price) / totalValue
 *
 * Then sums the weighted allocation values across all entries.
 *
 * Treats undefined prices as 0. Returns empty allocations if totalValue is 0.
 *
 * @param entries Portfolio entries (holdings)
 * @param assets Asset metadata (allocations, prices)
 * @param totalValue Total portfolio value (sum of all position values)
 * @returns Object with `geo` and `sector` allocations
 */
export function computePortfolioWeightedAllocations(entries: PortfolioEntry[], assets: Asset[], totalValue: number): { geo: Allocation; sector: Allocation } {
  // Guard: zero portfolio value → empty allocations
  if (totalValue === 0) return { geo: {}, sector: {} };

  const geoAllocation: Allocation = {};
  const sectorAllocation: Allocation = {};

  // Build asset lookup map for O(1) access
  const assetMap = new Map(assets.map(asset => [asset.isin, asset]));

  // Accumulate weighted allocations
  for (const entry of entries) {
    const asset = assetMap.get(entry.isin);
    if (!asset) continue; // Skip entries without matching asset

    // Compute weight: (amount × price) / totalValue
    const positionValue = entry.amount * (asset.price ?? 0);
    const weight = positionValue / totalValue;

    // Accumulate weighted geo allocation
    for (const [key, value] of Object.entries(asset.geoAllocation)) {
      if (value === undefined || value <= 0) continue;
      geoAllocation[key] = (geoAllocation[key] ?? 0) + value * weight;
    }

    // Accumulate weighted sector allocation
    for (const [key, value] of Object.entries(asset.sectorAllocation)) {
      if (value === undefined || value <= 0) continue;
      sectorAllocation[key] = (sectorAllocation[key] ?? 0) + value * weight;
    }
  }

  return { geo: geoAllocation, sector: sectorAllocation };
}

type WeightedSelectionAllocationsOptions = {
  amountByIsin?: Map<string, number>;
  assets: Asset[];
  defaultAmount?: number;
  selectedIsins: Set<string>;
};

export function computeWeightedAllocationsFromSelection({ amountByIsin, assets, defaultAmount = 1, selectedIsins }: WeightedSelectionAllocationsOptions): { geo: Allocation; sector: Allocation } {
  const entries: PortfolioEntry[] = [];
  const assetMap = new Map(assets.map(asset => [asset.isin, asset]));

  for (const isin of selectedIsins)
    entries.push({
      amount: amountByIsin?.get(isin) ?? defaultAmount,
      inPEA: false,
      isin,
      notes: "",
      positionValue: 0,
      targetAmount: 0,
    });

  let totalValue = 0;
  for (const entry of entries) {
    const asset = assetMap.get(entry.isin);
    totalValue += entry.amount * (asset?.price ?? 0);
  }

  return computePortfolioWeightedAllocations(entries, assets, totalValue);
}
