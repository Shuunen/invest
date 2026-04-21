# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-04-21

### Added

- Full project scaffold: Vite + React + TypeScript with Tailwind CSS and PWA support
- Zod v4 data model: `IsinSchema`, `PortfolioSchema`, `SettingsSchema`, and `AppDataSchema` with referential integrity validation
- `computeScore` — ranks instruments by combining 3-year performance, risk/reward ratio, and fees into a single comparable score
- `safeImportJson` / `parseAppData` helpers for importing and validating JSON data files
- ISIN format validation via regex (`^[A-Z]{2}[A-Z0-9]{9}[0-9]$`)
- Geo and sector allocation key validation against known enum values
- Array bounds on isins (max 5000) and portfolios (max 50)
- ISO-8601 datetime validation on `lastExportedAt`
- Vitest unit test suite (11 tests) covering all schema code paths
- Playwright E2E smoke tests (4 tests)
- oxlint + oxfmt linting and formatting pipeline
- gstack skill routing and project conventions in CLAUDE.md
