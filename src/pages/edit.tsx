import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/use-app-store.ts";
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

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(prev => {
      invariant(prev, "Expected form to be defined when patching");
      return { ...prev, [key]: value };
    });
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([errKey]) => errKey !== key)));
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

  return { errors, form, handleSave, patch };
}

type Props = { isin: string };

export function AssetEditPage({ isin }: Props) {
  const navigate = useNavigate();
  const { form, errors, patch, handleSave } = useAssetEditForm(isin);

  if (!form)
    return (
      <div className="p-8 text-center">
        <p data-testid="not-found" className="text-base-content/60">
          Asset not found: {isin}
        </p>
      </div>
    );

  const goBack = () => void navigate({ params: { isin }, replace: true, to: "/assets/$isin" });

  return <AssetForm title="Edit asset" isinDisplay={<p className="mt-1 font-mono text-sm text-base-content">{isin}</p>} errors={errors} form={form} onCancel={goBack} onSave={handleSave} patch={patch} />;
}
