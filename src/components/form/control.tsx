import { cn } from "../../utils/browser-styles";

type FormControlProps = {
  autoFocus?: boolean;
  error?: string;
  label: string;
  name: string;
  placeholder?: string;
  setValue: (value: string) => void;
  value?: string;
};

export function FormControl({ autoFocus = false, label, name, placeholder, error, setValue, value }: FormControlProps) {
  return (
    <div className="form-control mb-4">
      <label className="label mb-2" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <input id={name} type="text" className={cn("input-bordered input w-full", { "input-error": error })} placeholder={placeholder} value={value} onChange={event => setValue(event.target.value)} autoFocus={autoFocus} />
      {error !== undefined && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
