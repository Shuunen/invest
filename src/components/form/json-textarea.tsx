export type JsonTextareaProps = {
  error?: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
};

export function JsonTextarea({ error, name, onChange, value }: JsonTextareaProps) {
  return (
    <div className="form-control">
      <textarea data-testid={`json-textarea-${name}`} id={name} className={`textarea-bordered textarea h-28 font-mono text-xs ${error ? "textarea-error" : ""}`} value={value} onChange={event => onChange(event.target.value)} />
      {error !== undefined && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
