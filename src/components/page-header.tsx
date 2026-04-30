import { computeScore, type Asset } from "../schemas";
import { formatPercent } from "./asset-table-utils";
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

type Props = {
  assets: Asset[];
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export function PageHeader({ assets, title, subtitle, children }: Props) {
  return (
    <div className="bg-base-100 px-4 pt-5">
      <div className="flex items-center justify-between">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-base-content/60">{subtitle}</p>
        </div>
        {children}
      </div>
      <Metrics items={metricItems(assets)} />
    </div>
  );
}
