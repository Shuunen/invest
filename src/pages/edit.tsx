import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { useEffect, useMemo, useState } from "react";
import type { Asset } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildDiffRows, type DiffRow } from "./edit/form-diff.ts";
import { buildAssetFromForm, toFormState, type FormState } from "./edit/form-state.ts";
import { IsinFetchRow } from "./edit/isin-fetch-row.tsx";
import { SaveModal } from "./edit/save-modal.tsx";
import { useEtfFetch } from "./edit/use-etf-fetch.ts";

type ConfirmAssetSaveParams = {
  asset: Asset | undefined;
  form: FormState | undefined;
  isin: string;
  navigate: ReturnType<typeof useNavigate>;
  onReset: () => void;
  onValidationError: (errors: Record<string, string>) => void;
  updateAsset: (isin: string, asset: Asset) => void;
};

function useConfirmAssetSave({ asset, form, isin, navigate, onReset, onValidationError, updateAsset }: ConfirmAssetSaveParams) {
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function openConfirm() {
    invariant(form, "Expected form to be defined");
    invariant(asset, "Expected asset to be defined");
    const result = buildAssetFromForm(isin, form);
    if ("errors" in result) {
      onValidationError(result.errors);
      return;
    }
    setDiffRows(buildDiffRows(toFormState(asset), form));
    setIsConfirmOpen(true);
  }

  function confirmSave() {
    invariant(form, "Expected form to be defined");
    const result = buildAssetFromForm(isin, form);
    if ("errors" in result) {
      onValidationError(result.errors);
      setIsConfirmOpen(false);
      return;
    }
    setIsConfirmOpen(false);
    updateAsset(isin, result.data);
    void navigate({ params: { isin }, to: "/assets/$isin" });
  }

  return {
    closeConfirm: () => setIsConfirmOpen(false),
    confirmSave,
    diffRows,
    isConfirmOpen,
    openConfirm,
    resetAndClose: () => {
      onReset();
      setIsConfirmOpen(false);
    },
  };
}

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

  function resetForm() {
    invariant(asset, "Expected asset to be defined when resetting");
    setForm(toFormState(asset));
    setErrors({});
  }

  const { fetchError, handleFetch, isFetching } = useEtfFetch(isin, patch);
  const hasChanges = useMemo(() => (asset && form ? buildDiffRows(toFormState(asset), form).length > 0 : false), [asset, form]);
  const { closeConfirm, confirmSave, diffRows, isConfirmOpen, openConfirm, resetAndClose } = useConfirmAssetSave({
    asset,
    form,
    isin,
    navigate,
    onReset: resetForm,
    onValidationError: setErrors,
    updateAsset,
  });

  return { closeConfirm, confirmSave, diffRows, errors, fetchError, form, handleFetch, hasChanges, isConfirmOpen, isFetching, openConfirm, patch, resetAndClose };
}

type Props = { isin: string };

export function AssetEditPage({ isin }: Props) {
  const navigate = useNavigate();
  const { closeConfirm, confirmSave, diffRows, form, errors, fetchError, patch, handleFetch, hasChanges, isConfirmOpen, isFetching, openConfirm, resetAndClose } = useAssetEditForm(isin);

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
    <>
      <AssetForm
        title="Edit asset"
        isinDisplay={<IsinFetchRow isin={isin} isFetching={isFetching} fetchError={fetchError} onFetch={() => void handleFetch()} readOnly />}
        errors={errors}
        form={form}
        onCancel={goBack}
        onSave={openConfirm}
        patch={patch}
        disableSave={!hasChanges}
      />
      {isConfirmOpen && <SaveModal diffRows={diffRows} onClose={closeConfirm} onConfirm={confirmSave} onReset={resetAndClose} />}
    </>
  );
}
