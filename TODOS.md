# TODOS

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
