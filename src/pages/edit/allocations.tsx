import { startCase } from "es-toolkit";
import { NumberField } from "../../components/form/number-field.tsx";
import { countries, sectors, type Country, type Sector } from "../../schemas/index.ts";
import { ProgressBar } from "../view/progress-bar.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  form: FormState;
  patch: PatchFn;
};

export function AllocationsSection({ form, patch }: Props) {
  const totalGeo = Object.values(form.geoAllocation).reduce((sum, val) => sum + Number(val), 0);
  const totalSector = Object.values(form.sectorAllocation).reduce((sum, val) => sum + Number(val), 0);

  function patchGeo(country: Country, value: string) {
    patch("geoAllocation", { ...form.geoAllocation, [country]: value });
  }

  function patchSector(sector: Sector, value: string) {
    patch("sectorAllocation", { ...form.sectorAllocation, [sector]: value });
  }

  return (
    <>
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Geographic allocation</h2>
          <ProgressBar name="geo-allocation" total={totalGeo} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {countries.map(country => (
              <NumberField key={country} label={startCase(country)} isHorizontal name={`geo-allocation-${country}`} suffix="%" value={form.geoAllocation[country] ?? ""} onChange={value => patchGeo(country, value)} />
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Sector allocation</h2>
          <ProgressBar name="sector-allocation" total={totalSector} />
          <div className="grid gap-x-4 gap-y-2">
            {sectors.map(sector => (
              <NumberField key={sector} label={startCase(sector)} isHorizontal name={`sector-allocation-${sector}`} suffix="%" value={form.sectorAllocation[sector] ?? ""} onChange={value => patchSector(sector, value)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
