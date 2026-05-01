import { kebabCase } from "es-toolkit/string";
import { cn } from "../../utils/browser-styles.ts";

export type NumberFieldProps = {
  isHorizontal?: boolean;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  value: string;
};

export function NumberField({ isHorizontal, label, name, onChange, placeholder, suffix, value }: NumberFieldProps) {
  return (
    <div className={cn("form-control hover:font-bold", { "flex items-center justify-between gap-2": isHorizontal })}>
      <label className={cn("label", { "mb-1": !isHorizontal })} htmlFor={name}>
        <span className="label-text text-sm text-base-content/60">{label}</span>
      </label>
      <div className="relative flex items-center">
        <input
          id={name}
          data-testid={kebabCase(name)}
          type="number"
          step="1"
          className={cn("input-bordered input input-sm", { "pr-8": suffix }, { "w-18 text-center": isHorizontal })}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
        />
        {suffix !== undefined && <span className="absolute right-2 text-xs text-base-content/60">{suffix}</span>}
      </div>
    </div>
  );
}
