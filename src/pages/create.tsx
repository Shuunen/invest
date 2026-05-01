import { useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { TextField } from "../components/form/text-field.tsx";
import { useAppStore } from "../store/use-app-store.ts";
import { fetchEtfData, type EtfPrefillData } from "../utils/fetch-etf-data.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, emptyFormState, type FormState, type PatchFn } from "./edit/form-state.ts";

function applyEtfPrefill(data: EtfPrefillData, patch: PatchFn) {
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

function useAssetCreateForm() {
  const navigate = useNavigate();
  const addAsset = useAppStore(state => state.addAsset);
  const [isin, setIsin] = useState("");
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | undefined>();

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
  }

  function patchIsin(value: string) {
    setIsin(value);
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== "isin")));
  }

  async function handleFetch() {
    setIsFetching(true);
    setFetchError(undefined);
    try {
      applyEtfPrefill(await fetchEtfData(isin), patch);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to fetch ETF data");
    } finally {
      setIsFetching(false);
    }
  }

  function handleSave() {
    const result = buildAssetFromForm(isin, form);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    addAsset(result.data);
    void navigate({ to: "/" });
  }

  return { errors, fetchError, form, handleFetch, handleSave, isFetching, isin, patch, patchIsin };
}

export function AssetCreatePage() {
  const navigate = useNavigate();
  const { errors, fetchError, form, handleFetch, handleSave, isFetching, isin, patch, patchIsin } = useAssetCreateForm();

  const goBack = () => void navigate({ to: "/" });

  return (
    <AssetForm
      title="Create asset"
      isinDisplay={
        <div className="mt-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField label="ISIN" name="isin" value={isin} onChange={patchIsin} placeholder="e.g. IE00B4L5Y983" />
            </div>
            <button type="button" data-testid="fetch-etf-button" className="btn btn-outline btn-sm" disabled={isin.length === 0 || isFetching} onClick={() => void handleFetch()}>
              {isFetching ? <span className="loading loading-xs loading-spinner" data-testid="fetch-spinner" /> : <RefreshCw size={14} />}
              Fetch
            </button>
          </div>
          {errors.isin && (
            <p className="mt-1 text-xs text-error" data-testid="isin-error">
              {errors.isin}
            </p>
          )}
          {fetchError !== undefined && (
            <p className="mt-1 text-xs text-error" data-testid="fetch-error">
              {fetchError}
            </p>
          )}
        </div>
      }
      errors={errors}
      form={form}
      onCancel={goBack}
      onSave={handleSave}
      patch={patch}
    />
  );
}
