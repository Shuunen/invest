import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, emptyFormState, type FormState } from "./edit/form-state.ts";
import { IsinFetchRow } from "./edit/isin-fetch-row.tsx";
import { useEtfFetch } from "./edit/use-etf-fetch.ts";

function useAssetCreateForm() {
  const navigate = useNavigate();
  const addAsset = useAppStore(state => state.addAsset);
  const assets = useAppStore(state => state.data.assets);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
  }

  const { fetchError, handleFetch, isFetching } = useEtfFetch(form.isin, patch, form);

  function handleSave() {
    const result = buildAssetFromForm(form);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    if (assets.some(asset => asset.isin === form.isin)) {
      setErrors({ isin: "An asset with this ISIN already exists" });
      return;
    }
    addAsset(result.data);
    toast.success("Asset created");
    void navigate({ to: "/" });
  }

  const goBack = () => void navigate({ to: "/" });

  return { errors, fetchError, form, goBack, handleFetch, handleSave, isFetching, patch };
}

export function AssetCreatePage() {
  const { errors, fetchError, form, goBack, handleFetch, handleSave, isFetching, patch } = useAssetCreateForm();

  return (
    <AssetForm
      title="Create asset"
      isinDisplay={<IsinFetchRow isin={form.isin} isFetching={isFetching} fetchError={fetchError} isinError={errors.isin} onFetch={() => void handleFetch()} onIsinChange={value => patch("isin", value)} />}
      errors={errors}
      form={form}
      onCancel={goBack}
      onSave={handleSave}
      patch={patch}
    />
  );
}
