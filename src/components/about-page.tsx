import { version as APP_VERSION } from "../../package.json";

export function AboutPage() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-2 text-3xl font-bold">📈 Invest</h1>
      <p className="mb-6 text-base-content/60">v{APP_VERSION}</p>
      <p className="mb-4">A personal ETF &amp; stock reference tracker. Browse your instruments, compare scores, and manage which ones belong in your portfolios.</p>
      <div className="divider" />
      <h2 className="mb-3 text-lg font-semibold">Score formula</h2>
      <p className="font-mono text-sm">score = perf3y + riskReward3y × 5 − fees × 10</p>
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
