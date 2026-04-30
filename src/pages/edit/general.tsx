import { TextField } from "../../components/form/text-field.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  errors: Record<string, string>;
  form: FormState;
  patch: PatchFn;
};

export function GeneralSection({ form, errors, patch }: Props) {
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body gap-3 p-4">
        <h2 className="card-title text-base">General</h2>
        <TextField label="Name" name="name" value={form.name} onChange={val => patch("name", val)} />
        {errors.name && <p className="text-xs text-error">{errors.name}</p>}
        <TextField label="Provider" name="provider" value={form.provider} onChange={val => patch("provider", val)} />
        <TextField label="Tickers (comma-separated)" name="tickers" value={form.tickers} onChange={val => patch("tickers", val)} placeholder="e.g. IWDA, SWRD" />
      </div>
    </div>
  );
}
