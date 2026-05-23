import { kebabCase } from "es-toolkit";

export type CheckboxFieldProps = {
  label: string;
  name: string;
  onChange: (value: boolean) => void;
  value: boolean;
};

export function CheckboxField({ label, name, onChange, value }: CheckboxFieldProps) {
  return (
    <div className="form-control" data-testid={kebabCase(`checkbox-field-${name}`)}>
      <label className="flex justify-start gap-1" htmlFor={name}>
        <input id={name} data-testid={kebabCase(name)} type="checkbox" className="checkbox checkbox-xs" checked={value} onChange={event => onChange(event.target.checked)} />
        <span className="label">{label}</span>
      </label>
    </div>
  );
}
