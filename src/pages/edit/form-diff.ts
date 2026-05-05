import { COUNTRIES, SECTORS } from "../../schemas/index.ts";
import type { FormState } from "./form-state.ts";

const EMPTY_VALUE = "-";
const MAX_ABBREV_LENGTH = 2;

function formatAllocKey(key: string): string {
  const words = key
    .replaceAll(/([A-Z])/g, " $1")
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return words.map(word => (word.length <= MAX_ABBREV_LENGTH ? word.toUpperCase() : word)).join(" ");
}

type ComparableValue = boolean | string;

type DiffConfig = {
  field: string;
  getValue: (form: FormState) => ComparableValue;
};

export type DiffRow = {
  after: string;
  before: string;
  field: string;
};

const SCALAR_FIELDS: DiffConfig[] = [
  { field: "Name", getValue: form => form.name },
  { field: "Provider", getValue: form => form.provider },
  { field: "Tickers", getValue: form => form.tickers },
  { field: "Accumulating", getValue: form => form.isAccumulating },
  { field: "Available On Broker", getValue: form => form.availableOnBroker },
  { field: "Available For Plan", getValue: form => form.availableForPlan },
  { field: "Fees (%)", getValue: form => form.fees },
  { field: "Price (EUR)", getValue: form => form.price },
  { field: "Performance 1 Year (%)", getValue: form => form.performance1y },
  { field: "Performance 3 Years (%)", getValue: form => form.performance3y },
  { field: "Performance 5 Years (%)", getValue: form => form.performance5y },
  { field: "Risk/Reward 1 Year", getValue: form => form.riskReward1y },
  { field: "Risk/Reward 3 Years", getValue: form => form.riskReward3y },
  { field: "Risk/Reward 5 Years", getValue: form => form.riskReward5y },
];

function formatValue(value: ComparableValue): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.trim() === "" ? EMPTY_VALUE : value;
}

function makeDiffRow({ after, before, field }: { after: ComparableValue; before: ComparableValue; field: string }): DiffRow[] {
  return before === after ? [] : [{ after: formatValue(after), before: formatValue(before), field }];
}

function buildAllocationDiffRows({ current, initial, keys, prefix }: { current: Partial<Record<string, string>>; initial: Partial<Record<string, string>>; keys: readonly string[]; prefix: "Geo" | "Sector" }): DiffRow[] {
  return keys.flatMap(key =>
    makeDiffRow({
      after: current[key] ?? "",
      before: initial[key] ?? "",
      field: `${prefix} ${formatAllocKey(key)} (%)`,
    }),
  );
}

export function buildDiffRows(initialForm: FormState, currentForm: FormState): DiffRow[] {
  const scalarRows = SCALAR_FIELDS.flatMap(config => makeDiffRow({ after: config.getValue(currentForm), before: config.getValue(initialForm), field: config.field }));
  const geoRows = buildAllocationDiffRows({ current: currentForm.geoAllocation, initial: initialForm.geoAllocation, keys: COUNTRIES, prefix: "Geo" });
  const sectorRows = buildAllocationDiffRows({ current: currentForm.sectorAllocation, initial: initialForm.sectorAllocation, keys: SECTORS, prefix: "Sector" });

  return [...scalarRows, ...geoRows, ...sectorRows];
}
