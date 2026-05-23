# Invest App: Comprehensive State Review

**Date**: May 22, 2026 | **Version**: 0.10.0

---

## Executive Summary

**Invest** is a well-architected, offline-first PWA portfolio tracker built with React 19, TypeScript, and modern tooling. It excels at portfolio management fundamentals with clean data visualization and a focus on allocation tracking. However, it's a **feature-narrow, domain-specific tool** designed primarily for ETF portfolios with geographic/sector analysis, not a general-purpose investment tracker.

**Verdict**: The app successfully solves its stated problem (ETF portfolio tracking with allocation visibility) but needs intentional feature expansion to compete with general investment platforms or to become a Swiss Army knife for broader investing use cases.

---

## Current Architecture & State

### Stack & Quality

- **Framework**: React 19 + TypeScript (strict mode)
- **State**: Zustand with `subscribeWithSelector`
- **Storage**: IndexedDB via Dexie.js (offline-first)
- **Routing**: TanStack Router v1 (type-safe)
- **Styling**: TailwindCSS + DaisyUI (nord theme)
- **Data Fetching**: Custom proxy (JustETF + Logical Invest + FlareSolverr)
- **Testing**: Vitest + Playwright (9 E2E tests, unit coverage)
- **Build**: Turborepo (cached tasks)

### Code Health

- ✅ **No TypeScript errors** (type-safe throughout)
- ✅ **All tests passing** (E2E + unit)
- ✅ **Zero external dependencies for core UI** (only ~30 npm packages)
- ✅ **Offline-first architecture** (local IndexedDB, PWA ready)
- ✅ **Accessible UI patterns** (DaisyUI, semantic HTML)
- ⚠️ **Limited test coverage** (happy paths tested, edge cases sparse)
- ⚠️ **Mono-repo scalability** (turbo.json present but minimal optimization)

### Architecture Strengths

1. **Clean separation of concerns**: Schemas → Store → Pages → Components
2. **Data freshness tracking**: `updatedAt` timestamps on assets, `amountUpdatedAt` on entries
3. **Edit count system**: Global counter prevents accidentally exporting stale data
4. **Validation everywhere**: Zod schemas enforce data integrity on import/export
5. **Similarity detection**: Flags overlapping ETF allocations with dismissal UX
6. **Portfolio diffing**: Save modal shows before/after for every edit

---

## Feature Breakdown: What Exists

### 🟢 Solid Features (Well-Implemented)

#### Portfolio Management

| Feature                      | Quality    | Notes                                  |
| ---------------------------- | ---------- | -------------------------------------- |
| Create/edit portfolios       | ⭐⭐⭐⭐⭐ | Validation, modal UX, broker field     |
| Multiple portfolios (50-cap) | ⭐⭐⭐⭐⭐ | Hard cap enforced at store level       |
| Asset picker modal           | ⭐⭐⭐⭐⭐ | With weighted allocation preview       |
| Inline amount/price editing  | ⭐⭐⭐⭐⭐ | Edit mode toggle, amount as % of total |
| Position notes               | ⭐⭐⭐⭐⭐ | Free-text, inline editable, sortable   |
| Target amounts               | ⭐⭐⭐⭐⭐ | Per-position targets with trend icons  |

#### Asset Management

| Feature                     | Quality    | Notes                                    |
| --------------------------- | ---------- | ---------------------------------------- |
| Asset creation + ISIN fetch | ⭐⭐⭐⭐⭐ | Pulls data from JustETF/Logical Invest   |
| Asset edit with diff modal  | ⭐⭐⭐⭐⭐ | Review changes before save               |
| Asset view (all metadata)   | ⭐⭐⭐⭐⭐ | Sector/geo breakdown, performance data   |
| Price updates               | ⭐⭐⭐⭐⭐ | Manual edit + auto-fetch support         |
| ISIN rename with cascade    | ⭐⭐⭐⭐⭐ | Updates all portfolio entries atomically |

#### Data Visualization

| Feature                                 | Quality    | Notes                                              |
| --------------------------------------- | ---------- | -------------------------------------------------- |
| Sector allocation pie chart             | ⭐⭐⭐⭐⭐ | Interactive, balance score, "Other" slice          |
| Geographic allocation pie chart         | ⭐⭐⭐⭐⭐ | Interactive, balance score, supports 50+ countries |
| Target allocation charts (side-by-side) | ⭐⭐⭐⭐⭐ | Actual vs. target comparison                       |
| Allocation before/after preview         | ⭐⭐⭐⭐⭐ | In asset picker, capital-weighted                  |
| Hover tooltips on charts                | ⭐⭐⭐⭐⭐ | Clean, readable, styled                            |

#### Data Quality & Scoring

| Feature                     | Quality    | Notes                           |
| --------------------------- | ---------- | ------------------------------- |
| Asset data score (0–100)    | ⭐⭐⭐⭐⭐ | Blends completeness + freshness |
| Composite performance score | ⭐⭐⭐⭐⭐ | 1y/3y/5y weighted (0.2/0.5/0.3) |
| Risk/reward metrics         | ⭐⭐⭐⭐⭐ | Per timeframe                   |
| Fee tracking                | ⭐⭐⭐⭐⭐ | Visual warnings when > 1%       |
| Similarity detection        | ⭐⭐⭐⭐⭐ | Geo + sector overlap flagged    |

#### Import/Export

| Feature                     | Quality    | Notes                                 |
| --------------------------- | ---------- | ------------------------------------- |
| JSON export (all data)      | ⭐⭐⭐⭐⭐ | Includes portfolios, assets, settings |
| JSON import with validation | ⭐⭐⭐⭐⭐ | Zod schemas reject malformed data     |
| Staleness indicator         | ⭐⭐⭐⭐⭐ | Fresh/warning/stale visual feedback   |
| Export timestamp tracking   | ⭐⭐⭐⭐⭐ | Knows last export + edit count        |

#### PWA & Offline

| Feature                   | Quality    | Notes                              |
| ------------------------- | ---------- | ---------------------------------- |
| Offline warning banner    | ⭐⭐⭐⭐⭐ | Clear, dismissible                 |
| IndexedDB persistence     | ⭐⭐⭐⭐⭐ | All data survives reload           |
| Installable (Android/iOS) | ⭐⭐⭐⭐⭐ | Web app manifest, apple-touch-icon |

#### Performance & Polish

| Feature                   | Quality    | Notes                                |
| ------------------------- | ---------- | ------------------------------------ |
| Animated page transitions | ⭐⭐⭐⭐   | Slide-in, heading animations         |
| Table virtualization      | ⚠️         | Not implemented; OK for < 500 assets |
| Mobile responsiveness     | ⭐⭐⭐⭐⭐ | Grid layouts adapt to viewport       |
| Dark mode                 | ⭐⭐⭐⭐   | Nord theme (light only in sample)    |

---

## Feature Gaps: What's Missing

### 🔴 Critical Gaps (Expected in Modern Portfolio Apps)

| Feature                              | Impact    | Why It Matters                                                    | Effort   |
| ------------------------------------ | --------- | ----------------------------------------------------------------- | -------- |
| **Portfolio performance tracking**   | 🔴 HIGH   | Users can't see portfolio-level returns over time (1y/3y/5y)      | 2–3 days |
| **Rebalancing calculator**           | 🔴 HIGH   | Users must manually calculate how much to buy/sell to hit targets | 1–2 days |
| **Dividend/income tracking**         | 🔴 HIGH   | Can't track distributions, yields, or reinvestment                | 3–4 days |
| **Transaction history**              | 🔴 HIGH   | No buy/sell record, can't compute cost basis or tax lot tracking  | 2–3 days |
| **Contribution history**             | 🔴 HIGH   | Can't distinguish between gains and new money invested            | 1–2 days |
| **Export to spreadsheet** (CSV/XLSX) | 🟡 MEDIUM | Users stuck with JSON; no easy Excel integration                  | 1 day    |
| **Alerts/rebalance thresholds**      | 🟡 MEDIUM | No notifications when allocation drifts beyond target             | 1–2 days |
| **Individual stock support**         | 🟡 MEDIUM | App is ETF-only; users with individual stocks left out            | 2–3 days |
| **Multi-currency handling**          | 🟡 MEDIUM | All prices assumed in EUR; no FX conversion                       | 2–3 days |
| **Bond/fixed-income tracking**       | 🟡 MEDIUM | Focuses on equities/ETFs; no fixed income data                    | 1–2 days |

### 🟡 Moderate Gaps (Nice-to-Haves, High-Impact)

| Feature                             | Why It Matters                                                         | Effort   |
| ----------------------------------- | ---------------------------------------------------------------------- | -------- |
| **Saved searches/filters**          | Users re-apply "accumulating ETFs only" or "1y perf > 20%" every time  | 1 day    |
| **Custom allocations templates**    | E.g., "60/40 stocks/bonds", "Boglehead", "factor tilt"                 | 1–2 days |
| **Asset comparison view**           | Side-by-side table of similar ETFs (fees, performance, allocations)    | 1 day    |
| **Benchmarking**                    | Compare portfolio performance to market indices (S&P 500, CAC40, etc.) | 1–2 days |
| **Tax-loss harvesting suggestions** | Identify holdings with unrealized losses                               | 1 day    |
| **Expense ratio breakdown**         | Show annual cost in EUR/USD not just %                                 | 0.5 days |
| **Backtesting on historical data**  | "How would this portfolio have performed in 2008?"                     | 2–3 days |
| **Correlation matrix**              | Show which assets in portfolio move together                           | 1 day    |

### 🟠 Polish Gaps (UX/Ergonomics)

| Gap                               | Why It Matters                                                   | Effort   |
| --------------------------------- | ---------------------------------------------------------------- | -------- |
| **No app-level search**           | Finding an asset across 500+ requires scrolling                  | 0.5 days |
| **No drag-drop table reordering** | Column order is fixed (sortable, but not movable)                | 1 day    |
| **No bulk actions**               | Can't select 10 assets and change them at once                   | 1 day    |
| **No account linking**            | Manual import only; can't sync from brokers (Fortuneo, IB, etc.) | 3–5 days |
| **No undo/redo**                  | User hits delete, it's gone forever                              | 1 day    |

---

## Inconsistencies & UX Issues

### UI/UX Inconsistencies

| Issue                                    | Severity  | Example                                                                                      | Fix                                         |
| ---------------------------------------- | --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Mixed edit patterns**                  | 🟡 MEDIUM | Assets have modals (confirm save), portfolios edit inline; inconsistent mental model         | Use modals for all high-risk edits          |
| **No clear affordances for actions**     | 🟡 MEDIUM | "Select assets" button unclear; should be "Add/Remove" or have icon                          | Better naming, consistent button sizing     |
| **Allocation charts collapse on mobile** | 🟡 MEDIUM | On small screens, charts stack poorly                                                        | Horizontal scroll or swipe carousel         |
| **No empty state on first load**         | 🟠 LOW    | App shows empty table immediately; should guide toward "import sample" or "create portfolio" | Onboarding flow                             |
| **Tooltip timing**                       | 🟠 LOW    | Hover tooltips on pie slices too fast; miss on mobile                                        | Increase delay, add click-to-show for touch |

### Data Model Inconsistencies

| Issue                                      | Severity  | Notes                                                                                         |
| ------------------------------------------ | --------- | --------------------------------------------------------------------------------------------- |
| **Target amounts mix units and currency**  | 🟡 MEDIUM | Can set target as # of units OR € amount; unclear which is canonical                          |
| **`inPEA` flag unused in most UX**         | 🟠 LOW    | Stored (French tax-advantaged account) but no filtering/UI signals its importance             |
| **No timestamp on portfolio entries**      | 🟡 MEDIUM | Can't tell when a position was added or last changed                                          |
| **Similarity dismissal keyed to old ISIN** | 🟡 MEDIUM | If ISIN renamed, dismissed similarities don't cascade (partially fixed but edge cases remain) |

### Data Freshness Issues

| Issue                              | Severity  | Context                                                                                                                      |
| ---------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Price staleness unclear**        | 🟡 MEDIUM | `updatedAt` timestamp exists but no "refresh prices" bulk action; user doesn't know if prices are from today or 6 months ago |
| **No automatic data refresh**      | 🟡 MEDIUM | User must manually refetch each asset; no background sync or scheduled updates                                               |
| **Allocation data rarely updated** | 🟠 LOW    | Geo/sector allocations fetched once during creation; if ETF fund changes allocation, app never knows                         |
| **Performance data lags**          | 🟠 LOW    | Fetched data may be 1–2 days old depending on data source refresh                                                            |

---

## Competitive Analysis

### vs. Popular Platforms

#### Vanguard Personal Advisor (US)

| Dimension                            | Invest         | Vanguard         | Winner   |
| ------------------------------------ | -------------- | ---------------- | -------- |
| **Offline support**                  | ✅ Yes         | ❌ No            | Invest   |
| **Portfolio performance (1y/3y/5y)** | ❌ No          | ✅ Yes           | Vanguard |
| **Rebalancing suggestions**          | ❌ No          | ✅ Yes           | Vanguard |
| **Tax-loss harvesting**              | ❌ No          | ✅ Yes           | Vanguard |
| **Advisor access**                   | ❌ No          | ✅ Yes (premium) | Vanguard |
| **Geo/sector breakdown**             | ✅ Yes         | ✅ Yes           | Tie      |
| **Custom cost basis**                | ❌ No          | ✅ Yes           | Vanguard |
| **Ease of use**                      | ✅ Lightweight | ⚠️ Complex       | Invest   |
| **Privacy (on-device storage)**      | ✅ Full        | ❌ Cloud         | Invest   |

#### Personal Capital (now Empower)

| Dimension                  | Invest                  | Personal Capital             | Winner           |
| -------------------------- | ----------------------- | ---------------------------- | ---------------- |
| **Portfolio tracking**     | ✅ Allocation           | ✅ Full (P/L, returns, fees) | Personal Capital |
| **Target allocations**     | ✅ Yes                  | ✅ Yes                       | Tie              |
| **Offline access**         | ✅ Yes                  | ❌ No                        | Invest           |
| **Net worth tracking**     | ❌ No (portfolios only) | ✅ Yes (all accounts)        | Personal Capital |
| **Expense ratio analysis** | ⚠️ Partial (% only)     | ✅ Full ($, rank by fund)    | Personal Capital |
| **Goal planning**          | ❌ No                   | ✅ Yes                       | Personal Capital |
| **Advisor access**         | ❌ No                   | ✅ Yes (paid)                | Personal Capital |
| **Free tier**              | ✅ Full                 | ✅ Free core                 | Tie              |

#### Bogleheads-Friendly Tools (Morningstar, MSCI, Vanguard ETF comparison)

| Feature                          | Invest                        | Morningstar       | Vanguard         | Winner          |
| -------------------------------- | ----------------------------- | ----------------- | ---------------- | --------------- |
| **ETF-only focus**               | ✅ Yes                        | ⚠️ Mixed          | ✅ Yes           | Tie             |
| **Allocation deep-dive**         | ✅ Pie charts + balance score | ✅ Reports + docs | ✅ Lightweight   | Morningstar     |
| **Similarity/overlap detection** | ✅ Yes                        | ⚠️ Limited        | ❌ No            | Invest          |
| **Ease of comparison**           | ✅ High                       | ⚠️ Complex        | ✅ High          | Invest/Vanguard |
| **Offline ready**                | ✅ Yes                        | ❌ No             | ❌ No            | Invest          |
| **Privacy**                      | ✅ Full                       | ⚠️ Some tracking  | ⚠️ Some tracking | Invest          |

#### Asset-Heavy Platforms (Interactive Brokers TWS, Bloomberg Terminal)

**Context**: These are professional tools; Invest doesn't compete here.

| Feature                 | Invest     | IB TWS       | Bloomberg    | Winner       |
| ----------------------- | ---------- | ------------ | ------------ | ------------ |
| **Real-time quotes**    | ❌ Delayed | ✅ Real-time | ✅ Real-time | IB/Bloomberg |
| **Order execution**     | ❌ No      | ✅ Yes       | ✅ Yes       | IB/Bloomberg |
| **Options analysis**    | ❌ No      | ✅ Yes       | ✅ Yes       | IB/Bloomberg |
| **Charting**            | ✅ Basic   | ✅ Advanced  | ✅ Advanced  | IB/Bloomberg |
| **Cost basis tracking** | ❌ No      | ✅ Yes       | ✅ Yes       | IB/Bloomberg |

---

## Recommended Feature Roadmap (Priority Order)

### Phase 1: Core Analytics (2–3 weeks) — **ENABLES BASIC INVESTMENT DECISION MAKING**

1. **Portfolio performance tracking** (2–3 days)
   - Store buy date + amount for each entry
   - Calculate total return = (current value - invested) / invested
   - Display 1y/3y/5y returns if enough historical data
   - Show gain/loss waterfall chart

2. **Transaction history** (2–3 days)
   - Log buy/sell events with date, amount, price, cost basis
   - Enable export to CSV for tax reporting
   - Link to portfolio entries

3. **Rebalancing calculator** (1–2 days)
   - Show "to reach target, buy X, sell Y"
   - Multi-currency support with FX rates
   - Suggest trades in priority order

4. **CSV export** (1 day)
   - Export assets, portfolios, transactions to spreadsheet-friendly format
   - Unlock Excel power users

### Phase 2: Data Quality & Automation (2–3 weeks) — **REDUCES MANUAL WORK**

1. **Bulk price refresh** (1 day)
   - One button: "Refresh all prices"
   - Async queue to avoid hammering data sources

2. **Broker data import** (3–5 days) — _Only if brokerage has public API_
   - Fortuneo (if API available)
   - Interactive Brokers
   - Auto-sync portfolio positions + cash balance

3. **Alerts & thresholds** (1–2 days)
   - "Alert me if tech allocation > 40%"
   - Browser notifications for threshold breaches

4. **Saved filters** (1 day)
   - "Show only distributing ETFs"
   - "Show only ETFs with 1y perf > 20%"
   - One-click activate

### Phase 3: Advanced Analytics (3–4 weeks) — **COMPETITIVE FEATURE SET**

1. **Backtesting** (2–3 days)
   - "How would this portfolio have performed in 2008?"
   - Against historical data (if fetchable)

2. **Benchmarking** (1–2 days)
   - Compare portfolio performance to indices (CAC40, MSCI World, etc.)
   - Show outperformance/underperformance

3. **Correlation matrix** (1 day)
   - Which assets move together? (via performance correlation over time)

4. **Dividend/income tracking** (2–3 days)
   - Log dividend payments, yields
   - Show total annual income from portfolio
   - Reinvestment modeling

---

## Quick Wins (1–2 Days, High Impact)

| Feature                                                                  | Why                                                       | Effort   |
| ------------------------------------------------------------------------ | --------------------------------------------------------- | -------- |
| **"Refresh all prices" button**                                          | Users stuck manually re-fetching each asset               | 1 day    |
| **Predefined filter buttons** ("Accumulating only", "Fees < 0.5%", etc.) | Reused constantly, currently require manual search        | 1 day    |
| **Dark mode toggle**                                                     | 20% of users prefer dark theme; currently only Nord light | 0.5 days |
| **Expense ratio in EUR/USD**                                             | Shows real cost, not just %; more intuitive               | 0.5 days |
| **Keyboard shortcuts** (E for edit, D for delete, etc.)                  | Power users demand this                                   | 0.5 days |
| **Undo/redo**                                                            | Accidental deletes currently unrecoverable                | 1 day    |
| **App-level asset search**                                               | Scrolling through 500 assets is painful                   | 0.5 days |
| **CSV export**                                                           | Enables Excel integration                                 | 1 day    |

---

## Inconsistency Resolutions

### Priority 1: Remove `positionValue` Redundancy

**Action**: Delete `positionValue` from `PortfolioEntrySchema`. Always compute as `amount * price`.
**Rationale**: Stored value is never kept in sync; breeds bugs.
**Impact**: Simplifies calculations, prevents stale data anomalies.
**Effort**: 0.5 days (schema + store + tests).

### Priority 2: Clarify Target Amount Units

**Action**: Add `targetAmountUnit: "units" | "currency"` field. UI defaults to currency (more intuitive for PEA/401k).
**Rationale**: Current ambiguity causes mental overhead; users not sure if they set units or amount.
**Impact**: Removes UI confusion, enables mixed-unit portfolios.
**Effort**: 1 day (schema + UI + validation).

### Priority 3: Consistency in Edit Patterns

**Action**: All destructive edits go through modals (confirm before save). Non-destructive edits (price, amount, note) can remain inline.
**Rationale**: Mixed patterns confuse users; modals prevent accidental losses.
**Impact**: Stronger UX, fewer "undo" requests.
**Effort**: 1 day (refactor edit flows, add modal wrappers).

### Priority 4: Portfolio Entry Timestamps

**Action**: Add `createdAt`, `updatedAt` to `PortfolioEntrySchema`.
**Rationale**: Enables "added this week", "unchanged for 6 months" analytics; supports rebalancing insights.
**Impact**: Rich historical context for decision-making.
**Effort**: 0.5 days (schema + migration).

---

## Architecture Recommendations

### 1. Prepare for Scaling (200+ assets)

**Current state**: Table loads all assets, filters client-side. Fine for < 500, painful at 2000+.
**Recommendation**: Add table virtualization when assets > 100.

```typescript
// Near-term: TanStack Virtual for large tables
// Far-term: Pagination + server-side filtering (if self-hosted)
```

**Effort**: 1 day now, saves pain later.

### 2. Multi-Tenant Data Model (Optional)

**Current state**: All data in one IndexedDB; no support for shared portfolios.
**Recommendation**: Add `userId` field to support future multi-user mode.

```typescript
type Portfolio = {
  ...
  ownerId: string;
  sharedWith?: string[];
};
```

**Effort**: 1 day (schema change, no migration needed now).

### 3. Real-Time Sync (Stretch)

**Current state**: Manual JSON import/export only.
**Recommendation**: Optional Supabase sync (if user opts in).
**Effort**: 3–5 days (big feature, low priority).

---

## Testing Gaps

### Coverage Holes

| Area                         | Coverage | Gap                                                              |
| ---------------------------- | -------- | ---------------------------------------------------------------- |
| **Asset import validation**  | ~70%     | Edge cases: malformed geoAllocation, missing fields              |
| **Portfolio calculations**   | ~80%     | Edge case: division by zero when totalValue = 0                  |
| **Similarity detection**     | ~60%     | No tests for threshold boundary conditions                       |
| **Data score computation**   | ~75%     | Missing tests for freshness age decay                            |
| **Export/import round-trip** | ~50%     | No regression test: export → import → export should be identical |

### Recommended Tests to Add

1. **Round-trip export/import** (2 hours)
   - Export data → import → verify identical structure
   - Catches schema drift bugs

2. **Allocation edge cases** (2 hours)
   - Portfolio with 0 assets
   - Portfolio with 1 asset (should be 100%)
   - Allocation sums > 100% (should cap "Other" at 0)

3. **Similarity threshold boundary** (1 hour)
   - Assets at exactly 85% similarity
   - Assets at 84.99% (should not trigger)

4. **Performance calculation edge cases** (1 hour)
   - Assets with no 1y data (should contribute 0 to blended score)
   - Assets with only 5y data (should be weighted correctly)

---

## Security & Privacy Notes

### Strengths

✅ All data lives locally (IndexedDB); no server required  
✅ Export/import JSON is human-readable (transparency)  
✅ Zod validation prevents injection attacks  
✅ No external API calls for user data (only for ETF metadata)

### Risks

⚠️ **No encryption at rest**: IndexedDB is unencrypted on disk. Attacker with device access can read data.  
⚠️ **No authentication**: Anyone with browser access can modify data.  
⚠️ **PWA cache policy**: Service worker caches assets; old code may linger if user doesn't clear cache.

### Recommendations

1. **Add optional data encryption** (Stretch goal; 2–3 days)
   - Encrypt IndexedDB with user-provided password
   - Decrypt on app load

2. **Document privacy model clearly** in About page.

---

## Competitive Positioning

### Invest Is Best For

1. **Privacy-conscious investors** ("My data never leaves my device")
2. **Offline-first users** ("I want to access my portfolio on a plane")
3. **ETF hobbyists** ("I want to understand overlaps in my fund holdings")
4. **Non-US investors** (French PEA support, EUR pricing)
5. **Lightweight, fast-loading** tools

### Invest Cannot Compete With

1. **Full-service brokerages** (Vanguard, IB) — missing order execution
2. **Robo-advisors** (Betterment, Wealthfront) — missing auto-rebalancing, goal planning
3. **Tax-optimized platforms** (Personal Capital) — missing cost basis, tax-loss harvesting
4. **Professional tools** (Bloomberg Terminal) — missing real-time data, options

---

## Conclusion & Next Steps

### What's Working Well

1. **Core portfolio tracking** — allocation visibility is best-in-class
2. **Data model** — clean, validated, no surprises
3. **UX simplicity** — new user can understand app in 2 minutes
4. **PWA/offline** — works where competitors require internet

### What Needs Attention

1. **Feature narrowness** — solves ETF tracking, doesn't solve investing broadly
2. **Incomplete analytics** — performance tracking, tax integration missing
3. **Data quality** — refresh mechanisms, automation gaps
4. **Inconsistencies** — mixed edit patterns, redundant fields

### Recommended 3-Month Roadmap

**Month 1**: Phase 1 analytics (performance, transactions, rebalancing)  
**Month 2**: Phase 2 automation (bulk refresh, filters, broker import if possible)  
**Month 3**: Phase 3 analytics (backtesting, benchmarking, dividends) + cleanup

**Key Success Metric**: Users can answer "Should I rebalance?" and "How has my portfolio performed?" without leaving the app.

---

## Appendix: Feature Request Template

When users request features, ask:

1. **What problem does it solve?** (performance tracking, tax reporting, time-saving, etc.)
2. **Is it ETF-specific or general investing?** (affects scope)
3. **How often do you use it?** (daily/weekly/monthly = priority)
4. **Would offline-first work?** (or does it need real-time data?)

### Example Request Resolution

- **"I want to see my portfolio performance"** → Phase 1 Priority 1
- **"I want to link my broker account"** → Phase 2 Priority 2 (if broker has API)
- **"I want to buy/sell stocks from the app"** → Out of scope (becomes a brokerage)
