import type { Allocation, Asset } from "../schemas/asset.ts";
import type { PortfolioEntry } from "../schemas/portfolio.ts";
import { maxPercentage } from "./constants";

const dataFreshnessDays = 30;
const amountFreshnessDays = 90;
const msPerDay = 86_400_000;
const dataScoreBaseFields = 6;
const dataScorePortfolioFields = dataScoreBaseFields + 1; // amountUpdatedAt is only relevant for portfolio entries
const dataScoreStaleWeight = 0.5;
const allocationScoreDimensions = 2;
export const dataScoreWarnThreshold = 75;

function toAgeDays(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / msPerDay;
}

function computeAllocationCoverage(allocation: Allocation): number {
  const values = Object.values(allocation);
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) {
    if (value === undefined || value <= 0) continue;
    total += value;
  }
  return Math.min(1, total);
}

// data quality score (0-100): completeness + freshness of asset data fields
export function computeDataScore(asset: Asset, entry?: PortfolioEntry): number {
  let score = 0;
  const total = entry ? dataScorePortfolioFields : dataScoreBaseFields;

  if (asset.price && asset.price > 0) score += 1;
  if (asset.performance1y !== undefined) score += 1;
  if (asset.performance3y !== undefined) score += 1;
  if (asset.riskReward1y !== undefined) score += 1;
  if (asset.riskReward3y !== undefined) score += 1;

  if (asset.updatedAt !== undefined) score += toAgeDays(asset.updatedAt) <= dataFreshnessDays ? 1 : dataScoreStaleWeight;
  if (entry?.amountUpdatedAt !== undefined) score += toAgeDays(entry.amountUpdatedAt) <= amountFreshnessDays ? 1 : dataScoreStaleWeight;

  const geoCoverage = computeAllocationCoverage(asset.geoAllocation);
  const sectorCoverage = computeAllocationCoverage(asset.sectorAllocation);
  const allocationCoverage = (geoCoverage + sectorCoverage) / allocationScoreDimensions;

  return Math.round((score / total) * maxPercentage * allocationCoverage);
}
