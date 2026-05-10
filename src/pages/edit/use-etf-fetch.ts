import { useState } from "react";
import { fetchEtfData } from "../../utils/fetch-etf-data.ts";
import { fetchStockData } from "../../utils/fetch-stock-data.ts";
import { applyEtfPrefill } from "./apply-etf-prefill.ts";
import type { FormState } from "./form-state.ts";

type PatchFn = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
const maxStockSymbolLength = 9;

export function useEtfFetch(isin: string, patch: PatchFn, form: FormState) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | undefined>();

  async function handleFetch() {
    setIsFetching(true);
    setFetchError(undefined);
    try {
      const identifier = isin.trim();
      const data = identifier.length <= maxStockSymbolLength ? await fetchStockData(identifier) : await fetchEtfData(identifier);
      applyEtfPrefill(data, patch, form);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to fetch ETF data");
    } finally {
      setIsFetching(false);
    }
  }

  return { fetchError, handleFetch, isFetching };
}
