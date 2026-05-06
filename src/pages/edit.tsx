import { useNavigate } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { Asset } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { AssetForm } from "./edit/asset-form.tsx";
import { buildDiffRows, type DiffRow } from "./edit/form-diff.ts";
import { buildAssetFromForm, emptyFormState, toFormState, type FormState } from "./edit/form-state.ts";
import { IsinFetchRow } from "./edit/isin-fetch-row.tsx";
import { SaveModal } from "./edit/save-modal.tsx";
import { useEtfFetch } from "./edit/use-etf-fetch.ts";

type ConfirmAssetSaveParams = {
  asset: Asset | undefined;
  form: FormState | undefined;
  navigate: ReturnType<typeof useNavigate>;
  onReset: () => void;
  onValidationError: (errors: Record<string, string>) => void;
  originalIsin: string;
  updateAsset: (isin: string, asset: Asset) => void;
};

function useConfirmAssetSave({ asset, form, navigate, onReset, onValidationError, originalIsin, updateAsset }: ConfirmAssetSaveParams) {
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [snapshotForm, setSnapshotForm] = useState<FormState | undefined>();

  function openConfirm() {
    invariant(form, "Expected form to be defined");
    invariant(asset, "Expected asset to be defined");
    const result = buildAssetFromForm(form);
    if ("errors" in result) {
      onValidationError(result.errors);
      return;
    }
    setSnapshotForm(form);
    setDiffRows(buildDiffRows(toFormState(asset), form));
    setIsConfirmOpen(true);
  }

  function confirmSave() {
    invariant(snapshotForm, "Expected snapshot form to be defined");
    // Snapshot was validated at openConfirm time — error path is unreachable
    const result = buildAssetFromForm(snapshotForm) as { data: Asset };
    setIsConfirmOpen(false);
    updateAsset(originalIsin, result.data);
    toast.success("Asset saved");
    void navigate({ params: { isin: snapshotForm.isin }, replace: true, to: "/assets/$isin" });
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

function useAssetEditForm(originalIsin: string) {
  const navigate = useNavigate();
  const asset = useAppStore(state => state.data.assets.find(ast => ast.isin === originalIsin));
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

  const { fetchError, handleFetch, isFetching } = useEtfFetch((form ?? emptyFormState).isin, patch, form ?? emptyFormState);
  const hasChanges = useMemo(() => (asset && form ? buildDiffRows(toFormState(asset), form).length > 0 : false), [asset, form]);
  const { closeConfirm, confirmSave, diffRows, isConfirmOpen, openConfirm, resetAndClose } = useConfirmAssetSave({
    asset,
    form,
    navigate,
    onReset: resetForm,
    onValidationError: setErrors,
    originalIsin,
    updateAsset,
  });

  return { closeConfirm, confirmSave, diffRows, errors, fetchError, form, handleFetch, hasChanges, isConfirmOpen, isFetching, openConfirm, patch, resetAndClose };
}

type Props = { isin: string };

export function AssetEditPage({ isin: originalIsin }: Props) {
  const navigate = useNavigate();
  const { closeConfirm, confirmSave, diffRows, form, errors, fetchError, patch, handleFetch, hasChanges, isConfirmOpen, isFetching, openConfirm, resetAndClose } = useAssetEditForm(originalIsin);

  if (!form)
    return (
      <div className="p-8 text-center">
        <p data-testid="not-found" className="text-base-content/60">
          Asset not found: {originalIsin}
        </p>
      </div>
    );

  const goBack = () => void navigate({ params: { isin: originalIsin }, replace: true, to: "/assets/$isin" });

  return (
    <>
      <AssetForm
        title="Edit asset"
        isinDisplay={<IsinFetchRow isin={form.isin} isFetching={isFetching} fetchError={fetchError} isinError={errors.isin} onFetch={() => void handleFetch()} onIsinChange={value => patch("isin", value)} />}
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
