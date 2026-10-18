import { useMemo } from "react";
import type { Allocation } from "../../schemas/asset.ts";
import { computeBalanceScore } from "../../utils/allocation-balance.ts";
import { buildAllocationEntries } from "../../utils/allocation-charts.ts";
import { cn } from "../../utils/browser-styles.ts";
import { formatPercent } from "../../utils/format-numbers.ts";
import { useTranslation } from "../../utils/translations.ts";
import { PieChart } from "./pie.tsx";

type Props = {
  data: Allocation;
  title: string;
  name: string;
  size?: number;
  card?: boolean;
};

export function AllocationChart({ data, title, name, size = 220, card = false }: Props) {
  const { translate } = useTranslation();
  const entries = useMemo(() => buildAllocationEntries(data), [data]);
  const balancedScore = useMemo(() => computeBalanceScore(data), [data]);
  return (
    <div className={cn("text-center", { card })} data-testid={`${name}-card`}>
      <div className={cn({ "card-body": card })}>
        <h3 className={cn({ "card-title": card })}>{title}</h3>
        {entries === undefined ? (
          <p data-testid={`${name}-empty`}>{translate("allocation-empty")}</p>
        ) : (
          <>
            <PieChart entries={entries} name={name} size={size} />
            <small>{translate("allocation-summary", { balance: formatPercent(balancedScore, true), nbEntries: entries.length })}</small>
          </>
        )}
      </div>
    </div>
  );
}
