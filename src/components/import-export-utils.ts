const stalenessDotThreshold = 5;
const stalenessPulseThreshold = 10;
const stalenessPingThreshold = 15;
const stalenessCrazyThreshold = 20;

export type StalenessTier = "1-ok" | "2-low" | "3-medium" | "4-high" | "5-critical";

export const stalenessTierPresets = [
  { editCount: 0, label: "1-ok", tier: "1-ok" },
  { editCount: stalenessDotThreshold, label: "2-low", tier: "2-low" },
  { editCount: stalenessPulseThreshold, label: "3-medium", tier: "3-medium" },
  { editCount: stalenessPingThreshold, label: "4-high", tier: "4-high" },
  { editCount: stalenessCrazyThreshold, label: "5-critical", tier: "5-critical" },
] as const satisfies readonly { editCount: number; label: StalenessTier; tier: StalenessTier }[];

export function getStalenessTier(unexportedEdits: number): StalenessTier {
  if (unexportedEdits >= stalenessCrazyThreshold) return "5-critical";
  if (unexportedEdits >= stalenessPingThreshold) return "4-high";
  if (unexportedEdits >= stalenessPulseThreshold) return "3-medium";
  if (unexportedEdits >= stalenessDotThreshold) return "2-low";
  return "1-ok";
}
