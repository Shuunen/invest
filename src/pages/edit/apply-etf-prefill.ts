import type { EtfPrefillData } from "../../utils/fetch-etf-data.ts";
import type { FormState, PatchFn } from "./form-state.ts";

export function applyEtfPrefill(data: EtfPrefillData, patch: PatchFn) {
  // oxlint-disable-next-line no-console
  console.log("Applying ETF prefill", data);
  if (data.name !== undefined) patch("name", data.name);
  if (data.provider !== undefined) patch("provider", data.provider);
  if (data.tickers !== undefined) patch("tickers", data.tickers);
  if (data.isAccumulating !== undefined) patch("isAccumulating", data.isAccumulating);
  if (data.fees !== undefined) patch("fees", data.fees);
  if (data.performance1y !== undefined) patch("performance1y", data.performance1y);
  if (data.performance3y !== undefined) patch("performance3y", data.performance3y);
  if (data.performance5y !== undefined) patch("performance5y", data.performance5y);
  if (data.riskReward1y !== undefined) patch("riskReward1y", data.riskReward1y);
  if (data.riskReward3y !== undefined) patch("riskReward3y", data.riskReward3y);
  if (data.riskReward5y !== undefined) patch("riskReward5y", data.riskReward5y);
  if (Object.keys(data.geoAllocation).length > 0)
    patch(
      "geoAllocation",
      Object.fromEntries(
        Object.entries(data.geoAllocation)
          .filter((entry): entry is [string, number] => entry[1] !== undefined)
          .map(([country, pct]) => [country, String(pct)]),
      ) as FormState["geoAllocation"],
    );
  if (Object.keys(data.sectorAllocation).length > 0)
    patch(
      "sectorAllocation",
      Object.fromEntries(
        Object.entries(data.sectorAllocation)
          .filter((entry): entry is [string, number] => entry[1] !== undefined)
          .map(([sector, pct]) => [sector, String(pct)]),
      ) as FormState["sectorAllocation"],
    );
}
