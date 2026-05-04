import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, emptyFormState, type FormState } from "./edit/form-state.ts";
import { IsinFetchRow } from "./edit/isin-fetch-row.tsx";
import { useEtfFetch } from "./edit/use-etf-fetch.ts";

function useAssetCreateForm() {
  const navigate = useNavigate();
  const addAsset = useAppStore(state => state.addAsset);
  const assets = useAppStore(state => state.data.assets);
  const [isin, setIsin] = useState("");
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
  }

  function patchIsin(value: string) {
    setIsin(value);
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== "isin")));
  }

  const { fetchError, handleFetch, isFetching } = useEtfFetch(isin, patch);

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
      isinDisplay={<IsinFetchRow isin={isin} isFetching={isFetching} fetchError={fetchError} isinError={errors.isin} onFetch={() => void handleFetch()} onIsinChange={patchIsin} />}
      errors={errors}
      form={form}
      onCancel={goBack}
      onSave={handleSave}
      patch={patch}
    />
  );
}
