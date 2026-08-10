import { kebabCase } from "es-toolkit";

export type TextareaFieldProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function TextareaField({ label, name, onChange, placeholder, value }: TextareaFieldProps) {
  return (
    <div className="form-control" data-testid={kebabCase(`textarea-field-${name}`)}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} data-testid={kebabCase(name)} className="textarea-bordered textarea w-full" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
