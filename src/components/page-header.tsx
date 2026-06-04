import { kebabCase } from "es-toolkit";
import { useMemo } from "react";
import { computeScore, type Asset } from "../schemas/asset.ts";
import { formatPercent } from "../utils/format-numbers";
import { TextAnimate } from "./animations/text-animate";
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
  /** Optional metrics to display in the header. */
  metrics?: MetricItem[];
  /** When true, `metrics` replaces default computed metrics instead of being appended. */
  replaceDefaultMetrics?: boolean;
  /** The subtitle of the page header. */
  subtitle: string;
  /** The title of the page header. */
  title: string;
};

export function PageHeader({ actions, assets, metrics, replaceDefaultMetrics = false, title, subtitle }: Props) {
  const combinedMetrics = useMemo(() => {
    if (replaceDefaultMetrics) return metrics ?? [];
    return [...metricItems(assets), ...(metrics ?? [])];
  }, [assets, metrics, replaceDefaultMetrics]);
  return (
    <div className="flex bg-base-200 py-4 md:py-8" data-testid="page-header">
      <div className="container mx-auto flex grow">
        <div className="flex grow flex-col justify-center gap-4">
          <div className="flex items-center gap-4">
            <div className="grid">
              <h1 aria-label={title} data-testid="page-title" className="text-lg font-bold tracking-tight md:text-2xl">
                <TextAnimate animation="scaleUp" by="character">
                  {title}
                </TextAnimate>
              </h1>
              <span data-testid="page-subtitle" className="mt-1 text-xs text-base-content/60 md:text-sm">
                <TextAnimate animation="scaleDown" by="character">
                  {subtitle}
                </TextAnimate>
              </span>
            </div>
            {actions && actions.length > 0 && (
              <div className="ml-auto flex gap-2">
                {actions.map(action => (
                  <button key={action.label} type="button" data-testid={`action-${kebabCase(action.label)}`} className="btn btn-soft btn-sm md:btn-md" onClick={action.onClick}>
                    {action.label}
                    {action.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Metrics items={combinedMetrics} />
        </div>
      </div>
    </div>
  );
}
