# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-04-23

### Added

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

### Changed

- `broker` field on `PortfolioSchema` is now required (`min(1)`) — portfolios must always have a broker name
- `FormControl` `autoFocus` is now an optional prop (default `false`) instead of hardcoded `true`
- Export button disabled condition updated: disabled only when both assets and portfolios are empty
- Download filename now uses `ISO_TIME_START`/`ISO_TIME_END` constants for the time slice; removed `toLocaleString()` no-op

### Fixed

- `URL.revokeObjectURL` now deferred 100 ms after `anchor.click()` to prevent race with browser download pipeline
- `addPortfolio` previously bypassed the `MAX_PORTFOLIOS` schema limit; now capped in the store

## [0.1.0] - 2026-04-21

### Added

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

### Changed

- `CountrySchema` now derived from `CountryEuropeSchema` and `CountryAsiaSchema` — single source of truth, no drift
- `COUNTRIES_EUROPE` and `COUNTRIES_ASIA` arrays derived directly from sub-schema options
- `Isin` type now uses type-predicate refines for proper `Partial<Record<Country|Sector, number>>` inference — `IsinRaw` workaround removed
- `safeImportJson` now preserves the original JSON parse error message instead of swallowing it

### Fixed

- PWA startup failure (stale service worker serving wrong HTML) now shows a visible error message instead of a blank page
- Formula test previously used imported weight constants (tautological); now hardcodes expected values to verify the formula independently
