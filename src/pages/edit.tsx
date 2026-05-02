import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, toFormState, type FormState } from "./edit/form-state.ts";
import { IsinFetchRow } from "./edit/isin-fetch-row.tsx";
import { useEtfFetch } from "./edit/use-etf-fetch.ts";

function useAssetEditForm(isin: string) {
  const navigate = useNavigate();
  const asset = useAppStore(state => state.data.assets.find(ast => ast.isin === isin));
  const updateAsset = useAppStore(state => state.updateAsset);

  const [form, setForm] = useState<FormState | undefined>(() => (asset ? toFormState(asset) : undefined));

  useEffect(() => {
    if (asset && !form) setForm(toFormState(asset));
  }, [asset, form]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => {
      invariant(prev, "Expected form to be defined when patching");
      return { ...prev, [key]: value };
    });
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
  }

  const { fetchError, handleFetch, isFetching } = useEtfFetch(isin, patch);

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
      isinDisplay={<IsinFetchRow isin={isin} isFetching={isFetching} fetchError={fetchError} onFetch={() => void handleFetch()} readOnly />}
      errors={errors}
      form={form}
      onCancel={goBack}
      onSave={handleSave}
      patch={patch}
    />
  );
}
