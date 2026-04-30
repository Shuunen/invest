import { JsonTextarea } from "../../components/form/json-textarea.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  errors: Record<string, string>;
  form: FormState;
  patch: PatchFn;
};

export function AllocationsSection({ form, errors, patch }: Props) {
  return (
    <>
      <div className="card border border-base-200 bg-base-100">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">Geographic allocation</h2>
          <JsonTextarea name="geo-allocation" value={form.geoAllocation} onChange={val => patch("geoAllocation", val)} error={errors.geoAllocation} />
        </div>
      </div>
      <div className="card border border-base-200 bg-base-100">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">Sector allocation</h2>
          <JsonTextarea name="sector-allocation" value={form.sectorAllocation} onChange={val => patch("sectorAllocation", val)} error={errors.sectorAllocation} />
        </div>
      </div>
    </>
  );
}
