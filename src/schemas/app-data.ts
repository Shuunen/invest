import { z } from "zod/v4";
import { AssetSchema, maxIsins } from "./asset.ts";
import { maxPortfolios, PortfolioSchema } from "./portfolio.ts";
import { SettingsSchema } from "./settings.ts";

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
