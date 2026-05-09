import type { Asset } from "../../schemas/index.ts";
import { AllocationCard } from "./allocation-card.tsx";

const GEO_COLORS: Record<string, string> = {
  africa: "var(--color-stone-800)",
  asia: "var(--color-orange-800)",
  australia: "var(--color-red-800)",
  austria: "var(--color-yellow-700)",
  belgium: "var(--color-cyan-800)",
  brazil: "var(--color-emerald-800)",
  canada: "var(--color-indigo-900)",
  china: "var(--color-red-900)",
  denmark: "var(--color-amber-700)",
  europe: "var(--color-amber-900)",
  finland: "var(--color-purple-900)",
  france: "var(--color-amber-800)",
  germany: "var(--color-lime-800)",
  hongKong: "var(--color-violet-900)",
  india: "var(--color-yellow-800)",
  indonesia: "var(--color-fuchsia-800)",
  ireland: "var(--color-green-800)",
  italy: "var(--color-indigo-700)",
  japan: "var(--color-blue-700)",
  malaysia: "var(--color-teal-900)",
  netherlands: "var(--color-cyan-700)",
  norway: "var(--color-green-900)",
  poland: "var(--color-stone-900)",
  saudiArabia: "var(--color-teal-700)",
  southKorea: "var(--color-orange-900)",
  spain: "var(--color-orange-700)",
  sweden: "var(--color-red-700)",
  switzerland: "var(--color-teal-800)",
  taiwan: "var(--color-lime-900)",
  thailand: "var(--color-yellow-900)",
  uk: "var(--color-sky-800)",
  us: "var(--color-sky-900)",
};

const SECTOR_COLORS: Record<string, string> = {
  communicationServices: "var(--color-blue-800)",
  consumerDiscretionary: "var(--color-red-900)",
  consumerStaples: "var(--color-cyan-900)",
  energy: "var(--color-yellow-700)",
  financials: "var(--color-amber-800)",
  healthcare: "var(--color-emerald-700)",
  industrials: "var(--color-red-900)",
  materials: "var(--color-purple-800)",
  realEstate: "var(--color-violet-800)",
  technology: "var(--color-sky-700)",
  utilities: "var(--color-green-700)",
};

type Props = {
  geoAllocation: Asset["geoAllocation"];
  sectorAllocation: Asset["sectorAllocation"];
};

export function ViewAllocationsSection({ geoAllocation, sectorAllocation }: Props) {
  return (
    <>
      <AllocationCard name="geo-allocation" colorMap={GEO_COLORS} map={geoAllocation} title="Geographic allocation" />
      <AllocationCard name="sector-allocation" colorMap={SECTOR_COLORS} map={sectorAllocation} title="Sector allocation" />
    </>
  );
}
