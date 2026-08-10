import { z } from "zod/v4";

// --- Geography ---

const CountryEuropeSchema = z.enum(["uk", "switzerland", "france", "germany", "netherlands", "norway", "sweden", "austria", "finland", "italy", "poland", "spain", "belgium", "ireland", "denmark", "luxembourg"]);

const CountryAsiaSchema = z.enum(["china", "japan", "taiwan", "hongKong", "southKorea", "malaysia", "indonesia", "thailand", "israel"]);

const CountrySchema = z.enum(["us", "canada", "brazil", "europe", ...CountryEuropeSchema.options, "asia", ...CountryAsiaSchema.options, "india", "saudiArabia", "australia", "africa"]);

const SectorSchema = z.enum(["technology", "financials", "healthcare", "consumerDiscretionary", "consumerStaples", "industrials", "energy", "utilities", "materials", "realEstate", "communicationServices"]);

export type Country = z.infer<typeof CountrySchema>;
export type Sector = z.infer<typeof SectorSchema>;
export type Allocation = Partial<Record<string, number>>;

export const countries = CountrySchema.options satisfies readonly Country[];
export const sectors = SectorSchema.options satisfies readonly Sector[];

// --- Asset ---

export const maxIsins = 5000;

const scoreFeeWeight = 10;
const scoreRiskWeight = 5;
const scoreTimeFrameShort = 1;
const scoreTimeFrameMedium = 3;
const scoreTimeFrameLong = 5;
const scoreWeightShort = 0.2;
const scoreWeightMedium = 0.5;
const scoreWeightLong = 0.3;

const nullableNumber = z
  .number()
  .nullish()
  .transform(num => num ?? undefined);

const knownCountries = new Set<string>(CountrySchema.options);
const knownSectors = new Set<string>(SectorSchema.options);

export const AssetSchema = z.object({
  /** Whether the asset is eligible for a PEA account. */
  availableForPea: z.boolean().default(false),
  /** Whether the asset is included in allocation planning. */
  availableForPlan: z.boolean(),
  /** Whether the asset is tradeable on the user's broker. */
  availableOnBroker: z.boolean(),
  /** Free-form note about the asset. */
  comments: z.string().default(""),
  /** ISINs of similar assets the user has dismissed from deduplication warnings. */
  dismissedSimilarities: z.array(z.string()).default([]),
  /** Annual fee in percent (0.2 = 0.20%). */
  fees: z.number().nonnegative(),
  /** Geographic breakdown: country key → percentage as decimal (e.g. 0.65 = 65%). */
  geoAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Country, number>> => Object.keys(obj).every(key => knownCountries.has(key)), {
      message: "geoAllocation contains unknown country keys",
    })
    .default({}),
  /** True = dividends reinvested (accumulating), false = dividends distributed. */
  isAccumulating: z.boolean(),
  /** Unique identifier for the asset (ISIN or equivalent). */
  isin: z.string().min(1, "ISIN or identifier is required"),
  /** Full name of the asset. */
  name: z.string().min(1, "Name is required"),
  /** Total return over 1 year in percent (45 = +45%). Absent when unknown. */
  performance1y: nullableNumber,
  /** Total return over 3 years in percent. Absent when unknown. */
  performance3y: nullableNumber,
  /** Total return over 5 years in percent. Absent when unknown. */
  performance5y: nullableNumber,
  /** Price of one unit/share in euros. Total position value = price × entry.amount. */
  price: nullableNumber,
  /** ETF issuer / fund house. */
  provider: z.string().default(""),
  /** Sharpe ratio over 1 year. Absent when unknown. */
  riskReward1y: nullableNumber,
  /** Sharpe ratio over 3 years. Absent when unknown. */
  riskReward3y: nullableNumber,
  /** Sharpe ratio over 5 years. Absent when unknown. */
  riskReward5y: nullableNumber,
  /** Sector breakdown: sector key → percentage as decimal (e.g. 0.25 = 25%). */
  sectorAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Sector, number>> => Object.keys(obj).every(key => knownSectors.has(key)), {
      message: "sectorAllocation contains unknown sector keys",
    })
    .default({}),
  /** Exchange ticker symbols. */
  tickers: z.array(z.string()).default([]),
  /** ISO 8601 datetime of the last data refresh. */
  updatedAt: z.iso.datetime().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

type Metric = {
  value: number;
  weight: number;
};

// Compute weighted contribution; missing timeframes contribute 0 (no renormalization)
const computeWeightedContribution = (metrics: Metric[]): number => metrics.reduce((sum, metric) => sum + metric.value * metric.weight, 0);

// score is derived, never stored
// Blends 1y/3y/5y performance and risk/reward with weights 0.2/0.5/0.3 respectively
// Uses nominal timeframe weights; missing 1y/5y metrics contribute 0 (no renormalization)
// Requires 3y data as anchor for stability
export function computeScore(asset: Asset): number | undefined {
  const { performance1y, performance3y, performance5y, riskReward1y, riskReward3y, riskReward5y, fees } = asset;

  // Require 3y data as anchor
  if (performance3y === undefined || riskReward3y === undefined) return undefined;

  // Collect available metrics with nominal weights
  type TimeFrame = typeof scoreTimeFrameShort | typeof scoreTimeFrameMedium | typeof scoreTimeFrameLong;
  const nominalWeights: Record<TimeFrame, number> = {
    [scoreTimeFrameShort]: scoreWeightShort,
    [scoreTimeFrameMedium]: scoreWeightMedium,
    [scoreTimeFrameLong]: scoreWeightLong,
  };

  const perfMetrics: Metric[] = [];
  const riskMetrics: Metric[] = [];

  if (performance1y !== undefined) perfMetrics.push({ value: performance1y, weight: nominalWeights[scoreTimeFrameShort] });
  perfMetrics.push({ value: performance3y, weight: nominalWeights[scoreTimeFrameMedium] });
  if (performance5y !== undefined) perfMetrics.push({ value: performance5y, weight: nominalWeights[scoreTimeFrameLong] });

  if (riskReward1y !== undefined) riskMetrics.push({ value: riskReward1y, weight: nominalWeights[scoreTimeFrameShort] });
  riskMetrics.push({ value: riskReward3y, weight: nominalWeights[scoreTimeFrameMedium] });
  if (riskReward5y !== undefined) riskMetrics.push({ value: riskReward5y, weight: nominalWeights[scoreTimeFrameLong] });

  const avgPerformance = computeWeightedContribution(perfMetrics);
  const avgRiskReward = computeWeightedContribution(riskMetrics);

  return avgPerformance + avgRiskReward * scoreRiskWeight - fees * scoreFeeWeight;
}
