import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { Empty } from "../components/empty.tsx";
import { useAppStore } from "../store/use-app-store.ts";
import { useTranslation } from "../utils/translations.ts";
import { DismissedSimilaritiesSection } from "./edit/dismissed-similarities.tsx";
import { ViewAllocationsSection } from "./view/allocations.tsx";
import { ViewFinancialSection } from "./view/financial.tsx";
import { ViewGeneralSection } from "./view/general.tsx";

type Props = { isin: string };

export function AssetViewPage({ isin }: Props) {
  const { translate } = useTranslation();
  const navigate = useNavigate();
  const asset = useAppStore(state => state.data.assets.find(ast => ast.isin === isin));
  const allAssets = useAppStore(state => state.data.assets);

  if (!asset) return <Empty name="view-asset-not-found" description={`Asset not found : ${isin}`} title="Not found" />;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          data-testid="back-button"
          className="btn btn-soft btn-primary"
          onClick={() => {
            if (globalThis.history.length > 1) globalThis.history.back();
            else void navigate({ to: "/" });
          }}
        >
          <ArrowLeft size={16} />
          {translate("action-back")}
        </button>
        <button type="button" data-testid="edit-button" className="btn btn-primary" onClick={() => void navigate({ params: { isin }, replace: true, to: "/assets/$isin/edit" })}>
          <Pencil size={14} />
          {translate("action-edit")}
        </button>
      </div>

      <div className="mb-6">
        <h1 data-testid="asset-name" className="text-2xl font-bold tracking-tight">
          {asset.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ViewGeneralSection asset={asset} />
        <ViewFinancialSection asset={asset} />
        <ViewAllocationsSection geoAllocation={asset.geoAllocation} sectorAllocation={asset.sectorAllocation} />
        <DismissedSimilaritiesSection asset={asset} allAssets={allAssets} />
      </div>
    </div>
  );
}
