import { kebabCase } from "es-toolkit";

export type TextFieldProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
};

export function TextField({ label, name, onChange, placeholder, readOnly, value }: TextFieldProps) {
  return (
    <div className="form-control" data-testid={kebabCase(`text-field-${name}`)}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} data-testid={kebabCase(name)} type="text" className="input-bordered input input-sm w-full" placeholder={placeholder} readOnly={readOnly} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
