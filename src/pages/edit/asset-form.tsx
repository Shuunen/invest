import { ArrowLeft } from "lucide-react";
import { AllocationsSection } from "./allocations.tsx";
import { FinancialSection } from "./financials.tsx";
import type { FormState, PatchFn } from "./form-state.ts";
import { GeneralSection } from "./general.tsx";

type Props = {
  disableSave?: boolean;
  errors: Record<string, string>;
  form: FormState;
  /** Rendered below the title — use a plain text node for edit (shows ISIN) or a form field for create. */
  isinDisplay?: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
  patch: PatchFn;
  title: string;
};

export function AssetForm({ disableSave = false, errors, form, isinDisplay, onCancel, onSave, patch, title }: Props) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" data-testid="cancel-button" className="btn gap-1 btn-ghost btn-sm" onClick={onCancel}>
          <ArrowLeft size={16} />
          Cancel
        </button>
        <button type="button" data-testid="save-button" className="btn btn-sm btn-primary" onClick={onSave} disabled={disableSave}>
          Save
        </button>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {isinDisplay}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <GeneralSection form={form} errors={errors} patch={patch} />
        <FinancialSection form={form} errors={errors} patch={patch} />
        <AllocationsSection form={form} patch={patch} />
      </div>
    </div>
  );
}
