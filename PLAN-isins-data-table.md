<!-- /autoplan restore point: /home/rominou/.gstack/projects/Shuunen-invest/master-autoplan-restore-20260421-182211.md -->

# Plan: ISINs Data Table

## Feature Summary

Build the main ISINs data table — the primary screen of the invest app. Users see all their reference ETFs/stocks in a single sortable, filterable table with conditional formatting. Column visibility and sort state persist across sessions.

## Context

- **Current state:** `App.tsx` renders `<h1>Hello from App!</h1>`. No routes, no state, no persistence.
- **Existing infrastructure:** Schemas fully defined (`IsinSchema`, `PortfolioSchema`, `SettingsSchema`, `AppDataSchema`). `computeScore` exists. TanStack Router, Dexie, Zustand, Recharts, TailwindCSS, DaisyUI are all installed but unused. Sample data in `data/sample.json`.
- **Target:** Replace the placeholder with a functional ISINs table.

## Scope

### In scope

1. **Zustand store** — `useAppStore` holding `AppData` (isins, portfolios, settings). Actions: `loadData`, `setSort`, `setColumnVisibility`, `setColumnOrder`.
2. **Dexie persistence** — single `AppDataDb` with one `appdata` table. On app startup: read from Dexie → hydrate store. On store mutation: write back to Dexie.
3. **TanStack Router setup** — single root route `/` showing `IsinTable`. Router wraps `<App />`.
4. **`IsinTable` component** — main table:
   - Columns (in default order): Score, Provider, ISIN, Tickers, Name, Accumulating, Available on Broker, Available for Plan, Fees, Perf 1y, Perf 3y, Perf 5y, Risk 1y, Risk 3y, Risk 5y
   - Computed `score` column via `computeScore()` — displayed alongside raw fields
   - Click column header → sort asc/desc, persisted to settings
   - Column visibility toggle (DaisyUI dropdown) — persisted to settings
   - Conditional formatting on numeric columns: top quintile green, bottom quintile red (within visible rows)
   - `undefined` numeric cells render as `—` (not blank, not 0)
   - Tickers rendered as comma-separated list
5. **Sample data seeding** — if Dexie is empty on first load, seed from `data/sample.json` (parsed via `safeImportJson`).
6. **Unit tests** — `IsinTable.test.tsx` covering: renders rows, sort toggle, column hide/show, `undefined` cell display, score computation display.

### Out of scope (deferred to TODOS.md)

- Portfolio pages (personal / professional)
- Detail page / edit form
- Import / export UI
- Charts and similarity detection
- Search / filter input
- Column reordering by drag
- Responsive / mobile layout
- PWA icons (already in TODOS.md)

## Architecture

```
src/
  store/
    useAppStore.ts       ← Zustand store (AppData + actions)
  db/
    db.ts                ← Dexie schema + helpers
  components/
    IsinTable.tsx        ← table component
    IsinTable.test.tsx   ← unit tests
  routes/
    index.tsx            ← "/" route
  app.tsx                ← wires Router + root layout
```

## Key Design Decisions

### D1: Column definitions as a data structure

Define columns as a typed array `ISIN_COLUMNS: ColumnDef[]` (not JSX-only). Each column carries: `key`, `label`, `accessor: (isin: Isin) => ReactNode`, `sort?: (a: Isin, b: Isin) => number`, `defaultVisible: boolean`.

This lets column visibility, ordering, and conditional formatting all operate on the same source of truth without prop-drilling.

### D2: Conditional formatting — quintile-based, per-column

For each numeric column: sort all visible rows by that column, split into 5 equal buckets. Top bucket = `bg-success/20`, bottom bucket = `bg-error/20`. Middle 3 = no background. This is row-count-relative (better reads at a glance than a fixed threshold).

`undefined` values are excluded from the quintile calculation and always render neutral.

### D3: Zustand + Dexie coupling

Zustand is the runtime truth. Dexie is the persistence layer. Subscribe to the Zustand store on mount; on each non-trivial mutation, `db.appdata.put(data)`. On startup, `db.appdata.get(1) → store.loadData()`. This one-way flow avoids sync conflicts.

### D4: No column reorder in MVP

`columnOrder` in settings exists. The table respects it when hydrating from persisted state. But no drag-UI to reorder — just default order. Drag-and-drop deferred.

## Test Plan

| Test                            | Type | Assertion                                            |
| ------------------------------- | ---- | ---------------------------------------------------- |
| Renders all sample rows         | Unit | table has `N` rows matching `data/sample.json` count |
| Sort by score descending        | Unit | first row has highest score among all rows           |
| Sort toggles asc/desc           | Unit | second click on same header reverses order           |
| Column hide                     | Unit | hiding "Provider" removes that `<th>` from DOM       |
| `undefined` cell renders as `—` | Unit | ISIN with `undefined` performance3y shows `—`        |
| Score displayed                 | Unit | row score matches `computeScore()` output            |
| Seeding from sample.json        | Unit | empty Dexie → seed → store has ISINs                 |

## Revised Scope (post-CEO review)

### Added to scope (auto-decided cherry-picks)

- `@tanstack/react-table` for column management (replaces custom sort/visibility code)
- Empty state with auto-seed from sample.json on first run
- Loading/error states during Dexie hydration (`isLoading`, `loadError` in store)
- Explicit Dexie error handling: `SecurityError`, `VersionError`, `QuotaExceededError`
- `minRowsForFormatting = 10` constant — suppress quintile formatting below 10 rows
- Debounce Dexie writes (300ms) — explicit write triggers: `loadData`, `setSort`, `setColumnVisibility` only
- Score sort: `undefined` score values sort last (explicit comparator)
- Dexie mock strategy in tests: `vi.mock('dexie')` factory returning sample data
- Rename column "Risk 1y/3y/5y" → "Risk/Reward 1y/3y/5y"
- Structured console logs: hydration, seeding, errors
- ISIN name truncation: `max-w-xs truncate` on name cell

### Zustand store shape (updated)

```ts
interface AppStore {
  data: AppData;
  isLoading: boolean;
  loadError: Error | undefined;
  loadData: (data: AppData) => void;
  setSort: (sort: Settings["sort"]) => void;
  setColumnVisibility: (cv: Record<string, boolean>) => void;
  setColumnOrder: (order: string[]) => void;
}
```

### Dexie schema (explicit)

Single table `appdata`, schema `{id, data}`:

```ts
class AppDataDb extends Dexie {
  appdata!: Table<{ id: number; data: AppData }>;
  constructor() {
    super("invest-app");
    this.version(1).stores({ appdata: "id" });
  }
}
```

Write trigger: debounced 300ms. Only triggered by `loadData`, `setSort`, `setColumnVisibility`, `setColumnOrder`.

### Quintile formatting (explicit)

```ts
const MIN_ROWS_FOR_FORMATTING = 10;
// For each numeric column:
// 1. Filter rows with defined values for this column
// 2. If < MIN_ROWS_FOR_FORMATTING, return undefined (no class)
// 3. Sort values, split into 5 quintiles
// 4. Return 'bg-success/20' | 'bg-error/20' | undefined
```

### Deferred to TODOS.md

- TanStack Virtual for 5000+ rows evaluation
- Per-portfolio column configs (v2)
- Search/filter input
- Column reorder drag
- Import/Export UI

## Engineering Decisions (post-Eng review)

### Architecture gaps addressed

**E1: Dexie unmount race** — add `cancelled` flag in `useEffect` cleanup:

```ts
useEffect(() => {
  let cancelled = false;
  db.appdata
    .get(1)
    .then(record => {
      if (!cancelled) store.loadData(record?.data ?? seedData);
    })
    .catch(e => {
      if (!cancelled) store.setLoadError(e);
    });
  return () => {
    cancelled = true;
  };
}, []);
```

**E2: Zustand subscribe selector** — subscribe to `data` only, not full store:

```ts
useAppStore.subscribe(state => state.data, debouncedWrite);
```

**E3: TanStack Router wiring** — `main.tsx` renders `<RouterProvider router={router} />`. Root route = layout div. Index route `/` = `<IsinTable />`. `App.tsx` = root layout.

**E4: ColumnDef split** — `accessorFn` returns raw value (number/string/bool) for sorting; `cell` renders formatted ReactNode. Numeric columns: `accessorFn: (row) => row.perf3y`.

**E5: Column header groups** — group Perf and Risk/Reward triplets under parent `ColumnDef` with nested `columns: [...]`.

**E6: Score warning threshold** — `SCORE_WARNING_THRESHOLD = 100`. If `abs(score) > 100`, render in `text-warning` with tooltip.

**E7: Add `@tanstack/react-table` to dependencies** — `"@tanstack/react-table": "^8"` in `package.json`. Currently only `@tanstack/react-router` is installed; build fails on import.

**E8: Zustand v5 `subscribeWithSelector` middleware** — Zustand v5 base store only supports `subscribe(listener)` (one argument). The two-argument `subscribe(selector, listener)` requires the `subscribeWithSelector` middleware:

```ts
import { subscribeWithSelector } from 'zustand/middleware';
const useAppStore = create<AppStore>()(subscribeWithSelector((set, get) => ({ ... })));
// Then:
useAppStore.subscribe(state => state.data, debouncedWrite);
```

**E9: Add `setLoadError` action to store interface** — E1's cleanup snippet calls `store.setLoadError(e)` but the store shape never defines it. Add:

```ts
setLoadError: (error: Error) => void;
// Implementation:
set({ loadError: error, isLoading: false })
```

**E10: Correct field names in column definitions** — E4's example uses `row.perf3y` which does not exist. Use actual `Isin` field names: `performance1y`, `performance3y`, `performance5y`, `riskReward1y`, `riskReward3y`, `riskReward5y`, `fees`.

**E11: SortingState ↔ Settings.sort bridge** — TanStack Table v8 sorting state is `Array<{ id: string; desc: boolean }>` (multi-column). `Settings.sort` is `{ column: string; direction: 'asc' | 'desc' }` (single-column). Define explicit converters:

```ts
// Hydrate: Settings.sort → SortingState (for useReactTable initial state)
const sorting: SortingState = [{ id: settings.sort.column, desc: settings.sort.direction === "desc" }];

// Persist: SortingState → Settings.sort (in onSortingChange)
onSortingChange: updater => {
  const next = typeof updater === "function" ? updater(sorting) : updater;
  if (next[0]) store.setSort({ column: next[0].id, direction: next[0].desc ? "desc" : "asc" });
};
```

**E12: Rename custom type to avoid TanStack Table collision** — D1 defines a custom `ColumnDef` type. TanStack Table also exports `ColumnDef<TData>`. Name collision will cause import issues. Rename the custom metadata type to `IsinColumnConfig`.

**E13: Use typed column defs** — `ColumnDef<Isin>[]` (not `ColumnDef[]`). Without the generic, `row.getValue()` returns `unknown` and `accessorFn` has no type context. TypeScript strict mode (`tsgo`) will reject untyped usages.

**E14: Re-parse Dexie reads through Zod** — `record.data` is typed as `AppData` but at runtime it's a raw IndexedDB object. Corrupted data or schema evolution bypasses all validation. Wrap the read:

```ts
const record = await db.appdata.get(1);
const raw = record?.data ?? seedData;
store.loadData(AppDataSchema.parse(raw)); // throws on corruption → setLoadError catches it
```

**E15: E2E IndexedDB teardown** — Playwright does not clear IndexedDB between test cases by default. Tests "Auto-seed on empty Dexie", "Sort persists on reload", "Visibility persists on reload" are order-dependent without teardown. Add in `beforeEach`:

```ts
await page.evaluate(() => indexedDB.deleteDatabase("invest-app"));
```

**E16: React Error Boundary** — Wrap `<IsinTable />` in an `<ErrorBoundary>` for synchronous render-time throws (malformed column defs, TanStack Table edge cases). Use the same `alert-error` + Retry UI pattern as the Dexie error state. File: `src/components/ErrorBoundary.tsx`.

**E17: Use `fake-indexeddb` instead of `vi.mock('dexie')`** — `vi.mock('dexie')` bypasses the real Dexie code including schema validation. `fake-indexeddb` runs real Dexie against in-memory IndexedDB. Install `fake-indexeddb` as devDependency. In `src/test/setup.ts`:

```ts
import "fake-indexeddb/auto";
```

Remove `vi.mock('dexie')` from the test plan.

### Failure modes and critical gaps

| Failure mode                                            | Test covers?             | Error handling?                   | User impact           |
| ------------------------------------------------------- | ------------------------ | --------------------------------- | --------------------- |
| `safeImportJson` returns `undefined` (corrupted bundle) | NO                       | NO — crashes `seedData` reference | **CRITICAL GAP**      |
| `AppDataSchema.parse()` throws on corrupted Dexie read  | YES (E14 + db.test.ts)   | YES (E1 catch → setLoadError)     | Error banner shown ✓  |
| Dexie open fails (SecurityError, VersionError)          | YES                      | YES (E1 catch)                    | Error banner shown ✓  |
| `db.put()` QuotaExceeded                                | YES                      | YES (E1 / E8)                     | Toast warning ✓       |
| Unmount before Dexie resolves (cancelled flag)          | YES (cancel race test)   | YES (E1)                          | No state mutation ✓   |
| Render-time throw in IsinTable                          | YES (ErrorBoundary test) | YES (E16)                         | Error UI, not blank ✓ |

**Critical gap fix:** If `safeImportJson(sampleJson)` returns `undefined`, fall back to `{ isins: [], portfolios: [], settings: defaultSettings }` rather than crashing:

```ts
const seedData = safeImportJson(sampleJson) ?? { isins: [], portfolios: [], settings: defaultSettings };
```

### Worktree parallelization

| Step                      | Modules touched                        | Depends on          |
| ------------------------- | -------------------------------------- | ------------------- |
| Store (useAppStore.ts)    | src/store/                             | —                   |
| DB (db.ts)                | src/db/                                | —                   |
| Routes + App wiring       | src/routes/, src/app.tsx, src/main.tsx | src/store/          |
| IsinTable + ErrorBoundary | src/components/                        | src/store/, src/db/ |
| Tests                     | src/components/, src/db/, src/store/   | All above           |

**Lane A1:** `src/store/useAppStore.ts` — Zustand store + actions  
**Lane A2:** `src/db/db.ts` + `fake-indexeddb` setup — Dexie schema + helpers  
A1 and A2 have no shared modules — run in parallel worktrees.

**Lane B (depends on A1 + A2):** Routes, App wiring, IsinTable, ErrorBoundary  
**Lane C (depends on B):** All tests

Execution: `A1 || A2 → merge → B → C`. Two parallel worktrees for Lane A, then sequential for B and C.

### Test plan additions (from coverage audit)

| Test                                | File                     | Type | Assertion                                                                                  |
| ----------------------------------- | ------------------------ | ---- | ------------------------------------------------------------------------------------------ |
| `quintileClass()` correct           | `IsinTable.test.tsx`     | unit | 5 values → top=green, bottom=red, mid=undefined                                            |
| `quintileClass()` < 10 rows         | `IsinTable.test.tsx`     | unit | 9 rows → all undefined (no formatting)                                                     |
| Score warning threshold             | `IsinTable.test.tsx`     | unit | score=150 → `text-warning` class on cell                                                   |
| Loading state                       | `IsinTable.test.tsx`     | unit | `isLoading=true` → 5 skeleton rows rendered                                                |
| Empty state                         | `IsinTable.test.tsx`     | unit | `isins=[]` → empty state element rendered                                                  |
| Retry button                        | `IsinTable.test.tsx`     | unit | error state → click "Retry" → `loadData` called                                            |
| SecurityError                       | `db.test.ts`             | unit | mock throws SecurityError → `loadError` set                                                |
| VersionError                        | `db.test.ts`             | unit | mock throws VersionError → `loadError` set                                                 |
| QuotaExceededError                  | `db.test.ts`             | unit | mock throws QuotaExceeded on put → toast                                                   |
| Cancel race                         | `useAppStore.test.ts`    | unit | unmount before Dexie resolves → no state mutation                                          |
| Sort double-click toggle            | `IsinTable.test.tsx`     | unit | click same header twice → sort direction reverses                                          |
| Prevent hide last column            | `IsinTable.test.tsx`     | unit | hide all but 1 → last column toggle is disabled                                            |
| SortingState ↔ Settings.sort bridge | `IsinTable.test.tsx`     | unit | sort by perf3y → `store.setSort` called with `{column: 'performance3y', direction: 'asc'}` |
| Dexie read re-parses through Zod    | `db.test.ts`             | unit | corrupted record → `AppDataSchema.parse` throws → `setLoadError` called                    |
| subscribeWithSelector debounce      | `useAppStore.test.ts`    | unit | 5 rapid setSort calls in 300ms → Dexie `put` called once                                   |
| Error Boundary renders on throw     | `ErrorBoundary.test.tsx` | unit | child throws → error UI rendered (not blank screen)                                        |
| Auto-seed on empty Dexie            | `app.test.ts` (E2E)      | e2e  | empty IndexedDB → 5 seeded rows visible                                                    |
| Sort persists on reload             | `app.test.ts` (E2E)      | e2e  | sort → reload page → same sort active                                                      |
| Visibility persists on reload       | `app.test.ts` (E2E)      | e2e  | hide column → reload page → column still hidden                                            |

## Design Decisions (post-Design review)

### Visual hierarchy

- Score column: pinned first, `font-semibold`, subtle `bg-base-200` background, participates in quintile formatting
- Score display: `toFixed(1)` (1 decimal), renders `—` when undefined
- Score tooltip (`title` attribute): `"Score = 3y performance + (3y risk/reward × 5) − (fees × 10)"`
- Sticky `<thead>`: `sticky top-0 z-10 bg-base-100` — essential for long lists
- Table wrapped in `overflow-x-auto` div
- ISIN cells: `font-mono text-xs`
- Boolean cells: DaisyUI `badge` (Yes = `badge-success`, No = `badge-ghost`)
- Column groups: `<colgroup>` header group spanning Perf triplet and Risk/Reward triplet

### Column defaults (updated)

Default visible: Score, Provider, ISIN, Name, Fees, Perf 3y, Perf 5y, Risk/Reward 3y, Risk/Reward 5y  
Default hidden: Tickers, Accumulating, Available on Broker, Available for Plan, Perf 1y, Risk/Reward 1y  
(Users can toggle all columns; fewer visible by default reduces first-run overwhelm)

### Interaction states

- Row hover: DaisyUI `table-hover` class on `<table>`
- Sort: `<button>` inside `<th>` (keyboard-navigable), `▲`/`▼` after header text, `aria-sort` attribute
- Active sort column: `font-semibold` header
- Loading: 5 DaisyUI `skeleton` rows, same height as data rows
- Error: DaisyUI `alert alert-error` with message + "Retry" `<button>`
- Column visibility dropdown: `☰ Columns` button top-right, checkboxes for each column, prevent hiding last visible column

### Empty state

Two cases:

1. **First run** — auto-seeds from `data/sample.json`, user sees data immediately (no empty state shown)
2. **User data cleared** — centered icon, heading "No instruments added yet", subtext "Import a JSON file to get started", greyed import button (coming soon)

### Accessibility

- All `<th>` use `scope="col"`
- `aria-sort="ascending"/"descending"/"none"` on sorted column
- Sort trigger is `<button>` inside `<th>` — keyboard-accessible (Tab to focus, Enter/Space to activate)
- Boolean badge cells have `aria-label="Yes"` / `aria-label="No"`
- `<caption class="sr-only">ISINs reference data table</caption>` for screen readers
- Minimum touch target for sort buttons: `min-h-[44px]` on sort `<button>`

### Design system tokens (DaisyUI `light` theme)

DaisyUI theme: `light` (set via `data-theme="light"` on `<html>`). Theme configuration in `index.html`. DaisyUI semantic tokens used in the table:

- Table surface: `bg-base-100` / `bg-base-200` (header background)
- Green formatting: `bg-success/20 text-success-content` (quintile top)
- Red formatting: `bg-error/20 text-error-content` (quintile bottom)
- Badges: `badge-success` (Yes) / `badge-ghost` (No)
- Alert: `alert-error` (load error banner)
- Skeleton: DaisyUI `skeleton` class on placeholder rows

### Responsive / Mobile (deferred, minimum fallback documented)

Full responsive layout deferred. Minimum fallback for mobile:

- Table container: `overflow-x-auto w-full` — horizontal scroll on small viewports
- No column-hiding heuristics on mobile (user controls this manually)
- Dedicated mobile layout to be designed in a future sprint

### CSS bug fix (scaffold artifact)

`src/index.css` has `#root { text-align: center }` — this will center table cell content incorrectly. Fix during implementation: add `text-align: left` override on the `IsinTable` wrapper div (`className="text-left"`).

### User journey (first-run vs returning)

**First visit:**

1. App mounts → Zustand `isLoading = true` → 5 skeleton rows shown
2. Dexie read → empty → auto-seed from `data/sample.json`
3. `isLoading = false`, store has 5 ISINs → table renders with default sort (score desc)
4. User sees a pre-populated table immediately — no empty state flicker

**Returning visit:**

1. App mounts → Zustand `isLoading = true` → 5 skeleton rows shown
2. Dexie read → data found → `loadData()` with persisted settings (sort, visibility)
3. Table renders with same state as last session — user picks up where they left off

## Dependencies on Open TODOs

- **TODOS: Enforce uniqueness on ISINs** — table will display duplicates if they exist. Non-blocking for MVP; add after schema hardening ships.
- **TODOS: PWA icons** — no impact on table functionality.
- **TODOS: riskReward field unit** — display is unaffected; scoring weights are already in constants.

---

<!-- AUTONOMOUS DECISION LOG -->

## Decision Audit Trail

| #   | Phase      | Decision                                                                | Classification       | Principle                    | Rationale                                                                                     | Rejected                |
| --- | ---------- | ----------------------------------------------------------------------- | -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- | --- | --- | -------- | ---------------------------------------- | ---------- | -------------- | ----------------------------------------------------------------------- | ---------------------- |
| 1   | CEO-0C-bis | Use @tanstack/react-table                                               | Mechanical           | P5 (explicit), P1 (complete) | Same org as TanStack Router, avoids 200+ lines custom sort/visibility, accessibility included | Custom sort/visibility  |
| 2   | CEO-0D     | Accept empty state (no ISINs)                                           | Mechanical           | P1 (complete), P6 (action)   | First-run UX requires it; blank table is confusing                                            | None                    |
| 3   | CEO-0D     | Accept loading/error states                                             | Mechanical           | P1 (complete)                | Dexie is async; isLoaded=false without error state leaves stuck spinner                       | Single isLoaded boolean |
| 4   | CEO-0D     | Defer search/filter                                                     | Mechanical           | P3 (pragmatic)               | Not blocking MVP table, separate feature                                                      | None                    |
| 5   | CEO-0D     | Defer column reorder drag                                               | Mechanical           | P3 (pragmatic)               | columnOrder respected when reading, no drag UI yet                                            | None                    |
| 6   | CEO-1      | Add loadError state to store                                            | Mechanical           | P1 (complete)                | Without error state, Dexie failure = stuck spinner                                            | None                    |
| 7   | CEO-2      | Handle SecurityError/VersionError                                       | Mechanical           | P1 (complete)                | Unhandled = blank crash; simple try/catch = inline banner                                     | Swallow error           |
| 8   | CEO-2      | Handle QuotaExceeded on db.put                                          | Mechanical           | P1 (complete)                | Silent data loss is worse than a toast warning                                                | Silent fail             |
| 9   | CEO-4      | undefined sort: treat as last                                           | Mechanical           | P1 (complete), P5 (explicit) | react-table default; add explicit test                                                        | Random undefined sort   |
| 10  | CEO-4      | Name truncation max-w-xs                                                | Mechanical           | P5 (explicit)                | 200-char names break table layout                                                             | No truncation           |
| 11  | CEO-5      | Use @tanstack/react-table API                                           | Mechanical           | P5 (explicit)                | Column defs map directly; not over-engineering                                                | Custom reducer          |
| 12  | CEO-6      | Add Dexie mock strategy to tests                                        | Mechanical           | P1 (complete)                | Without mock strategy, tests will be flaky                                                    | Real Dexie in tests     |
| 13  | CEO-7      | Add performance note + TODOS entry                                      | Mechanical           | P3 (pragmatic)               | Flag 5000-row DOM cost; defer TanStack Virtual                                                | None                    |
| 14  | CEO-6      | Add minRowsForFormatting = 10                                           | Mechanical           | P1 (complete)                | <10 rows → misleading all-green/red table                                                     | No guard                |
| 15  | CEO-11     | Rename "Risk" → "Risk/Reward"                                           | Mechanical           | P5 (explicit)                | Higher riskReward = better; "Risk" implies opposite                                           | None                    |
| T1  | CEO-0D     | Dexie for full AppData vs settings-only                                 | **TASTE — A (user)** | User                         | Full AppData chosen: portfolio tracker UX requires persistence across sessions.               | Settings-only           |     | 16  | DESIGN-1 | Score column pinned first, font-semibold | Mechanical | P1 (hierarchy) | Score is the primary metric; most informative column should anchor left | Any other column first |
| 17  | DESIGN-1   | Default hidden: 6 columns (Tickers, Acc, Broker, Plan, Perf1y, Risk1y)  | Mechanical           | P9 (subtraction)             | Reduce first-run overwhelm without removing data                                              | All columns visible     |
| 18  | DESIGN-2   | Loading: 5 DaisyUI skeleton rows                                        | Mechanical           | P1 (complete)                | Skeleton maintains layout, avoids CLS                                                         | Spinner                 |
| 19  | DESIGN-2   | Error: alert-error banner + Retry button                                | Mechanical           | P1 (complete)                | Clear recovery path; retry is only safe action                                                | Silent failure          |
| 20  | DESIGN-5   | DaisyUI `light` theme via data-theme="light" on html                    | Mechanical           | P5 (explicit)                | Finance app, professional look, explicit beats default                                        | Unset (browser default) |
| 21  | DESIGN-6   | Table: overflow-x-auto wrapper, min mobile fallback                     | Mechanical           | P1 (complete)                | Prevents horizontal overflow breaking layout on narrow viewports                              | No mobile consideration |
| 22  | DESIGN-6   | Sort buttons: min-h-[44px] for touch targets                            | Mechanical           | P1 (a11y)                    | WCAG 2.5.5 touch target minimum                                                               | Default th height       |
| 23  | DESIGN-6   | caption sr-only for screen readers                                      | Mechanical           | P1 (a11y)                    | Screen readers announce table context                                                         | No caption              |
| 24  | DESIGN-7   | Fix #root { text-align: center } scaffold artifact                      | Mechanical           | P1 (correct)                 | Will misalign table cell content; add text-left on IsinTable wrapper                          | Ignore it               |
| T2  | DESIGN-5   | Font: keep system-ui OR replace with Inter/Geist                        | **TASTE — A (user)** | User                         | system-ui kept for MVP pragmatism. Typography upgrade deferred to TODOS.                      | Inter                   |
| 25  | ENG-1      | Add @tanstack/react-table to package.json dependencies                  | Mechanical           | P0 (build)                   | Not installed; build fails on import. Pin to ^8.                                              | —                       |
| 26  | ENG-2      | Add subscribeWithSelector middleware to store creation                  | Mechanical           | P0 (API)                     | Zustand v5 base subscribe only takes 1 arg; selector+listener requires middleware             | Manual state diff       |
| 27  | ENG-3      | Add setLoadError action to store interface                              | Mechanical           | P0 (types)                   | E1 calls it, plan never defines it; tsgo rejects                                              | —                       |
| 28  | ENG-4      | Use performance3y/riskReward3y not perf3y                               | Mechanical           | P0 (types)                   | Real field names from IsinSchema; wrong names cause type errors                               | —                       |
| 29  | ENG-5      | Define SortingState ↔ Settings.sort bridge with explicit converters     | Mechanical           | P1 (correctness)             | Without bridge, sort state never persists OR crashes at runtime                               | —                       |
| 30  | ENG-6      | Rename IsinColumnConfig (avoid ColumnDef collision with TanStack Table) | Mechanical           | P1 (imports)                 | Name collision breaks imports in any file using both                                          | —                       |
| 31  | ENG-7      | Type column defs as ColumnDef<Isin>[]                                   | Mechanical           | P1 (types)                   | Without generic, accessorFn has no type context, getValue returns unknown                     | —                       |
| 32  | ENG-8      | Wrap Dexie read in AppDataSchema.parse()                                | Mechanical           | P1 (correctness)             | Raw IndexedDB object bypasses Zod validation; corrupted data causes silent bugs               | —                       |
| 33  | ENG-9      | Add E2E beforeEach: indexedDB.deleteDatabase('invest-app')              | Mechanical           | P1 (tests)                   | Without teardown, E2E tests are order-dependent and flaky                                     | —                       |
| 34  | ENG-10     | Add ErrorBoundary around IsinTable                                      | Mechanical           | P1 (complete)                | Render-time throws produce blank screen without boundary                                      | —                       |
| 35  | ENG-11     | Replace vi.mock('dexie') with fake-indexeddb                            | Mechanical           | P2 (quality)                 | vi.mock bypasses real Dexie schema; fake-indexeddb catches real schema bugs                   | —                       |

---

## GSTACK REVIEW REPORT

| Review        | Trigger               | Why                             | Runs | Status                     | Findings                                                |
| ------------- | --------------------- | ------------------------------- | ---- | -------------------------- | ------------------------------------------------------- |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy                | 1    | CLEAR (PLAN via /autoplan) | 8 proposals, 6 accepted, 2 deferred. 2 taste decisions. |
| Codex Review  | `/codex review`       | Independent 2nd opinion         | 0    | [codex-unavailable]        | —                                                       |
| Design Review | `/plan-design-review` | UI/UX gaps                      | 1    | CLEAR (PLAN via /autoplan) | score: 3/10 → 8/10, 9 decisions made                    |
| Eng Review    | `/plan-eng-review`    | Architecture & tests (required) | 1    | CLEAR (PLAN via /autoplan) | 11 issues, 1 critical gap fixed                         |
| DX Review     | `/plan-devex-review`  | Developer experience gaps       | 0    | N/A (DX scope: no)         | —                                                       |

- **UNRESOLVED:** 2 taste decisions pending user choice at Final Gate (T1, T2)
- **VERDICT:** CEO + DESIGN + ENG CLEARED — ready for Final Gate and implementation
