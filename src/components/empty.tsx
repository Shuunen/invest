import { kebabCase } from "es-toolkit";
import { FileQuestionMarkIcon, type LucideIcon } from "lucide-react";

type EmptyProps = {
  description: React.ReactNode;
  icon?: LucideIcon;
  title: React.ReactNode;
  name: string;
};

export function Empty({ description, icon: Icon = FileQuestionMarkIcon, title, name }: EmptyProps) {
  return (
    <div className="flex flex-col gap-4 p-8 text-center" data-testid={`empty-${kebabCase(name)}`}>
      <span className="mx-auto text-accent">
        <Icon size={40} />
      </span>
      <h2 className="text-2xl">{title}</h2>
      {description !== undefined && <p>{description}</p>}
    </div>
  );
}
