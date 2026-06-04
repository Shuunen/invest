import { z } from "zod/v4";

export const maxPortfolios = 50;

export const PortfolioEntrySchema = z.object({
  /** Number of units/shares currently held. Total position value = amount × asset.price. */
  amount: z.number().nonnegative().default(0),
  /** ISO 8601 datetime of when amount was last recorded. */
  amountUpdatedAt: z.iso.datetime().optional(),
  /** True when the position is held in a French PEA account. */
  inPEA: z.boolean().default(false),
  /** References an asset in the assets list by ISIN. */
  isin: z.string().min(1),
  /** Free-text note on the position. */
  notes: z.string().default(""),
  /**
   * Target number of units/shares the user intends to hold.
   * - targetAmount > amount → user plans to buy (targetAmount − amount) more units
   * - targetAmount < amount → user plans to sell down to targetAmount units
   * - targetAmount === amount → position is at target, no action needed
   */
  targetAmount: z.number().nonnegative(),
  /** ISO 8601 datetime of when targetAmount was last set. */
  targetAmountUpdatedAt: z.iso.datetime().optional(),
});

export type PortfolioEntry = z.infer<typeof PortfolioEntrySchema>;

export const PortfolioSchema = z.object({
  /** Name of the broker where this portfolio is held. */
  broker: z.string().min(1, "Broker is required"),
  /** List of positions held in this portfolio. */
  entries: z.array(PortfolioEntrySchema).default([]),
  /** Unique identifier for the portfolio (UUID v4). */
  id: z.uuid(),
  /** Display name of the portfolio. */
  name: z.string().min(1, "Name is required"),
});

export type Portfolio = z.infer<typeof PortfolioSchema>;
