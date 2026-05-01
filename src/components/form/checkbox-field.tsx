import { kebabCase } from "es-toolkit/string";

export type CheckboxFieldProps = {
  label: string;
  name: string;
  onChange: (value: boolean) => void;
  value: boolean;
};

export function CheckboxField({ label, name, onChange, value }: CheckboxFieldProps) {
  return (
    <div className="form-control">
      <label className="label cursor-pointer justify-start gap-3" htmlFor={name}>
        <input id={name} data-testid={kebabCase(name)} type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={value} onChange={event => onChange(event.target.checked)} />
        <span className="label-text">{label}</span>
      </label>
    </div>
  );
}
