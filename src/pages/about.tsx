import { version as APP_VERSION } from "../../package.json";
import { stalenessTierPresets } from "../components/import-export-utils.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { readableTime } from "../utils/readable-time.ts";
import { useTranslation } from "../utils/translations.ts";

const techStackItems = ["React 19 + TypeScript", "TanStack Router + Table", "Dexie (IndexedDB persistence)", "Zustand (state management)", "Tailwind CSS v4 + DaisyUI v5", "Zod (schema validation)"];

function renderExportStatusSection({ editCount, lastExportedAt, setEditCount }: { editCount: number; lastExportedAt: string | undefined; setEditCount: (count: number) => void }, translate: ReturnType<typeof useTranslation>["translate"]) {
  const lastExportedDate = lastExportedAt ? new Date(lastExportedAt) : undefined;
  return (
    <>
      <h2 data-testid="export-status-title" className="mb-3 text-lg font-semibold">
        {translate("export-title")}
      </h2>
      <div className="space-y-2 text-sm text-base-content/80">
        <p data-testid="last-exported-at">{translate("export-last-export", { timeAgo: lastExportedDate ? readableTime(lastExportedDate, translate) : translate("status-never") })}</p>
        <p data-testid="unexported-edit-count">{translate("export-un-exported", { count: editCount })}</p>
      </div>
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-base-content/70">{translate("section-test-reminder-tiers")}</h3>
        <div className="flex flex-wrap gap-2">
          {stalenessTierPresets.map(({ editCount: presetEditCount, label, tier }) => (
            <button key={tier} type="button" data-testid={`set-edit-count-${tier}`} className="btn btn-soft btn-xs" onClick={() => setEditCount(presetEditCount)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function AboutPage() {
  const settings = useAppStore(state => state.data.settings);
  const setEditCount = useAppStore(state => state.setEditCount);
  const { translate } = useTranslation();

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 data-testid="page-title" className="mb-2 flex items-center gap-3 font-bold md:text-3xl">
        {translate("app-title")}
        <span className="text-base-content/60">{`v${APP_VERSION}`}</span>
      </h1>
      <p className="mb-4">{translate("app-description")}</p>
      <div className="divider" />
      {renderExportStatusSection({ editCount: settings.editCount, lastExportedAt: settings.lastExportedAt, setEditCount }, translate)}
      <div className="divider" />
      <h2 className="mb-3 text-lg font-semibold">{translate("section-tech-stack")}</h2>
      <ul className="list-inside list-disc space-y-1 text-sm text-base-content/80">
        {techStackItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
