import { CheckboxField } from "../../components/form/checkbox-field.tsx";
import { TextField } from "../../components/form/text-field.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  errors: Record<string, string>;
  form: FormState;
  patch: PatchFn;
};

export function GeneralSection({ form, errors, patch }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">General</h2>
        <TextField label="Name" name="name" value={form.name} onChange={val => patch("name", val)} />
        {errors.name && (
          <p className="text-xs text-error" data-testid="name-error">
            {errors.name}
          </p>
        )}
        <TextField label="Provider" name="provider" value={form.provider} onChange={val => patch("provider", val)} />
        <TextField label="Tickers (comma-separated)" name="tickers" value={form.tickers} onChange={val => patch("tickers", val)} placeholder="e.g. IWDA, SWRD" />
        <h2 className="card-title">Flags</h2>
        <div className="flex justify-between">
          <CheckboxField label="Accumulating" name="isAccumulating" value={form.isAccumulating} onChange={val => patch("isAccumulating", val)} />
          <CheckboxField label="Available on broker" name="availableOnBroker" value={form.availableOnBroker} onChange={val => patch("availableOnBroker", val)} />
          <CheckboxField label="Available for plan" name="availableForPlan" value={form.availableForPlan} onChange={val => patch("availableForPlan", val)} />
        </div>
      </div>
    </div>
  );
}
