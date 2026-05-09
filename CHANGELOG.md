# Changelog

All notable changes to this project will be documented in this file.

## [0.6.2] - 2026-05-09

### Added in 0.6.2

- Turborepo build caching — all lint, build, and test tasks are now cached by content hash; repeat runs skip unchanged work entirely
- Custom Playwright summary reporter — E2E runs print a compact pass/skip/fail summary instead of verbose output
- Animated link component (`Link000`) — asset names in the table now show a sliding underline animation on hover

### Changed in 0.6.2

- Dependency bumps: React 19.2.6, TanStack Router 1.169.2, Zod 4.4.3, Zustand 5.0.13, Tailwind 4.3.0, Vite 8.0.11, Vitest 4.1.5, TypeScript 6.0.3, and many others
- CI no longer pins a specific pnpm version — the `packageManager` field in `package.json` drives selection
- Turbo task graph: `build:vite` now runs after `build:tsc` to prevent caching stale artifacts during parallel type errors
- `lint:fallow` inputs now include `.fallowrc.json` so lint-rule changes properly invalidate cache
- Coverage reporter simplified to `lcov` only (used by CI); human-readable text output removed from local runs

## [0.6.1] - 2026-05-07

### Added in 0.6.1

- Staleness tier system for export/import buttons — tracks data freshness with visual feedback (fresh, warning, stale)
- Edit count tracking — global counter of un-exported changes across assets and portfolios; resets on export
- Enhanced about page with detailed export button staleness tier information and visual indicators
- New `import-export-utils.ts` — shared utilities for export button state determination

### Changed in 0.6.1

- Export button now displays staleness tier (fresh/warning/stale) instead of just a timestamp
- Import/export button styling refined with tier-aware visual states
- Portfolio store now tracks edit counts for improved UX feedback

## [0.6.0] - 2026-05-06

### Added in 0.6.0

- `computeDataScore` — data quality score (0–100) based on field completeness and freshness; constants `DATA_SCORE_PERCENT` (100) and `DATA_SCORE_WARN_THRESHOLD` (75) exported from schemas
- `updatedAt` (ISO datetime) field on `AssetSchema` — populated automatically when ETF data is fetched
- `makeDataScoreColumn` — "Data" table column with a colored dot indicator (green / yellow / red) showing data quality per asset
- `makeAmountUpdatedAtColumn` — "Amt. updated" portfolio column tracking when each position's amount was last changed
- `Updated` column in the asset table rendering the `updatedAt` date for each asset
- `amountUpdatedAt` timestamp on portfolio entries, set automatically via `updatePortfolioEntryAmount` store action
- `formatDate` utility for displaying ISO dates in a human-readable format
- `parseCountriesFromAjaxXml` — parses country allocation data from ETF AJAX XML responses (alongside the existing sector parser)
- ISIN is now editable on the asset edit page; renaming an ISIN automatically cascades to all portfolio entries that reference it
- `react-hot-toast` — toast notification system; success toasts now appear after creating a portfolio, importing, and exporting data

### Changed in 0.6.0

- `resolveWicketPath` helper refactored out of `fetchEtfData` and reused for both sector and country AJAX paths
- Progress bar thresholds updated
- Primary color darkened from `sky-600` to `sky-700`; theme meta color updated to `#0069a8`; main layout uses `bg-base-200` (taupe-50) background; navbar is no longer sticky
- Amount input `step` changed to `0.1`; price input `step` changed to `1`

## [0.5.0] - 2026-05-06

### Added in 0.5.0

- `SaveModal` — confirmation modal on the asset edit page that shows a diff table of all changed fields before committing the save; user can confirm, reset to original, or dismiss
- `buildDiffRows` — computes a flat list of `DiffRow` records comparing two `FormState` snapshots across all scalar fields and allocations (geo + sector)
- `useConfirmAssetSave` — hook encapsulating modal open/close state, diff computation, and snapshot-based save logic; snapshot is captured at modal-open time so edits made behind the open modal are never silently saved
- Allocation keys in diff and allocation displays are formatted with `startCase` for readability

### Changed in 0.5.0

- `hasChanges` in `useAssetEditForm` is now computed via `useMemo` instead of recomputing on every render
- `ModalHeader` subtitle now renders at `text-sm text-base-content/70` for better visual hierarchy
- Save confirmation diff table uses `text-sm` (was `text-xs`) for improved readability

## [0.4.0] - 2026-05-02

### Added in 0.4.0

- `IsinFetchRow` — shared component for the ISIN input + Fetch button row, used by both `AssetCreatePage` and `AssetEditPage`
- `useEtfFetch` — shared hook encapsulating ETF fetch state (`isFetching`, `fetchError`, `handleFetch`); eliminates the duplicated inline logic that existed in both pages
- `AppDataSchema` now enforces uniqueness of ISINs and portfolio IDs via `superRefine` — duplicate entries produce field-level Zod issues
- `addAsset` store action rejects duplicate ISINs atomically (reads live state inside `set()`) and enforces the `MAX_ISINS` cap
- PWA icons — `public/icon-192.png` (192×192), `public/icon-512.png` (512×512), and `public/favicon.svg` (rising chart line, blue #0069a8 background)
- 18 unit tests for `applyEtfPrefill` covering all scalar fields, optional patches, and allocation maps

### Changed in 0.4.0

- CORS proxy path guard tightened: only URLs matching `/proxy/…` or exactly `/proxy` are forwarded; `/proxyfoo` now returns 404
- CORS proxy `buildUpstreamHeaders` strips a leading `/` from `wicket-ajax-baseurl` before building the `Referer` header (prevents `https://host//path` double-slash)
- CORS proxy `proxyReq` error handler calls `res.destroy(err)` when headers are already sent (was calling `res.end()`, which could corrupt the in-flight response stream)

## [0.3.0] - 2026-05-01

### Added in 0.3.0

- `AssetEditPage` — full form to create and edit assets, with per-field validation via Zod and inline error display
- `AssetViewPage` — read-only detail view for a single asset with a back button that uses `history.back()` (falls back to home on deep links)
- `NumberField`, `TextField`, `CheckboxField`, `JsonTextarea` — reusable controlled form components with `data-testid` generated from field name via `kebabCase`
- `parseZodErrors` — exported helper that maps Zod issues to a `Record<string, string>` field-error map, routing empty/numeric-path issues to a top-level `"form"` key
- `buildAssetFromForm` / `toFormState` — bidirectional converters between the `Asset` schema type and the string-based form state
- `updateAssetPrice` store action — updates a single asset's price in place without touching other fields
- Price editing mode on `AssetTable` — toggle via "Edit prices" action button; inline `NumberField` per row
- `PageHeader` component — renders a page title, optional metrics badges, and action buttons with auto-generated `data-testid="action-{label}"` IDs
- Unique `data-testid` per boolean cell in `AssetTable` (e.g. `bool-is-accumulating-{isin}`)
- Export error state in `ImportExportButtons` — shown when `jsonStringify` returns `undefined`, with `data-testid="export-error"`
- `jsonStringify` now returns `string | undefined` and logs the error on failure instead of throwing

### Changed in 0.3.0

- `NumberField` uses `step="any"` (was `step="1"`) to accept decimal inputs without browser validation noise
- Removed `hover:font-bold` from form field wrappers — it caused layout shifts on hover
- Removed unused `nbDecimals` constant from `src/utils/constants.ts`
- Navigation to asset edit and view pages uses `{ replace: true }` to avoid cluttering browser history
- All unit-test element queries migrated to `getByTestId` / `queryByTestId` — no `getByRole` / `getByText` in tests

### Fixed in 0.3.0

- Empty `fees` string in the edit form is treated as `0` (free fund) instead of failing validation
- `history.back()` on the asset view page navigates home when there is no prior history (direct/deep link)
- `booleanCell` in `AssetTable` used a shared `data-testid="bool-cell"` — each cell now has a unique ID including the ISIN

## [0.2.0] - 2026-04-23

### Added in 0.2.0

- Portfolio management: create portfolios with a name and broker, navigate between them via the sidebar
- `AssetPickerModal` — select and deselect instruments for a portfolio from the full asset table
- `PortfolioPage` — per-portfolio view with asset table, asset count, and a remove-with-confirmation flow
- `CreatePortfolioModal` — validated form (name required, broker required) with `autoFocus` on first field and per-field error clearing
- `ModalHeader`, `ModalActions`, `FormActions` — shared modal shell components, eliminating dialog boilerplate
- `addPortfolio`, `deletePortfolio`, `updatePortfolio`, `setPortfolioAssets` store actions
- `MAX_PORTFOLIOS` (50) cap enforced at store level — `addPortfolio` ignores calls beyond the limit
- Export enabled when portfolios exist even with no assets loaded
- 9 Playwright E2E tests covering portfolio creation, navigation, asset editing, and export
- `e2e/tsconfig.json` — dedicated TypeScript config for Playwright tests (Node + DOM types)

### Changed in 0.2.0

- `broker` field on `PortfolioSchema` is now required (`min(1)`) — portfolios must always have a broker name
- `FormControl` `autoFocus` is now an optional prop (default `false`) instead of hardcoded `true`
- Export button disabled condition updated: disabled only when both assets and portfolios are empty
- Download filename now uses `ISO_TIME_START`/`ISO_TIME_END` constants for the time slice; removed `toLocaleString()` no-op

### Fixed

- `URL.revokeObjectURL` now deferred 100 ms after `anchor.click()` to prevent race with browser download pipeline
- `addPortfolio` previously bypassed the `MAX_PORTFOLIOS` schema limit; now capped in the store

## [0.1.0] - 2026-04-21

### Added in 0.1.0

- Full project scaffold: Vite + React + TypeScript with Tailwind CSS and PWA support
- Zod v4 data model: `IsinSchema`, `PortfolioSchema`, `SettingsSchema`, and `AppDataSchema` with referential integrity validation
- `computeScore` — ranks instruments by combining 3-year performance, risk/reward ratio, and fees into a single comparable score
- `safeImportJson` / `parseAppData` helpers for importing and validating JSON data files
- `provider` field on `IsinSchema` (e.g. "Amundi", "iShares")
- ISIN format validation via regex (`^[A-Z]{2}[A-Z0-9]{9}[0-9]$`)
- Geo and sector allocation key validation against known enum values (O(1) Set-based lookup)
- Array bounds on isins (max 5000) and portfolios (max 50)
- ISO-8601 datetime validation on `lastExportedAt`
- 37 Vitest unit tests + 4 Playwright E2E smoke tests
- oxlint + oxfmt linting and formatting pipeline
- gstack skill routing and project conventions in CLAUDE.md

### Changed in 0.1.0

- `CountrySchema` now derived from `CountryEuropeSchema` and `CountryAsiaSchema` — single source of truth, no drift
- `COUNTRIES_EUROPE` and `COUNTRIES_ASIA` arrays derived directly from sub-schema options
- `Isin` type now uses type-predicate refines for proper `Partial<Record<Country|Sector, number>>` inference — `IsinRaw` workaround removed
- `safeImportJson` now preserves the original JSON parse error message instead of swallowing it

### Fixed in 0.1.0

- PWA startup failure (stale service worker serving wrong HTML) now shows a visible error message instead of a blank page
- Formula test previously used imported weight constants (tautological); now hardcodes expected values to verify the formula independently
