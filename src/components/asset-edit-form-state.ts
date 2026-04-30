import { AssetSchema, type Asset } from "../schemas/index.ts";
import { jsonParse, jsonStringify } from "../utils/json.ts";

export type FormState = {
  availableForPlan: boolean;
  availableOnBroker: boolean;
  fees: string;
  geoAllocation: string;
  isAccumulating: boolean;
  name: string;
  performance1y: string;
  performance3y: string;
  performance5y: string;
  price: string;
  provider: string;
  riskReward1y: string;
  riskReward3y: string;
  riskReward5y: string;
  sectorAllocation: string;
  tickers: string;
};

export type PatchFn = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;

export function toFormState(asset: Asset): FormState {
  return {
    availableForPlan: asset.availableForPlan,
    availableOnBroker: asset.availableOnBroker,
    fees: String(asset.fees),
    geoAllocation: jsonStringify(asset.geoAllocation),
    isAccumulating: asset.isAccumulating,
    name: asset.name,
    performance1y: asset.performance1y === undefined ? "" : String(asset.performance1y),
    performance3y: asset.performance3y === undefined ? "" : String(asset.performance3y),
    performance5y: asset.performance5y === undefined ? "" : String(asset.performance5y),
    price: asset.price === undefined ? "" : String(asset.price),
    provider: asset.provider,
    riskReward1y: asset.riskReward1y === undefined ? "" : String(asset.riskReward1y),
    riskReward3y: asset.riskReward3y === undefined ? "" : String(asset.riskReward3y),
    riskReward5y: asset.riskReward5y === undefined ? "" : String(asset.riskReward5y),
    sectorAllocation: jsonStringify(asset.sectorAllocation),
    tickers: asset.tickers.join(", "),
  };
}

export function parseOptionalNumber(str: string): number | undefined {
  const trimmed = str.trim();
  if (trimmed === "") return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
}

function parseTickers(raw: string): string[] {
  return raw
    .split(",")
    .map(ticker => ticker.trim())
    .filter(Boolean);
}

function parseZodErrors(issues: { message: string; path: unknown[] }[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const [field] = issue.path;
    /* v8 ignore next */
    if (typeof field !== "string") continue;
    fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

export function buildAssetFromForm(isin: string, form: FormState): { data: Asset } | { errors: Record<string, string> } {
  const result = AssetSchema.safeParse({
    availableForPlan: form.availableForPlan,
    availableOnBroker: form.availableOnBroker,
    fees: Number(form.fees),
    geoAllocation: jsonParse(form.geoAllocation) ?? {},
    isAccumulating: form.isAccumulating,
    isin,
    name: form.name,
    performance1y: parseOptionalNumber(form.performance1y),
    performance3y: parseOptionalNumber(form.performance3y),
    performance5y: parseOptionalNumber(form.performance5y),
    price: parseOptionalNumber(form.price),
    provider: form.provider,
    riskReward1y: parseOptionalNumber(form.riskReward1y),
    riskReward3y: parseOptionalNumber(form.riskReward3y),
    riskReward5y: parseOptionalNumber(form.riskReward5y),
    sectorAllocation: jsonParse(form.sectorAllocation) ?? {},
    tickers: parseTickers(form.tickers),
  });

  if (!result.success) return { errors: parseZodErrors(result.error.issues) };

  return { data: result.data };
}
