import { Fragment } from "react";
import { Metric, type MetricItem } from "./metric.tsx";

type Props = {
  items: MetricItem[];
};

export function Metrics({ items }: Props) {
  return (
    <div className="flex flex-col">
      <hr className="opacity-15" />
      <div className="flex items-center gap-5 py-3">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <div className="h-6 w-px bg-base-300" />}
            <Metric label={item.label} value={item.value} color={item.color} index={index} />
          </Fragment>
        ))}
      </div>
      <hr className="opacity-15" />
    </div>
  );
}
