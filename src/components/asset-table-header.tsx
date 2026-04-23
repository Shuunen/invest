import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { computeScore, type Asset } from "../schemas/index.ts";
import { formatNumber } from "./asset-table-utils.ts";

type HeaderStats = {
  accCount: number;
  avgScore: number | undefined;
  count: number;
  topLabel: string | undefined;
};

function computeHeaderStats(assets: Asset[]): HeaderStats {
  const scores = assets.map(asset => computeScore(asset));
  const definedScores = scores.filter((score): score is number => score !== undefined);
  const avgScore =
    definedScores.length > 0 ? definedScores.reduce((acc, val) => acc + val, 0) / definedScores.length : undefined;
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
  const accCount = assets.filter(asset => asset.isAccumulating).length;
  return { accCount, avgScore, count: assets.length, topLabel };
}

export function renderPageHeader(assets: Asset[]) {
  const { accCount, avgScore, count, topLabel } = computeHeaderStats(assets);
  return (
    <div className="border-b border-base-200 bg-base-100 px-4 pt-5 pb-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Instruments</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Ranked by composite score — 3-year performance + risk/reward ratio, adjusted for fees.
        </p>
      </div>
      <div className="flex items-center gap-6 border-t border-base-200 py-3 text-sm">
        <div>
          <span className="text-lg font-bold tabular-nums">{count}</span>
          <span className="ml-1.5 text-xs tracking-wide text-base-content/50 uppercase">Instruments</span>
        </div>
        <div className="h-5 w-px bg-primary" />
        <div>
          <span className="text-lg font-bold tabular-nums">
            {avgScore === undefined ? "—" : formatNumber(avgScore)}
          </span>
          <span className="ml-1.5 text-xs tracking-wide text-base-content/50 uppercase">Avg Score</span>
        </div>
        {topLabel !== undefined && (
          <>
            <div className="h-5 w-px bg-primary" />
            <div>
              <span className="text-lg font-bold text-success tabular-nums">{topLabel}</span>
              <span className="ml-1.5 text-xs tracking-wide text-base-content/50 uppercase">Top Performer</span>
            </div>
          </>
        )}
        <div className="h-5 w-px bg-primary" />
        <div>
          <span className="text-lg font-bold tabular-nums">
            {accCount} / {count}
          </span>
          <span className="ml-1.5 text-xs tracking-wide text-base-content/50 uppercase">Accumulating</span>
        </div>
      </div>
    </div>
  );
}

export function renderColumnFilter(table: Table<Asset>, visibleLeafCount: number) {
  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn text-gray-500 btn-ghost btn-sm">
        Columns <EyeIcon size={16} />
      </button>
      <div tabIndex={0} className="dropdown-content menu z-9999 w-52 rounded-box bg-base-100 p-2 shadow-2xl">
        {table.getAllLeafColumns().map(column => (
          <label
            key={column.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-primary/30"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={column.getIsVisible()}
              disabled={column.getIsVisible() && visibleLeafCount <= 1}
              onChange={column.getToggleVisibilityHandler()}
            />
            <span className="label-text">{String(column.columnDef.header)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function renderSearchFilter(filterText: string, setFilterText: (value: string) => void) {
  return (
    <input
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
