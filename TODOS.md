# TODOS

- show the user a before/after diff of the asset edit form, in a modal so they can confirm their changes before saving
- show the user an animation of the export json button to indicate that the last export was long ago and they should export again to get the latest data
- add a data completeness col so the user can see at a glance which assets have missing data
- add a "last updated" timestamp to each asset, and show it in the table and detail view, so the user can see which assets have stale data that needs refreshing
- add a "last updated" timestamp to each row of a portfolio, so the user can see which entries have stale data that needs refreshing
- add some predefined filters to the table view, e.g. "only accumulating ETFs", "only distributing ETFs", "only ETFs with performance data", etc
- add logger and animated toasts
- do the complementary call for the geo allocation like it is already done for the sector allocation

## Schema hardening

### Validate allocation value range

**What:** `geoAllocation` and `sectorAllocation` values accept any number (including negative, > 1). Add `.refine()` checks that all values are in `[0, 1]` (if fractions) or `[0, 100]` (if percentages).
**Why:** Charting code will produce silently broken charts for out-of-range values. Decide fraction vs. percentage convention first (see `riskReward` unit TODO).
**Priority:** P2

## Assets

## Pre-implementation (resolve before writing code)

### Confirm riskReward field unit

**What:** Verify what unit your data source uses for `riskReward1y/3y/5y` before entering the first real ISINs.
**Why:** The score formula `performance3y + riskReward3y * 5 - fees * 10` uses `×5` assuming Sharpe ratio (typical range 0–3). If your source reports Sortino, Calmar, or a differently-scaled number, the rankings will be silently wrong.
**Context:** Entering 5 real ISINs in `data/sample.json` will make the unit obvious from the numbers you see. Resolve before build step 1.
**Depends on:** Nothing — check your ETF data source (Morningstar, broker platform, ETF factsheet) first.

## Completed

### Enforce uniqueness on ISINs and portfolio IDs

**What:** Added `superRefine` checks to `AppDataSchema`: duplicate ISIN codes → addIssue, duplicate portfolio IDs → addIssue.
**Completed:** v0.4.0 (2026-05-02)

### Add PWA icons and favicon

**What:** Created `public/icon-192.png`, `public/icon-512.png`, and `public/favicon.svg` (rising chart icon, blue #0084d1 background).
**Completed:** v0.4.0 (2026-05-02)

### Asset edit and view pages

**What:** Full asset editing flow — `AssetEditPage` with validated form, `AssetViewPage` read-only detail, inline price editing on `AssetTable`, reusable form components (`NumberField`, `TextField`, `CheckboxField`, `JsonTextarea`), `parseZodErrors` helper, `updateAssetPrice` store action.
**Completed:** v0.3.0 (2026-05-01)

### Review Wealthfolio's Dexie schema and import/export

**What:** Read the Dexie table definitions and JSON import/export code in [afadil/wealthfolio](https://github.com/afadil/wealthfolio).
**Why:** They already solved the nested-vs-normalized transform (portfolios with embedded entries[] in export, normalized tables in Dexie). Steal what works.
**Completed:** v0.2.0 (2026-04-23)
