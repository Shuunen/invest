import type { Asset } from "../../schemas/index.ts";
import { AllocationCard } from "./allocation-card.tsx";

type Props = {
  geoAllocation: Asset["geoAllocation"];
  sectorAllocation: Asset["sectorAllocation"];
};

export function ViewAllocationsSection({ geoAllocation, sectorAllocation }: Props) {
  return (
    <>
      <AllocationCard name="geo-allocation" data={geoAllocation} title="Geographic allocation" />
      <AllocationCard name="sector-allocation" data={sectorAllocation} title="Sector allocation" />
    </>
  );
}
