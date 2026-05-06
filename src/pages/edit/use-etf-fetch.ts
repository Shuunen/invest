import { useState } from "react";
import { fetchEtfData } from "../../utils/fetch-etf-data.ts";
import { applyEtfPrefill } from "./apply-etf-prefill.ts";
import type { FormState } from "./form-state.ts";

type PatchFn = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;

export function useEtfFetch(isin: string, patch: PatchFn, form: FormState) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | undefined>();

  async function handleFetch() {
    setIsFetching(true);
    setFetchError(undefined);
    try {
      applyEtfPrefill(await fetchEtfData(isin), patch, form);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to fetch ETF data");
    } finally {
      setIsFetching(false);
    }
  }

  return { fetchError, handleFetch, isFetching };
}
