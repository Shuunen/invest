import type { FormState, PatchFn } from "./asset-edit-form-state.ts";
import { CheckboxField } from "./form/checkbox-field.tsx";

type Props = {
  form: FormState;
  patch: PatchFn;
};

export function FlagsSection({ form, patch }: Props) {
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body gap-2 p-4">
        <h2 className="card-title text-base">Flags</h2>
        <CheckboxField label="Accumulating" name="isAccumulating" value={form.isAccumulating} onChange={val => patch("isAccumulating", val)} />
        <CheckboxField label="Available on broker" name="availableOnBroker" value={form.availableOnBroker} onChange={val => patch("availableOnBroker", val)} />
        <CheckboxField label="Available for plan (PEA)" name="availableForPlan" value={form.availableForPlan} onChange={val => patch("availableForPlan", val)} />
      </div>
    </div>
  );
}
