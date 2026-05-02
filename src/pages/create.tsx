import { useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { TextField } from "../components/form/text-field.tsx";
import { ISIN_REGEX } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { fetchEtfData } from "../utils/fetch-etf-data.ts";
import { applyEtfPrefill } from "./edit/apply-etf-prefill.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, emptyFormState, type FormState } from "./edit/form-state.ts";

function useAssetCreateForm() {
  const navigate = useNavigate();
  const addAsset = useAppStore(state => state.addAsset);
  const assets = useAppStore(state => state.data.assets);
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
    if (assets.some(asset => asset.isin === isin)) {
      setErrors({ isin: "An asset with this ISIN already exists" });
      return;
    }
    addAsset(result.data);
    void navigate({ to: "/" });
  }

  const goBack = () => void navigate({ to: "/" });

  return { errors, fetchError, form, goBack, handleFetch, handleSave, isFetching, isin, patch, patchIsin };
}

export function AssetCreatePage() {
  const { errors, fetchError, form, goBack, handleFetch, handleSave, isFetching, isin, patch, patchIsin } = useAssetCreateForm();

  return (
    <AssetForm
      title="Create asset"
      isinDisplay={
        <div className="mt-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField label="ISIN" name="isin" value={isin} onChange={patchIsin} placeholder="e.g. IE00B4L5Y983" />
            </div>
            <button type="button" data-testid="fetch-etf-button" className="btn btn-outline btn-sm" disabled={!ISIN_REGEX.test(isin) || isFetching} onClick={() => void handleFetch()}>
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
