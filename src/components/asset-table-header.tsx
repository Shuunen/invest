import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { computeScore, type Asset } from "../schemas/index.ts";
import { formatPercent } from "./asset-table-utils.ts";
import type { MetricItem } from "./metric.tsx";
import { Metrics } from "./metrics.tsx";

function computeMetrics(assets: Asset[]) {
  const scores = assets.map(asset => computeScore(asset));
  const definedScores = scores.filter((score): score is number => score !== undefined);
  const avgScore = definedScores.length > 0 ? definedScores.reduce((acc, val) => acc + val, 0) / definedScores.length : undefined;
  const avgFee = assets.length > 0 ? formatPercent(assets.reduce((acc, asset) => acc + asset.fees, 0) / assets.length) : undefined;
  let topIndex = -1;
  let topScore = -Infinity;
  for (let idx = 0; idx < scores.length; idx += 1) {
    const score = scores[idx];
    if (score !== undefined && score > topScore) {
      topScore = score;
      topIndex = idx;
    }
  }
  const topAsset = topIndex >= 0 ? assets[topIndex] : undefined;
  const topLabel = topAsset ? (topAsset.tickers[0] ?? topAsset.isin) : undefined;
  return { avgFee, avgScore, count: assets.length, topLabel };
}

function metricItems(assets: Asset[]) {
  const { avgFee, avgScore, count, topLabel } = computeMetrics(assets);
  return [
    { color: "info", label: "Assets", value: count },
    { color: "neutral", label: "Avg Score", value: avgScore },
    { color: "success", label: "Top Performer", value: topLabel },
    { color: "neutral", label: "Avg Fee", value: avgFee },
  ] satisfies MetricItem[];
}

export function renderPageHeader(assets: Asset[]) {
  return (
    <div className="border-b border-base-200 bg-base-100 px-4 pt-5 pb-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="mt-1 text-sm text-base-content/60">This is the list of available assets you can use to create and manage your portfolios.</p>
      </div>
      <Metrics items={metricItems(assets)} />
    </div>
  );
}

export function renderColumnFilter(table: Table<Asset>, visibleLeafCount: number) {
  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn text-gray-500 btn-ghost btn-sm">
        Columns <EyeIcon size={16} />
      </button>
      <div tabIndex={0} className="dropdown-content menu z-9999 w-60 rounded-box bg-base-100 p-2 shadow-2xl">
        {table
          .getAllLeafColumns()
          .filter(column => column.columnDef.enableHiding !== false)
          .map(column => (
            <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-primary/30">
              <input type="checkbox" className="checkbox checkbox-sm" checked={column.getIsVisible()} disabled={column.getIsVisible() && visibleLeafCount <= 1} onChange={column.getToggleVisibilityHandler()} />
              <span className="label-text">{column.columnDef.meta?.title ?? String(column.columnDef.header)}</span>
            </label>
          ))}
      </div>
    </div>
  );
}

export function renderSearchFilter(filterText: string, setFilterText: (value: string) => void) {
  return (
    <input
      data-testid="input-filter"
      type="search"
      className="input-bordered input input-sm w-full max-w-sm outline-gray-300"
      placeholder="Search ISIN, name, tickers…"
      value={filterText}
      onChange={event => {
        setFilterText(event.target.value);
      }}
    />
  );
}
