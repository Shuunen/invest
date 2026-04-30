export type JsonTextareaProps = {
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
};

export function JsonTextarea({ error, label, name, onChange, value }: JsonTextareaProps) {
  return (
    <div className="form-control">
      <label className="label" htmlFor={name}>
        <span className="label-text text-sm text-base-content/60">{label}</span>
      </label>
      <textarea id={name} className={`textarea-bordered textarea h-28 font-mono text-xs ${error ? "textarea-error" : ""}`} value={value} onChange={event => onChange(event.target.value)} />
      {error !== undefined && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
