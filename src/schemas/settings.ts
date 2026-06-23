import { z, type ZodType } from "zod/v4";
import { themes } from "../utils/theme.ts";
import { defaultLocale, locales } from "../utils/translations.ts";

function fallback<Type>(value: Type): ZodType<Type> {
  return z.unknown().transform(() => value);
}

const defaultSimilarityThreshold = 0.85;

export const SettingsSchema = z.object({
  /** Ordered list of column IDs as displayed in the assets table. */
  columnOrder: z.array(z.string()).default([]),
  /** Per-column visibility overrides: columnId → bool; false means hidden. */
  columnVisibility: z.record(z.string(), z.boolean()).default({}),
  /** Total number of edits made by the user (internal counter). */
  editCount: z.number().int().nonnegative().default(0),
  /** ISO 8601 datetime of the last export. */
  lastExportedAt: z.iso
    .datetime()
    .nullish()
    .transform(str => str ?? undefined),
  /** UI locale. */
  locale: z.enum(locales).prefault(defaultLocale).or(fallback(defaultLocale)),
  /** Sensitivity of the asset deduplication detector (0–1). */
  similarityThreshold: z.number().min(0).max(1).default(defaultSimilarityThreshold),
  /** Active sort applied to the assets table. */
  sort: z
    .object({
      column: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .default({ column: "score", direction: "desc" }),
  /** UI theme. */
  theme: z.enum(themes).prefault("light").or(fallback("light")),
});

export type Settings = z.infer<typeof SettingsSchema>;
