import { Fragment } from "react";
import { Metric, type MetricItem } from "./metric.tsx";

type Props = {
  items: MetricItem[];
};

export function Metrics({ items }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-4">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <div className="h-6 w-px bg-base-content/20" />}
          <Metric label={item.label} value={item.value} color={item.color} index={index} />
        </Fragment>
      ))}
    </div>
  );
}
