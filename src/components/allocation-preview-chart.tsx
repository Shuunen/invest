import { buildAllocationEntries } from "../utils/allocation-charts.ts";
import { PieChart } from "./charts/pie.tsx";

type Props = {
  data: Partial<Record<string, number>>;
  title: string;
  name: string;
};

export function AllocationPreviewChart({ data: map, title, name }: Props) {
  const entries = buildAllocationEntries(map);
  return (
    <div data-testid={`${name}-card`}>
      <h3 className="text-center">{title}</h3>
      {entries === undefined ? <p data-testid={`${name}-empty`}>No allocation data</p> : <PieChart entries={entries} name={name} size={220} />}
    </div>
  );
}
