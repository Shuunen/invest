# Changelog

All notable changes to this project will be documented in this file.

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
