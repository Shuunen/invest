import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { TextField } from "../components/form/text-field.tsx";
import { useAppStore } from "../store/use-app-store.ts";
import { fetchEtfData } from "../utils/fetch-etf-data.ts";
import { applyEtfPrefill } from "./edit/apply-etf-prefill.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, toFormState, type FormState } from "./edit/form-state.ts";

function useAssetEditForm(isin: string) {
  const navigate = useNavigate();
  const asset = useAppStore(state => state.data.assets.find(ast => ast.isin === isin));
  const updateAsset = useAppStore(state => state.updateAsset);

  const [form, setForm] = useState<FormState | undefined>(() => (asset ? toFormState(asset) : undefined));

  useEffect(() => {
    if (asset && !form) setForm(toFormState(asset));
  }, [asset, form]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | undefined>();

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => {
      invariant(prev, "Expected form to be defined when patching");
      return { ...prev, [key]: value };
    });
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
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
    invariant(form, "Expected form to be defined");
    const result = buildAssetFromForm(isin, form);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    updateAsset(isin, result.data);
    void navigate({ params: { isin }, to: "/assets/$isin" });
  }

  return { errors, fetchError, form, handleFetch, handleSave, isFetching, patch };
}

type Props = { isin: string };

export function AssetEditPage({ isin }: Props) {
  const navigate = useNavigate();
  const { form, errors, fetchError, patch, handleFetch, handleSave, isFetching } = useAssetEditForm(isin);

  if (!form)
    return (
      <div className="p-8 text-center">
        <p data-testid="not-found" className="text-base-content/60">
          Asset not found: {isin}
        </p>
      </div>
    );

  const goBack = () => void navigate({ params: { isin }, replace: true, to: "/assets/$isin" });

  return (
    <AssetForm
      title="Edit asset"
      isinDisplay={
        <div className="mt-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField label="ISIN" name="isin" value={isin} onChange={() => undefined} readOnly />
            </div>
            <button type="button" data-testid="fetch-etf-button" className="btn btn-outline btn-sm" disabled={isFetching} onClick={() => void handleFetch()}>
              {isFetching ? <span className="loading loading-xs loading-spinner" data-testid="fetch-spinner" /> : <RefreshCw size={14} />}
              Fetch
            </button>
          </div>
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
