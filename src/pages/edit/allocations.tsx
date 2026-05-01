import { NumberField } from "../../components/form/number-field.tsx";
import { COUNTRIES, SECTORS, type Country, type Sector } from "../../schemas/index.ts";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  form: FormState;
  patch: PatchFn;
};

const SHORT_LABEL_MAX_LENGTH = 3;

function formatLabel(key: string): string {
  if (key.length <= SHORT_LABEL_MAX_LENGTH) return key.toUpperCase();
  return key
    .replaceAll(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AllocationsSection({ form, patch }: Props) {
  function patchGeo(country: Country, value: string) {
    patch("geoAllocation", { ...form.geoAllocation, [country]: value });
  }

  function patchSector(sector: Sector, value: string) {
    patch("sectorAllocation", { ...form.sectorAllocation, [sector]: value });
  }

  return (
    <>
      <div className="card border border-base-200 bg-base-100">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">Geographic allocation</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {COUNTRIES.map(country => (
              <NumberField key={country} label={formatLabel(country)} isHorizontal name={`geo-allocation-${country}`} suffix="%" value={form.geoAllocation[country] ?? ""} onChange={value => patchGeo(country, value)} />
            ))}
          </div>
        </div>
      </div>
      <div className="card border border-base-200 bg-base-100">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">Sector allocation</h2>
          <div className="grid gap-x-4 gap-y-2">
            {SECTORS.map(sector => (
              <NumberField key={sector} label={formatLabel(sector)} isHorizontal name={`sector-allocation-${sector}`} suffix="%" value={form.sectorAllocation[sector] ?? ""} onChange={value => patchSector(sector, value)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
