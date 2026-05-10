import type { Allocation } from "../schemas/index.ts";
import { maxPercentage } from "./constants.ts";

const one = 1;
const two = 2;

/**
 * Computes a balance score (0-100) for an allocation.
 * - 100 = perfectly balanced (all values equal)
 * - Lower scores indicate more uneven distribution
 *
 * Uses normalized distance from equal weights.
 * - 100 = perfectly equal weights
 * - 0 = maximally concentrated in one allocation
 *
 * @param allocation - The allocation object with numeric values
 * @returns A balance score from 0 to 100
 */
export function computeBalanceScore(allocation: Allocation): number {
  const values: number[] = Object.values(allocation).filter((value): value is number => (value ?? 0) > 0);

  let total = values.reduce((sum, value) => sum + value, 0);
  const usesUnitScale = values.every(value => value <= one);
  const targetTotal = usesUnitScale ? one : maxPercentage;

  // Include unallocated remainder as "Other" allocation
  if (total < targetTotal) {
    values.push(targetTotal - total);
    total = targetTotal;
  }

  // Single entry after adding remainder = perfectly balanced
  if (values.length <= 1) return maxPercentage;

  const count = values.length;
  const idealWeight = one / count;
  const normalizedValues = values.map(value => value / total);

  const absoluteDeviation = normalizedValues.reduce((sum, weight) => sum + Math.abs(weight - idealWeight), 0);
  const maxDeviation = two * (one - idealWeight);
  const imbalance = absoluteDeviation / maxDeviation;
  const balanceScore = Math.max(0, maxPercentage * (one - imbalance));

  return Math.round(balanceScore);
}
