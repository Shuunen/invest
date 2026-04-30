export type NumberFieldProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function NumberField({ label, name, onChange, placeholder, value }: NumberFieldProps) {
  return (
    <div className="form-control">
      <label className="label" htmlFor={name}>
        <span className="label-text text-sm text-base-content/60">{label}</span>
      </label>
      <input id={name} type="number" step="any" className="input-bordered input input-sm w-full" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
