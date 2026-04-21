# Portfolio Tracker PWA — Specification

> **SUPERSEDED** — This document is the initial spec. The implementation source of truth is the design doc produced by `/office-hours` (stored in `~/.gstack/projects/Shuunen-invest/`). Key overrides:
>
> - Data model: N-portfolio architecture (not 2 hardcoded portfolios); field `availableOnShares` renamed to `availableOnBroker`; `score` is derived, not stored
> - §3.6 conditional formatting: performance/risk-reward HIGH=green (not "lowest=best"); fees LOW=green; score HIGH=green
> - Storage: Dexie.js (not localStorage); Zustand as runtime truth
> - Stack decisions resolved: TanStack Router, Recharts, Zustand, Dexie.js

## 1. Overview

A Progressive Web App for tracking and analyzing personal and professional investment portfolios (stocks and ETFs). Offline-first, local-persistence, with JSON import/export for portability.

The app manages a generic reference list of investable instruments and two distinct portfolios (personal, professional) that reference that list. It provides sortable/filterable tables, detail pages, visual portfolio analysis, and a similarity detector to surface overlapping holdings.

---

## 2. Data Model

The entire application state serializes to a single JSON file. Three logical "tables" plus a settings object.

### 2.1 `isins` — Reference list of available investments

One entry per ISIN. Shared across both portfolios (normalized). No personal/portfolio-specific data lives here.

| Field               | Type                               | Notes                                                          |
| ------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `score`             | number                             | Aggregate score computed from the other fields                 |
| `provider`          | string                             | Issuer (e.g. iShares, Amundi, Vanguard)                        |
| `isin`              | string                             | Primary identifier (unique key)                                |
| `tickers`           | string[]                           | One ISIN can have multiple tickers across exchanges/currencies |
| `name`              | string                             | ETF or stock name                                              |
| `isAccumulating`    | boolean                            | `true` = accumulating, `false` = distributing                  |
| `availableOnShares` | boolean                            | Available on the Shares platform                               |
| `availableForPlan`  | boolean                            | Eligible for scheduled/planned investment                      |
| `fees`              | number                             | TER or equivalent, in %                                        |
| `performance1y`     | number                             | %                                                              |
| `performance3y`     | number                             | % annualized                                                   |
| `performance5y`     | number                             | % annualized                                                   |
| `riskReward1y`      | number                             |                                                                |
| `riskReward3y`      | number                             |                                                                |
| `riskReward5y`      | number                             |                                                                |
| `geoAllocation`     | `Partial<Record<Country, number>>` | See §2.2 — country/region → % weight                           |
| `sectorAllocation`  | `Partial<Record<Sector, number>>`  | See §2.2 — sector → % weight                                   |

Notes on table rendering: `geoAllocation` and `sectorAllocation` are **not** shown as columns by default — they belong on the detail page.

### 2.2 `Country` and `Sector` types

Both allocations use **explicit string-literal unions** (not open `Record<string, number>`) so TypeScript catches typos and the chart code can iterate a known, ordered set of keys. `Partial<Record<...>>` lets us omit categories an ETF doesn't cover rather than storing explicit zeros.

```ts
type CountryEurope =
  | "uk"
  | "switzerland"
  | "france"
  | "germany"
  | "netherlands"
  | "norway"
  | "sweden"
  | "austria"
  | "finland"
  | "italy"
  | "poland"
  | "spain"
  | "belgium"
  | "ireland"
  | "denmark";

type CountryAsia = "china" | "japan" | "taiwan" | "hongKong" | "southKorea" | "malaysia" | "indonesia" | "thailand";

type Country =
  // Americas
  | "us"
  | "canada"
  | "brazil"
  // Europe — 'europe' is the aggregate; CountryEurope members roll up into it
  | "europe"
  | CountryEurope
  // Asia — 'asia' is the aggregate; CountryAsia members roll up into it
  | "asia"
  | CountryAsia
  // Standalone
  | "india"
  | "saudiArabia"
  | "australia"
  | "africa";
```

Subtypes are defined only where there's a real semantic grouping (i.e. a roll-up). Americas and the standalone countries stay inline in `Country` — inventing `CountryAmericas` or `CountryStandalone` types would just add noise without giving the roll-up helper anything to iterate.

For the roll-up logic at render time, pair each subtype with an `as const` array so the same list lives at both type level and runtime:

```ts
const COUNTRIES_EUROPE = [
  "uk",
  "switzerland",
  "france",
  "germany",
  "netherlands",
  "norway",
  "sweden",
  "austria",
  "finland",
  "italy",
  "poland",
  "spain",
  "belgium",
  "ireland",
  "denmark",
] as const satisfies readonly CountryEurope[];

const COUNTRIES_ASIA = [
  "china",
  "japan",
  "taiwan",
  "hongKong",
  "southKorea",
  "malaysia",
  "indonesia",
  "thailand",
] as const satisfies readonly CountryAsia[];
```

`satisfies` keeps TS screaming if the arrays ever drift from the unions.

```ts
type Sector =
  | "technology"
  | "financials"
  | "healthcare"
  | "consumerDiscretionary"
  | "consumerStaples"
  | "industrials"
  | "energy"
  | "utilities"
  | "materials"
  | "realEstate"
  | "communicationServices";
```

**Storage vs. display — regional roll-up:**

ETF factsheets report geographic exposure inconsistently. Some give a single `Europe: 42%` line; others break it down country-by-country (`France: 8%, Germany: 7%, ...`). The data model stores whatever the ETF reports verbatim — no transformation at ingestion.

At **chart render time** and for **similarity detection**, a helper rolls up the granular countries into their aggregate bucket before the chart sees the data:

- `europe` displayed value = `geoAllocation.europe ?? 0` + sum of the 15 listed European countries
- `asia` displayed value = `geoAllocation.asia ?? 0` + sum of the 8 listed Asian countries
- Individual EU and Asian country entries are **not** rendered as their own slices in the charts — only the aggregates

This means: if an ETF reports `{ france: 10, germany: 8, uk: 5 }`, the chart shows `europe: 23`. If another reports `{ europe: 23 }` directly, it shows the same thing. The detail-page form, however, preserves the full granular view so you can edit what the factsheet actually says.

The sector list mirrors GICS (11 sectors) and has no hierarchy — treat it as a flat starting point and adjust if the ETF data you ingest uses different categories.

### 2.3 `personalPortfolio` — User's personal holdings

Each entry references one ISIN and adds personal-portfolio-specific data.

| Field           | Type    | Notes                                             |
| --------------- | ------- | ------------------------------------------------- |
| `isin`          | string  | FK to `isins.isin`                                |
| `positionValue` | number  | Current value held, in portfolio currency         |
| `targetAmount`  | number  | Planning goal for this holding                    |
| `notes`         | string  | Free-form personal notes (why invested / why not) |
| `inPEA`         | boolean | Whether this position sits inside a PEA           |

### 2.4 `professionalPortfolio` — HumaCode holdings

Same schema as `personalPortfolio`. Separate collection, separate data.

### 2.5 `settings` — User preferences

| Field              | Type                                             | Notes                       |
| ------------------ | ------------------------------------------------ | --------------------------- |
| `theme`            | `'light' \| 'dark'`                              |                             |
| `columnVisibility` | `Record<string, boolean>`                        | Per-column show/hide        |
| `columnOrder`      | `string[]`                                       | Ordered list of column keys |
| `sort`             | `{ column: string; direction: 'asc' \| 'desc' }` | Persisted sort state        |

### 2.6 Top-level JSON shape

```ts
type AppData = {
  isins: Isin[];
  personalPortfolio: PortfolioEntry[];
  professionalPortfolio: PortfolioEntry[];
  settings: Settings;
};
```

This is the exact shape exported and re-imported.

---

## 3. Features

### 3.1 ISINs table — default column order

Columns are displayed left-to-right in this order. Users can then reorder/hide and the choice persists via `settings`.

1. Score
2. Provider
3. ISIN
4. Ticker(s) — rendered as a list when there are multiple
5. Name
6. Accumulating (yes/no)
7. Available on Shares
8. Available for plan
9. Fees
10. Performance 1y / 3y / 5y
11. Risk-reward 1y / 3y / 5y

All columns are **sortable** and **filterable**.

### 3.2 Detail page

Clicking a row navigates to a dedicated detail page for that ISIN.

- **Full-page editable form** covering every field (no horizontal-scroll table editing)
- Geographic allocation and sector allocation displayed readably
- **Charts** for geo/sector breakdown — optional / nice-to-have

### 3.3 Personal & Professional portfolio pages

Each portfolio gets its own dedicated page. They share the same layout.

**Default state when landing on the page:**

- Table pre-filtered to show **only ISINs held in this portfolio**
- All rows are pre-checked (selection = actual holdings)
- Below the table, two side-by-side chart panels show identical breakdowns (selection = portfolio)

**Portfolio-specific columns** (added on top of the ISINs columns):

- Position value (how much currently held)
- Target amount
- Notes (portfolio-scoped, not on the generic ISIN)
- In PEA (yes/no)
- Similarity indicator (see §3.5)

**"Add investment" action:** expands the table to show all available ISINs from the generic list. Unheld ISINs appear **below** the currently-held (checked) rows and are unchecked by default. Checking one adds it to the selection for chart comparison and triggers the similarity detector.

### 3.4 Charts & comparison tool

Two side-by-side chart panels on each portfolio page:

- **Left:** actual portfolio allocation (geo + sector)
- **Right:** current selection allocation (geo + sector)

Because the selection starts equal to the actual portfolio, both panels are identical on page load. As the user checks/unchecks rows (e.g. after clicking "Add investment"), the right panel updates live so they can preview how a change would shift their allocation before committing.

### 3.5 Similarity detection

Goal: prevent accidentally holding two instruments with largely overlapping exposure (same sectors, same geographies).

- Implemented as a **column** on the portfolio tables, not a standalone page
- A warning icon appears in the cell when the holding is too similar to another held holding
- **Hover** reveals the list of conflicting ISINs and what they overlap on
- Re-runs automatically whenever a new row is checked in "Add investment" mode
- Similarity metric: weighted overlap between `sectorAllocation` and `geoAllocation` (threshold TBD)

### 3.6 Conditional formatting (color-coded cells)

Applied to **all numerical columns** except the allocation columns (geo/sector have no intrinsic "good/bad").

- Lowest/best value → green background
- Highest/worst value → red background
- Middle range → no background (neutral)

Direction depends on the metric: for fees, low is green; for performance, high is green; etc.

The **score** column gets the same treatment — it's the aggregate of the underlying metrics so it should read at a glance.

### 3.7 Import / Export

- **Export:** download a single JSON file containing `isins`, `personalPortfolio`, `professionalPortfolio`, and `settings`
- **Import:** load such a JSON file to fully restore a session. Replaces local state.

### 3.8 Local persistence

- Everything auto-persists to local storage (IndexedDB recommended given size; `localStorage` acceptable for MVP)
- Closing the tab, reloading, or coming back later must restore the exact previous state even without exporting

### 3.9 Unsaved-changes reminder

A subtle visual cue nudges the user to export a backup when meaningful unsaved work has accumulated.

- Triggered by a combination of **modification count** and **elapsed time**, not every single edit
- Rendered as a gentle animation on the export button (e.g. a wiggle)
- Must not nag continuously — once triggered, it stays calm until the next threshold

---

## 4. Technical Stack

| Concern           | Choice                                                 |
| ----------------- | ------------------------------------------------------ |
| App type          | Progressive Web App (installable, offline-capable)     |
| Language          | TypeScript                                             |
| UI framework      | React                                                  |
| Styling           | TailwindCSS                                            |
| Component library | DaisyUI (https://daisyui.com)                          |
| Formatting        | OxFmt (https://oxc.rs/docs/guide/usage/formatter.html) |
| Linting           | OxLint (https://oxc.rs/docs/guide/usage/linter.html)   |
| Validation        | Zod                                                    |

**Open technical points to decide :**

- Storage layer (IndexedDB vs `localStorage`; `idb-keyval` or similar)
- Charting library (Recharts, Chart.js, or ECharts)
- State management (React Context + reducer vs Zustand with persistence middleware vs Jotai)
- Routing (React Router vs TanStack Router)

## GSTACK REVIEW REPORT

| Review        | Trigger               | Why                             | Runs | Status       | Findings                  |
| ------------- | --------------------- | ------------------------------- | ---- | ------------ | ------------------------- |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy                | 0    | —            | —                         |
| Codex Review  | `/codex review`       | Independent 2nd opinion         | 0    | —            | —                         |
| Eng Review    | `/plan-eng-review`    | Architecture & tests (required) | 1    | CLEAR (PLAN) | 7 issues, 3 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps                      | 0    | —            | —                         |
| DX Review     | `/plan-devex-review`  | Developer experience gaps       | 0    | —            | —                         |

- **UNRESOLVED:** 0 decisions unresolved
- **VERDICT:** ENG CLEARED — ready to implement. 3 critical gaps documented (score `undefined` handling, `JSON.parse` error boundary before Zod, `computeSimilarity` NaN guard).
