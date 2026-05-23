import { kebabCase } from "es-toolkit";
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
    <div className={cn("form-control", { "flex items-center justify-between gap-2": isHorizontal })} data-testid={kebabCase(`number-field-${name}`)}>
      <label className={cn({ label: !isHorizontal })} htmlFor={name}>
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={name}
          data-testid={kebabCase(name)}
          type="number"
          step="any"
          className={cn("input-bordered input input-sm", { "pr-8": suffix }, { "w-18 text-center": isHorizontal })}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
        />
        {suffix !== undefined && (
          <span data-testid={`${kebabCase(name)}-suffix`} className="absolute right-2 text-xs text-base-content/60">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
