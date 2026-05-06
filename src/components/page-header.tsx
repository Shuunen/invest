import { kebabCase } from "es-toolkit/string";
import { useMemo } from "react";
import { computeScore, type Asset } from "../schemas";
import { formatPercent } from "../utils/format-numbers";
import type { MetricItem } from "./metric";
import { Metrics } from "./metrics";

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

type Action = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type Props = {
  /** Optional actions to display on the right side of the header as buttons. */
  actions?: Action[];
  /** The list of assets to compute the default metrics from. */
  assets: Asset[];
  /** Additional optional metrics to display in the header, alongside the ones computed from the assets. */
  metrics?: MetricItem[];
  /** The subtitle of the page header. */
  subtitle: string;
  /** The title of the page header. */
  title: string;
};

export function PageHeader({ actions, assets, metrics, title, subtitle }: Props) {
  const combinedMetrics = useMemo(() => [...metricItems(assets), ...(metrics ?? [])], [assets, metrics]);
  return (
    <div className="bg-base-100 px-4 pt-5">
      <div className="flex items-center justify-between">
        <div className="mb-4">
          <h1 data-testid="page-title" className="text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p data-testid="page-subtitle" className="mt-1 text-sm text-base-content/60">
            {subtitle}
          </p>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map(action => (
              <button key={action.label} type="button" data-testid={`action-${kebabCase(action.label)}`} className="btn btn-soft btn-primary" onClick={action.onClick}>
                {action.label}
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
      <Metrics items={combinedMetrics} />
    </div>
  );
}
