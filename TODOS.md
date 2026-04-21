# TODOS

## Schema hardening

### Enforce uniqueness on isins and portfolio IDs

**What:** `AppDataSchema` currently allows two `IsinSchema` entries with the same ISIN code, or two portfolios with the same UUID. Add `superRefine` checks: duplicate ISIN codes → addIssue, duplicate portfolio IDs → addIssue.
**Why:** The referential-integrity Set keeps the first duplicate, so the second copy's data is silently discarded. Downstream sort/score will use one copy while portfolio entries may reference the other.
**Priority:** P1

### Validate allocation value range

**What:** `geoAllocation` and `sectorAllocation` values accept any number (including negative, > 1). Add `.refine()` checks that all values are in `[0, 1]` (if fractions) or `[0, 100]` (if percentages).
**Why:** Charting code will produce silently broken charts for out-of-range values. Decide fraction vs. percentage convention first (see `riskReward` unit TODO).
**Priority:** P2

## Assets

### Add PWA icons and favicon

**What:** Create `public/icon-192.png`, `public/icon-512.png`, and `public/favicon.svg`.
**Why:** `vite.config.ts` (VitePWA manifest) references these icons, and `index.html` references `favicon.svg`. Without them the app installs without an icon and browsers show a broken favicon.
**Priority:** P1

## Pre-implementation (resolve before writing code)

### Confirm riskReward field unit

**What:** Verify what unit your data source uses for `riskReward1y/3y/5y` before entering the first real ISINs.
**Why:** The score formula `performance3y + riskReward3y * 5 - fees * 10` uses `×5` assuming Sharpe ratio (typical range 0–3). If your source reports Sortino, Calmar, or a differently-scaled number, the rankings will be silently wrong.
**Context:** Entering 5 real ISINs in `data/sample.json` will make the unit obvious from the numbers you see. Resolve before build step 1.
**Depends on:** Nothing — check your ETF data source (Morningstar, broker platform, ETF factsheet) first.

### Review Wealthfolio's Dexie schema and import/export

**What:** Read the Dexie table definitions and JSON import/export code in [afadil/wealthfolio](https://github.com/afadil/wealthfolio).
**Why:** They already solved the nested-vs-normalized transform (portfolios with embedded entries[] in export, normalized tables in Dexie). Steal what works.
**Context:** Do this before build step 2 (Dexie schema). Budget ~1h human / ~15min with CC.
**Depends on:** Nothing.
