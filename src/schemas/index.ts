import { z } from "zod/v4";
import { maxPercentage } from "../utils/constants";

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

// --- ISIN ---

export const maxIsins = 5000;
export const maxPortfolios = 50;
const scoreFeeWeight = 10;
const scoreRiskWeight = 5;
const scoreTimeFrameShort = 1;
const scoreTimeFrameMedium = 3;
const scoreTimeFrameLong = 5;
const scoreWeightShort = 0.2;
const scoreWeightMedium = 0.5;
const scoreWeightLong = 0.3;
const defaultSimilarityThreshold = 0.85;

const nullableNumber = z
  .number()
  .nullish()
  .transform(num => num ?? undefined);

const knownCountries = new Set<string>(CountrySchema.options);
const knownSectors = new Set<string>(SectorSchema.options);

export const AssetSchema = z.object({
  availableForPlan: z.boolean(),
  availableOnBroker: z.boolean(),
  dismissedSimilarities: z.array(z.string()).default([]),
  fees: z.number().nonnegative(),
  geoAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Country, number>> => Object.keys(obj).every(key => knownCountries.has(key)), {
      message: "geoAllocation contains unknown country keys",
    })
    .default({}),
  isAccumulating: z.boolean(),
  isin: z.string().min(1, "ISIN or identifier is required"),
  name: z.string().min(1, "Name is required"),
  performance1y: nullableNumber,
  performance3y: nullableNumber,
  performance5y: nullableNumber,
  price: nullableNumber,
  provider: z.string().default(""),
  // Sharpe ratios over 1, 3, and 5 years
  riskReward1y: nullableNumber,
  riskReward3y: nullableNumber,
  riskReward5y: nullableNumber,
  sectorAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Sector, number>> => Object.keys(obj).every(key => knownSectors.has(key)), {
      message: "sectorAllocation contains unknown sector keys",
    })
    .default({}),
  tickers: z.array(z.string()).default([]),
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
// Falls back to available timeframes (e.g., 3y-only if 1y/5y missing)
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

const dataFreshnessDays = 30;
const amountFreshnessDays = 90;
const msPerDay = 86_400_000;
const dataScoreBaseFields = 6;
const dataScorePortfolioFields = 8;
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
  if (entry) {
    if (entry.amountUpdatedAt !== undefined) score += toAgeDays(entry.amountUpdatedAt) <= amountFreshnessDays ? 1 : dataScoreStaleWeight;
    if (entry.amount > 0) score += 1;
  }

  const geoCoverage = computeAllocationCoverage(asset.geoAllocation);
  const sectorCoverage = computeAllocationCoverage(asset.sectorAllocation);
  const allocationCoverage = (geoCoverage + sectorCoverage) / allocationScoreDimensions;

  return Math.round((score / total) * maxPercentage * allocationCoverage);
}

// --- Portfolio ---

export const PortfolioEntrySchema = z.object({
  amount: z.number().nonnegative().default(0),
  amountUpdatedAt: z.iso.datetime().optional(),
  inPEA: z.boolean().default(false),
  isin: z.string().min(1),
  notes: z.string().default(""),
  positionValue: z.number().nonnegative(),
  targetAmount: z.number().nonnegative(),
});

export type PortfolioEntry = z.infer<typeof PortfolioEntrySchema>;

export const PortfolioSchema = z.object({
  broker: z.string().min(1, "Broker is required"),
  entries: z.array(PortfolioEntrySchema).default([]),
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
});

export type Portfolio = z.infer<typeof PortfolioSchema>;

// --- Settings ---

export const SettingsSchema = z.object({
  columnOrder: z.array(z.string()).default([]),
  columnVisibility: z.record(z.string(), z.boolean()).default({}),
  editCount: z.number().int().nonnegative().default(0),
  lastExportedAt: z.iso
    .datetime()
    .nullish()
    .transform(str => str ?? undefined),
  similarityThreshold: z.number().min(0).max(1).default(defaultSimilarityThreshold),
  sort: z
    .object({
      column: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .default({ column: "score", direction: "desc" }),
  theme: z.enum(["light", "dark"]).default("light"),
});

export type Settings = z.infer<typeof SettingsSchema>;

// --- AppData (with referential integrity) ---

export const AppDataSchema = z
  .object({
    assets: z.array(AssetSchema).max(maxIsins),
    portfolios: z.array(PortfolioSchema).max(maxPortfolios),
    settings: SettingsSchema,
  })
  .superRefine((data, ctx) => {
    // Duplicate ISIN codes
    const seenIsins = new Set<string>();
    for (const [ai, asset] of data.assets.entries())
      if (seenIsins.has(asset.isin)) ctx.addIssue({ code: "custom", message: `Duplicate ISIN: ${asset.isin}`, path: ["assets", ai, "isin"] });
      else seenIsins.add(asset.isin);
    // Duplicate portfolio IDs
    const seenPortfolioIds = new Set<string>();
    for (const [pi, portfolio] of data.portfolios.entries())
      if (seenPortfolioIds.has(portfolio.id)) ctx.addIssue({ code: "custom", message: `Duplicate portfolio ID: ${portfolio.id}`, path: ["portfolios", pi, "id"] });
      else seenPortfolioIds.add(portfolio.id);
    // Referential integrity: portfolio entries must reference known ISINs
    for (const [pi, portfolio] of data.portfolios.entries())
      for (const [ei, entry] of portfolio.entries.entries())
        if (!seenIsins.has(entry.isin))
          ctx.addIssue({
            code: "custom",
            message: `Portfolio entry[${ei}] references unknown ISIN: ${entry.isin}`,
            path: ["portfolios", pi, "entries", ei, "isin"],
          });
  });

export type AppData = z.infer<typeof AppDataSchema>;

export function parseAppData(raw: unknown): AppData {
  return AppDataSchema.parse(raw);
}

export function safeImportJson(text: string): { data: AppData } | { error: string } {
  let parsed: unknown = undefined;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    /* v8 ignore next -- always throws SyntaxError; String(error) is unreachable */
    const detail = error instanceof Error ? error.message : String(error);
    return { error: `Invalid JSON: ${detail}` };
  }
  const result = AppDataSchema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.issues.map(issue => `Schema error at ${issue.path.join(".")}: ${issue.message}`);
    return { error: messages.join("\n") };
  }
  return { data: result.data };
}
