import { kebabCase } from "es-toolkit";

type Props = {
  label: string;
  name: string;
  value: React.ReactNode;
};

export function FieldRow({ label, value, name }: Props) {
  const testId = kebabCase(`field-row-${name}`);
  return (
    <div className="flex items-start gap-4 border-b border-base-200 py-2 last:border-0">
      <span className="w-40 shrink-0 text-sm text-base-content/60">{label}</span>
      <span className="text-sm" data-testid={testId}>
        {value}
      </span>
    </div>
  );
}
