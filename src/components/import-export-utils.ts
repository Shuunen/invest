const STALENESS_DOT_THRESHOLD = 5;
const STALENESS_PULSE_THRESHOLD = 10;
const STALENESS_PING_THRESHOLD = 15;
const STALENESS_CRAZY_THRESHOLD = 20;

export type StalenessTier = "1-ok" | "2-low" | "3-medium" | "4-high" | "5-critical";

export const STALENESS_TIER_PRESETS = [
  { editCount: 0, label: "1-ok", tier: "1-ok" },
  { editCount: STALENESS_DOT_THRESHOLD, label: "2-low", tier: "2-low" },
  { editCount: STALENESS_PULSE_THRESHOLD, label: "3-medium", tier: "3-medium" },
  { editCount: STALENESS_PING_THRESHOLD, label: "4-high", tier: "4-high" },
  { editCount: STALENESS_CRAZY_THRESHOLD, label: "5-critical", tier: "5-critical" },
] as const satisfies readonly { editCount: number; label: StalenessTier; tier: StalenessTier }[];

export function getStalenessTier(unexportedEdits: number): StalenessTier {
  if (unexportedEdits >= STALENESS_CRAZY_THRESHOLD) return "5-critical";
  if (unexportedEdits >= STALENESS_PING_THRESHOLD) return "4-high";
  if (unexportedEdits >= STALENESS_PULSE_THRESHOLD) return "3-medium";
  if (unexportedEdits >= STALENESS_DOT_THRESHOLD) return "2-low";
  return "1-ok";
}
