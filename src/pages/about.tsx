import { version as APP_VERSION } from "../../package.json";
import { stalenessTierPresets } from "../components/import-export-utils.ts";
import { InvestIcon } from "../components/invest-icon.tsx";
import { useAppStore } from "../store/use-app-store.ts";
import { formatDate } from "../utils/format-numbers.ts";

function renderExportStatusSection({ editCount, lastExportedAt, setEditCount }: { editCount: number; lastExportedAt: string | undefined; setEditCount: (count: number) => void }) {
  return (
    <>
      <h2 data-testid="export-status-title" className="mb-3 text-lg font-semibold">
        Export status
      </h2>
      <div className="space-y-2 text-sm text-base-content/80">
        <p>
          Last export: <span data-testid="last-exported-at">{formatDate(lastExportedAt)}</span>
        </p>
        <p>
          Un-exported edits: <span data-testid="unexported-edit-count">{editCount}</span>
        </p>
      </div>
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-base-content/70">Test reminder tiers</h3>
        <div className="flex flex-wrap gap-2">
          {stalenessTierPresets.map(({ editCount: presetEditCount, label, tier }) => (
            <button key={tier} type="button" data-testid={`set-edit-count-${tier}`} className="btn btn-soft btn-xs btn-primary" onClick={() => setEditCount(presetEditCount)}>
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

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 data-testid="page-title" className="mb-2 flex items-center gap-3 text-3xl font-bold">
        <InvestIcon size={32} /> Invest
      </h1>
      <p className="mb-6 text-base-content/60">v{APP_VERSION}</p>
      <p className="mb-4">A personal ETF &amp; stock reference tracker. Browse your instruments, compare scores, and manage which ones belong in your portfolios.</p>
      <div className="divider" />
      {renderExportStatusSection({ editCount: settings.editCount, lastExportedAt: settings.lastExportedAt, setEditCount })}
      <div className="divider" />
      <h2 className="mb-3 text-lg font-semibold">Tech stack</h2>
      <ul className="list-inside list-disc space-y-1 text-sm text-base-content/80">
        <li>React 19 + TypeScript</li>
        <li>TanStack Router + Table</li>
        <li>Dexie (IndexedDB persistence)</li>
        <li>Zustand (state management)</li>
        <li>Tailwind CSS v4 + DaisyUI v5</li>
        <li>Zod (schema validation)</li>
      </ul>
    </div>
  );
}
