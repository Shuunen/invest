export type TextFieldProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function TextField({ label, name, onChange, placeholder, value }: TextFieldProps) {
  return (
    <div className="form-control hover:font-bold">
      <label className="label mb-1" htmlFor={name}>
        <span className="label-text text-sm text-base-content/60">{label}</span>
      </label>
      <input id={name} data-testid={name} type="text" className="input-bordered input input-sm w-full" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
