import { AllocationChart } from "../../components/charts/allocation.tsx";
import type { Asset } from "../../schemas/index.ts";

type Props = {
  geoAllocation: Asset["geoAllocation"];
  sectorAllocation: Asset["sectorAllocation"];
};

export function ViewAllocationsSection({ geoAllocation, sectorAllocation }: Props) {
  return (
    <>
      <AllocationChart card name="geo-allocation" data={geoAllocation} title="Geographic allocation" size={300} />
      <AllocationChart card name="sector-allocation" data={sectorAllocation} title="Sector allocation" size={300} />
    </>
  );
}
