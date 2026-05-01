import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/use-app-store.ts";
import { AllocationsSection } from "./edit/allocations.tsx";
import { FinancialSection } from "./edit/financials.tsx";
import { buildAssetFromForm, toFormState, type FormState } from "./edit/form-state.ts";
import { GeneralSection } from "./edit/general.tsx";

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

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" data-testid="cancel-button" className="btn gap-1 btn-ghost btn-sm" onClick={goBack}>
          <ArrowLeft size={16} />
          Cancel
        </button>
        <button type="button" data-testid="save-button" className="btn btn-sm btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit asset</h1>
        <p className="mt-1 font-mono text-sm text-base-content">{isin}</p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <GeneralSection form={form} errors={errors} patch={patch} />
        <FinancialSection form={form} errors={errors} patch={patch} />
        <AllocationsSection form={form} patch={patch} />
      </div>
    </div>
  );
}
