import { z } from "zod/v4";

// --- Geography ---

const CountryEuropeSchema = z.enum([
  "uk",
  "switzerland",
  "france",
  "germany",
  "netherlands",
  "norway",
  "sweden",
  "austria",
  "finland",
  "italy",
  "poland",
  "spain",
  "belgium",
  "ireland",
  "denmark",
]);

const CountryAsiaSchema = z.enum([
  "china",
  "japan",
  "taiwan",
  "hongKong",
  "southKorea",
  "malaysia",
  "indonesia",
  "thailand",
]);

const CountrySchema = z.enum([
  "us",
  "canada",
  "brazil",
  "europe",
  ...CountryEuropeSchema.options,
  "asia",
  ...CountryAsiaSchema.options,
  "india",
  "saudiArabia",
  "australia",
  "africa",
]);

const SectorSchema = z.enum([
  "technology",
  "financials",
  "healthcare",
  "consumerDiscretionary",
  "consumerStaples",
  "industrials",
  "energy",
  "utilities",
  "materials",
  "realEstate",
  "communicationServices",
]);

export type Country = z.infer<typeof CountrySchema>;
export type CountryAsia = z.infer<typeof CountryAsiaSchema>;
export type CountryEurope = z.infer<typeof CountryEuropeSchema>;
export type Sector = z.infer<typeof SectorSchema>;

export const COUNTRIES_ASIA = CountryAsiaSchema.options satisfies readonly CountryAsia[];
export const COUNTRIES_EUROPE = CountryEuropeSchema.options satisfies readonly CountryEurope[];

// --- ISIN ---

const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
export const MAX_ISINS = 5000;
export const MAX_PORTFOLIOS = 50;
export const SCORE_FEE_WEIGHT = 10;
export const SCORE_RISK_WEIGHT = 5;
const DEFAULT_SIMILARITY_THRESHOLD = 0.85;

const nullableNumber = z
  .number()
  .nullish()
  .transform(num => num ?? undefined);

const KNOWN_COUNTRIES = new Set<string>(CountrySchema.options);
const KNOWN_SECTORS = new Set<string>(SectorSchema.options);

export const AssetSchema = z.object({
  availableForPlan: z.boolean(),
  availableOnBroker: z.boolean(),
  fees: z.number().nonnegative(),
  geoAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Country, number>> => Object.keys(obj).every(key => KNOWN_COUNTRIES.has(key)), {
      message: "geoAllocation contains unknown country keys",
    })
    .default({}),
  isAccumulating: z.boolean(),
  isin: z.string().regex(ISIN_REGEX),
  name: z.string().min(1),
  performance1y: nullableNumber,
  performance3y: nullableNumber,
  performance5y: nullableNumber,
  provider: z.string().default(""),
  riskReward1y: nullableNumber,
  riskReward3y: nullableNumber,
  riskReward5y: nullableNumber,
  sectorAllocation: z
    .record(z.string(), z.number())
    .refine((obj): obj is Partial<Record<Sector, number>> => Object.keys(obj).every(key => KNOWN_SECTORS.has(key)), {
      message: "sectorAllocation contains unknown sector keys",
    })
    .default({}),
  tickers: z.array(z.string()).default([]),
});

export type Asset = z.infer<typeof AssetSchema>;

// score is derived, never stored
export function computeScore(asset: Asset): number | undefined {
  const { performance3y, riskReward3y, fees } = asset;
  if (performance3y === undefined || riskReward3y === undefined) return undefined;
  return performance3y + riskReward3y * SCORE_RISK_WEIGHT - fees * SCORE_FEE_WEIGHT;
}

// --- Portfolio ---

export const PortfolioEntrySchema = z.object({
  inPEA: z.boolean().default(false),
  isin: z.string().regex(ISIN_REGEX),
  notes: z.string().default(""),
  positionValue: z.number().nonnegative(),
  targetAmount: z.number().nonnegative(),
});

export type PortfolioEntry = z.infer<typeof PortfolioEntrySchema>;

export const PortfolioSchema = z.object({
  broker: z.string().default(""),
  entries: z.array(PortfolioEntrySchema).default([]),
  id: z.uuid(),
  name: z.string().min(1),
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
  similarityThreshold: z.number().min(0).max(1).default(DEFAULT_SIMILARITY_THRESHOLD),
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
    assets: z.array(AssetSchema).max(MAX_ISINS),
    portfolios: z.array(PortfolioSchema).max(MAX_PORTFOLIOS),
    settings: SettingsSchema,
  })
  .superRefine((data, ctx) => {
    const knownIsins = new Set(data.assets.map(item => item.isin));
    for (const [pi, portfolio] of data.portfolios.entries())
      for (const [ei, entry] of portfolio.entries.entries())
        if (!knownIsins.has(entry.isin))
          ctx.addIssue({
            code: "custom",
            message: `Portfolio entry[${ei}] references unknown ISIN: ${entry.isin}`,
            path: ["portfolios", pi, "entries", ei, "isin"],
          });
  });

export type AppData = z.infer<typeof AppDataSchema>;

// --- Import helper (JSON.parse wrapped before Zod) ---

export function parseAppData(raw: unknown): AppData {
  return AppDataSchema.parse(raw);
}

export function safeImportJson(text: string): { data: AppData } | { error: string } {
  let parsed: unknown = undefined;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    /* v8 ignore next -- JSON.parse always throws SyntaxError; String(error) is unreachable */
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
