import type { Allocation, Asset } from "../schemas/index.ts";

export const similarityWarningThreshold = 0.6;

export const similarityErrorThreshold = 0.8;

export function computeAllocationSimilarity(alloc1: Allocation, alloc2: Allocation): number | undefined {
  const keys1 = Object.keys(alloc1);
  const keys2 = Object.keys(alloc2);
  if (keys1.length === 0 && keys2.length === 0) return undefined;
  if (keys1.length === 0 || keys2.length === 0) return 0;

  /* v8 ignore next -- keys from Object.keys(alloc1) always have defined values */
  const sum1 = keys1.reduce((acc, key) => acc + (alloc1[key] ?? 0), 0);
  /* v8 ignore next -- keys from Object.keys(alloc2) always have defined values */
  const sum2 = keys2.reduce((acc, key) => acc + (alloc2[key] ?? 0), 0);
  if (sum1 === 0 || sum2 === 0) return 0;

  const allKeys = new Set([...keys1, ...keys2]);
  let overlap = 0;
  for (const key of allKeys) {
    const norm1 = (alloc1[key] ?? 0) / sum1;
    const norm2 = (alloc2[key] ?? 0) / sum2;
    overlap += Math.min(norm1, norm2);
  }
  return overlap;
}

export function computeAssetSimilarity(asset1: Asset, asset2: Asset): number | undefined {
  const geo = computeAllocationSimilarity(asset1.geoAllocation, asset2.geoAllocation);
  const sector = computeAllocationSimilarity(asset1.sectorAllocation, asset2.sectorAllocation);

  const defined = [geo, sector].filter((score): score is number => score !== undefined);
  if (defined.length === 0) return undefined;
  return defined.reduce((acc, score) => acc + score, 0) / defined.length;
}

export function computeMaxSimilarity(asset: Asset, others: Asset[], excludeIsins?: string[]): { score: number; matchedIsin: string } | undefined {
  const excluded = new Set(excludeIsins);
  const candidates = others.filter(other => other.isin !== asset.isin && !excluded.has(other.isin));
  if (candidates.length === 0) return undefined;

  let best: { score: number; matchedIsin: string } | undefined = undefined;
  for (const other of candidates) {
    const score = computeAssetSimilarity(asset, other);
    if (score === undefined) continue;
    if (best === undefined || score > best.score) best = { matchedIsin: other.isin, score };
  }
  return best;
}
