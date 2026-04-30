import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { computeScore } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { formatNumber, SCORE_MISSING_VALUE } from "./asset-table-utils.ts";
import { ViewAllocationsSection } from "./asset-view-allocations-section.tsx";
import { ViewFinancialSection } from "./asset-view-financial-section.tsx";
import { ViewGeneralSection } from "./asset-view-general-section.tsx";

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

  const score = computeScore(asset) ?? SCORE_MISSING_VALUE;
  const scoreDisplay = score === SCORE_MISSING_VALUE ? "—" : formatNumber(score);

  return (
    <div className="mx-auto max-w-2xl p-6">
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
        <p className="mt-1 font-mono text-sm text-base-content/60">{asset.isin}</p>
        <p className="mt-0.5 text-sm text-base-content/60">{asset.provider}</p>
      </div>

      <div className="card mb-4 border border-base-200 bg-base-100">
        <div className="card-body p-4">
          <h2 className="mb-3 card-title text-base">Score</h2>
          <span className="text-3xl font-bold text-primary">{scoreDisplay}</span>
        </div>
      </div>

      <ViewGeneralSection asset={asset} />
      <ViewFinancialSection asset={asset} />
      <ViewAllocationsSection geoAllocation={asset.geoAllocation} sectorAllocation={asset.sectorAllocation} />
    </div>
  );
}
