import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TextField } from "../components/form/text-field.tsx";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildAssetFromForm, emptyFormState, type FormState } from "./edit/form-state.ts";

function useAssetCreateForm() {
  const navigate = useNavigate();
  const addAsset = useAppStore(state => state.addAsset);
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

  function handleSave() {
    const result = buildAssetFromForm(isin, form);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    addAsset(result.data);
    void navigate({ to: "/" });
  }

  return { errors, form, handleSave, isin, patch, patchIsin };
}

export function AssetCreatePage() {
  const navigate = useNavigate();
  const { errors, form, handleSave, isin, patch, patchIsin } = useAssetCreateForm();

  const goBack = () => void navigate({ to: "/" });

  return (
    <AssetForm
      title="Create asset"
      isinDisplay={
        <div className="mt-3">
          <TextField label="ISIN" name="isin" value={isin} onChange={patchIsin} placeholder="e.g. IE00B4L5Y983" />
          {errors.isin && (
            <p className="mt-1 text-xs text-error" data-testid="isin-error">
              {errors.isin}
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
