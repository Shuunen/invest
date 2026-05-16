import { startCase } from "es-toolkit";
import { countries, sectors } from "../../schemas/index.ts";
import type { FormState } from "./form-state.ts";

const emptyValue = "-";

type ComparableValue = boolean | string;
type ScalarFormKey = Exclude<keyof FormState, "geoAllocation" | "sectorAllocation">;

type DiffConfig = {
  field: string;
  key: ScalarFormKey;
};

export type DiffRow = {
  after: string;
  before: string;
  field: string;
  reset: (currentForm: FormState, initialForm: FormState) => FormState;
};

const scalarFields: DiffConfig[] = [
  { field: "ISIN", key: "isin" },
  { field: "Name", key: "name" },
  { field: "Provider", key: "provider" },
  { field: "Tickers", key: "tickers" },
  { field: "Accumulating", key: "isAccumulating" },
  { field: "Available On Broker", key: "availableOnBroker" },
  { field: "Available For Plan", key: "availableForPlan" },
  { field: "Fees (%)", key: "fees" },
  { field: "Price (EUR)", key: "price" },
  { field: "Performance 1 Year (%)", key: "performance1y" },
  { field: "Performance 3 Years (%)", key: "performance3y" },
  { field: "Performance 5 Years (%)", key: "performance5y" },
  { field: "Risk/Reward 1 Year", key: "riskReward1y" },
  { field: "Risk/Reward 3 Years", key: "riskReward3y" },
  { field: "Risk/Reward 5 Years", key: "riskReward5y" },
];

function formatValue(value: ComparableValue): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.trim() === "" ? emptyValue : value;
}

function makeDiffRow({ after, before, field, reset }: { after: ComparableValue; before: ComparableValue; field: string; reset: (currentForm: FormState, initialForm: FormState) => FormState }): DiffRow[] {
  return before === after ? [] : [{ after: formatValue(after), before: formatValue(before), field, reset }];
}

function buildAllocationDiffRows<Key extends string>({ current, initial, keys, prefix }: { current: Partial<Record<Key, string>>; initial: Partial<Record<Key, string>>; keys: readonly Key[]; prefix: "Geo" | "Sector" }): DiffRow[] {
  return keys.flatMap(key =>
    makeDiffRow({
      after: current[key] ?? "",
      before: initial[key] ?? "",
      field: `${prefix} ${startCase(key)} (%)`,
      reset: (currentForm, initialForm) => {
        if (prefix === "Geo") {
          const initialValue = initialForm.geoAllocation[key as keyof typeof initialForm.geoAllocation] ?? "";
          return {
            ...currentForm,
            geoAllocation: {
              ...currentForm.geoAllocation,
              [key]: initialValue,
            },
          };
        }
        const initialValue = initialForm.sectorAllocation[key as keyof typeof initialForm.sectorAllocation] ?? "";
        return {
          ...currentForm,
          sectorAllocation: {
            ...currentForm.sectorAllocation,
            [key]: initialValue,
          },
        };
      },
    }),
  );
}

export function buildDiffRows(initialForm: FormState, currentForm: FormState): DiffRow[] {
  const scalarRows = scalarFields.flatMap(config =>
    makeDiffRow({
      after: currentForm[config.key],
      before: initialForm[config.key],
      field: config.field,
      reset: (currentSnapshotForm, initialSnapshotForm) => ({
        ...currentSnapshotForm,
        [config.key]: initialSnapshotForm[config.key],
      }),
    }),
  );
  const geoRows = buildAllocationDiffRows({ current: currentForm.geoAllocation, initial: initialForm.geoAllocation, keys: countries, prefix: "Geo" });
  const sectorRows = buildAllocationDiffRows({ current: currentForm.sectorAllocation, initial: initialForm.sectorAllocation, keys: sectors, prefix: "Sector" });

  return [...scalarRows, ...geoRows, ...sectorRows];
}
