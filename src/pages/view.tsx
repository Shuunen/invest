import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAppStore } from "../store/use-app-store.ts";
import { ViewAllocationsSection } from "./view/allocations.tsx";
import { ViewFinancialSection } from "./view/financial.tsx";
import { ViewGeneralSection } from "./view/general.tsx";

type Props = { isin: string };

export function AssetViewPage({ isin }: Props) {
  const navigate = useNavigate();
  const asset = useAppStore(state => state.data.assets.find(ast => ast.isin === isin));

  if (!asset)
    return (
      <div className="p-8 text-center">
        <p className="text-base-content/60">Asset not found: {isin}</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" className="btn gap-1 btn-ghost btn-sm" onClick={() => globalThis.history.back()}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button type="button" className="btn gap-1 btn-soft btn-sm btn-primary" onClick={() => void navigate({ params: { isin }, to: "/assets/$isin/edit" })}>
          <Pencil size={14} />
          Edit
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <ViewGeneralSection asset={asset} />
        <ViewFinancialSection asset={asset} />
        <ViewAllocationsSection geoAllocation={asset.geoAllocation} sectorAllocation={asset.sectorAllocation} />
      </div>
    </div>
  );
}
