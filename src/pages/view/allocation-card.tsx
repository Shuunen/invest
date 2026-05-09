import { PieChart } from "../../components/charts/pie.tsx";
import type { Asset } from "../../schemas/index.ts";
import { buildAllocationEntries } from "../../utils/allocation-charts.ts";

type Props = {
  name: string;
  data: Asset["geoAllocation"] | Asset["sectorAllocation"];
  title: string;
};

export function AllocationCard({ title, data, name }: Props) {
  const entries = buildAllocationEntries(data);

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {entries === undefined ? (
          <p className="text-center text-sm text-base-content/40" data-testid={`${name}-empty`}>
            No allocation data
          </p>
        ) : (
          <PieChart entries={entries} name={name} />
        )}
      </div>
    </div>
  );
}
