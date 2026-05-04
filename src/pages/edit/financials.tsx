import { NumberField } from "../../components/form/number-field.tsx";
import type { FormState, PatchFn } from "./form-state.ts";

type Props = {
  errors: Record<string, string>;
  form: FormState;
  patch: PatchFn;
};

export function FinancialSection({ form, errors, patch }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Financial</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Fees (%)" name="fees" value={form.fees} onChange={val => patch("fees", val)} placeholder="0.20" />
          {errors.fees && <p className="col-span-2 text-xs text-error">{errors.fees}</p>}
          <NumberField label="Price (€)" name="price" value={form.price} onChange={val => patch("price", val)} placeholder="optional" />
          <NumberField label="Performance 1 year (%)" name="performance1y" value={form.performance1y} onChange={val => patch("performance1y", val)} placeholder="optional" />
          <NumberField label="Performance 3 years (%)" name="performance3y" value={form.performance3y} onChange={val => patch("performance3y", val)} placeholder="optional" />
          <NumberField label="Performance 5 years (%)" name="performance5y" value={form.performance5y} onChange={val => patch("performance5y", val)} placeholder="optional" />
          <NumberField label="Risk/Reward 1 year" name="riskReward1y" value={form.riskReward1y} onChange={val => patch("riskReward1y", val)} placeholder="optional" />
          <NumberField label="Risk/Reward 3 years" name="riskReward3y" value={form.riskReward3y} onChange={val => patch("riskReward3y", val)} placeholder="optional" />
          <NumberField label="Risk/Reward 5 years" name="riskReward5y" value={form.riskReward5y} onChange={val => patch("riskReward5y", val)} placeholder="optional" />
        </div>
      </div>
    </div>
  );
}
