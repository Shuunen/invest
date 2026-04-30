import { JsonTextarea } from "../../components/form/json-textarea.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  errors: Record<string, string>;
  form: FormState;
  patch: PatchFn;
};

export function AllocationsSection({ form, errors, patch }: Props) {
  return (
    <div className="card mb-4 border border-base-200 bg-base-100">
      <div className="card-body gap-3 p-4">
        <h2 className="card-title text-base">Allocations</h2>
        <JsonTextarea label="Geographic allocation (JSON)" name="geoAllocation" value={form.geoAllocation} onChange={val => patch("geoAllocation", val)} error={errors.geoAllocation} />
        <JsonTextarea label="Sector allocation (JSON)" name="sectorAllocation" value={form.sectorAllocation} onChange={val => patch("sectorAllocation", val)} error={errors.sectorAllocation} />
      </div>
    </div>
  );
}
