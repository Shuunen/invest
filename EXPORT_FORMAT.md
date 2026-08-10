# Invest App — Export JSON Format

A guide for understanding the JSON file exported by this app.

---

## Top-level structure

```json
{
  "assets":     [ ...Asset ],
  "portfolios": [ ...Portfolio ],
  "settings":   { ...Settings }
}
```

---

## Asset

A single investable instrument (ETF, stock, etc.).

```json
{
  "isin": "IE00B4L5Y983", // string — unique identifier
  "name": "Core MSCI World", // string — full name
  "provider": "iShares", // string — ETF issuer / fund house
  "tickers": ["IWDA", "SWDA"], // string[] — exchange ticker symbols
  "fees": 0.2, // number — annual fee in % (0.2 = 0.20%)
  "isAccumulating": true, // bool — true = dividends reinvested, false = distributed
  "availableOnBroker": true, // bool — tradeable on the user's broker
  "availableForPlan": true, // bool — included in allocation planning
  "performance1y": 45, // number — total return over 1 year in % (45 = +45%)
  "performance3y": 87, // number — total return over 3 years in %
  "performance5y": 134, // number — total return over 5 years in %
  "riskReward1y": 1.8, // number — Sharpe ratio over 1 year
  "riskReward3y": 1.4, // number — Sharpe ratio over 3 years
  "riskReward5y": 1.1, // number — Sharpe ratio over 5 years
  "price": 98.42, // number — price of one unit/share in euros
  "updatedAt": "2025-12-01T10:00:00.000Z", // ISO 8601 — last data refresh
  "geoAllocation": { "us": 0.65, "europe": 0.15, "japan": 0.06 }, // country key → % as decimal (0.65 = 65%)
  "sectorAllocation": { "technology": 0.25, "financials": 0.15 }, // sector key → % as decimal (0.25 = 25%)
  "dismissedSimilarities": ["IE00B0M62Q58"], // ISINs dismissed from deduplication warnings
  "comments": "Core holding, low fees" // string — free-form note about the asset
}
```

### Country keys (geoAllocation)

Top-level regions: `us` `canada` `brazil` `europe` `asia` `india` `saudiArabia` `australia` `africa`

European countries: `uk` `switzerland` `france` `germany` `netherlands` `norway` `sweden` `austria` `finland` `italy` `poland` `spain` `belgium` `ireland` `denmark` `luxembourg`

Asian countries: `china` `japan` `taiwan` `hongKong` `southKorea` `malaysia` `indonesia` `thailand` `israel`

### Sector keys (sectorAllocation)

`technology` `financials` `healthcare` `consumerDiscretionary` `consumerStaples` `industrials` `energy` `utilities` `materials` `realEstate` `communicationServices`

---

## Portfolio

```json
{
  "id":     "87b67f15-e6f2-480b-8388-5440cc1c7423", // string — UUID v4
  "name":   "Personal",                              // string — portfolio name
  "broker": "Fortuneo",                              // string — broker name
  "entries": [ ...PortfolioEntry ]
}
```

### PortfolioEntry

```json
{
  "isin": "IE00B4L5Y983", // string — references an asset by ISIN
  "amount": 4, // number — units/shares currently held; total value = amount × asset.price
  "targetAmount": 6, // number — units/shares the user intends to hold (see below)
  "notes": "core holding", // string — free-text note
  "inPEA": false, // bool — true when held in a French PEA account
  "amountUpdatedAt": "2025-11-15T00:00:00.000Z", // ISO 8601 — when amount was last recorded
  "targetAmountUpdatedAt": "2025-10-01T00:00:00.000Z" // ISO 8601 — when targetAmount was last set
}
```

**targetAmount** is the number of units/shares the user intends to hold:

- `targetAmount > amount` → user plans to buy more (e.g. amount=4, target=6 → buy 2 units)
- `targetAmount < amount` → user plans to sell some (e.g. amount=4, target=2 → sell 2 units)
- `targetAmount === amount` → position is at target

---

## Settings

```json
{
  "theme": "light", // string — UI theme: "light" or "dark"
  "locale": "en", // string — UI language: "en" (English) or "fr" (French); defaults to "en"
  "columnOrder": ["name", "fees", "score"], // string[] — ordered column IDs as shown in the assets table
  "columnVisibility": { "provider": false }, // record — columnId → bool; false means hidden
  "sort": { "column": "score", "direction": "desc" }, // active sort column and direction ("asc" or "desc")
  "similarityThreshold": 0.85, // number — sensitivity of the asset deduplication detector (0–1)
  "editCount": 12, // number — total number of edits made by the user
  "lastExportedAt": "2025-12-01T10:00:00.000Z" // ISO 8601 — datetime of the last export
}
```

---

## Score (read-only, never stored)

The app derives a score per asset at runtime — it is never written to the JSON.

```text
score = avgPerformance + avgRiskReward × 5 − fees × 10
```

`avgPerformance` and `avgRiskReward` are weighted averages of the 1y/3y/5y values with weights 0.2 / 0.5 / 0.3. Both require at least the 3y value to be present.
