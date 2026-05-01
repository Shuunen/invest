import type { Country, Sector } from "../schemas/index.ts";

export type EtfPrefillData = {
  fees: string | undefined;
  geoAllocation: Partial<Record<Country, number>>;
  isAccumulating: boolean | undefined;
  name: string | undefined;
  performance1y: string | undefined;
  performance3y: string | undefined;
  performance5y: string | undefined;
  provider: string | undefined;
  riskReward1y: string | undefined;
  riskReward3y: string | undefined;
  riskReward5y: string | undefined;
  sectorAllocation: Partial<Record<Sector, number>>;
  tickers: string | undefined;
};

const GEO_NAME_TO_KEY: Record<string, Country> = {
  Australia: "australia",
  Austria: "austria",
  Belgium: "belgium",
  Brazil: "brazil",
  Canada: "canada",
  China: "china",
  Denmark: "denmark",
  Finland: "finland",
  France: "france",
  Germany: "germany",
  "Hong Kong": "hongKong",
  India: "india",
  Indonesia: "indonesia",
  Ireland: "ireland",
  Italy: "italy",
  Japan: "japan",
  Malaysia: "malaysia",
  Netherlands: "netherlands",
  Norway: "norway",
  Poland: "poland",
  "Saudi Arabia": "saudiArabia",
  "South Korea": "southKorea",
  Spain: "spain",
  Sweden: "sweden",
  Switzerland: "switzerland",
  Taiwan: "taiwan",
  Thailand: "thailand",
  "United Kingdom": "uk",
  "United States": "us",
};

const SECTOR_NAME_TO_KEY: Record<string, Sector> = {
  "Basic Materials": "materials",
  "Communication Services": "communicationServices",
  "Consumer Discretionary": "consumerDiscretionary",
  "Consumer Staples": "consumerStaples",
  Energy: "energy",
  Financials: "financials",
  "Health Care": "healthcare",
  Healthcare: "healthcare",
  Industrials: "industrials",
  Materials: "materials",
  "Real Estate": "realEstate",
  Technology: "technology",
  Telecommunication: "communicationServices",
  Utilities: "utilities",
};

function getTestIdText(doc: Document, testId: string): string | undefined {
  const text = doc.querySelector(`[data-testid="${testId}"]`)?.textContent?.replaceAll(/\s+/g, " ").trim();
  return text !== "" && text !== undefined ? text : undefined;
}

type AllocationOptions<Key extends string> = { keyMap: Record<string, Key>; nameTestId: string; pctTestId: string; rowTestId: string };

function parseAllocation<Key extends string>(doc: Document, { rowTestId, nameTestId, pctTestId, keyMap }: AllocationOptions<Key>): Partial<Record<Key, number>> {
  const rows = doc.querySelectorAll(`[data-testid="${rowTestId}"]`);
  const result: Partial<Record<Key, number>> = {};
  for (const row of rows) {
    const name = row.querySelector(`[data-testid="${nameTestId}"]`)?.textContent?.trim();
    const pctText = row.querySelector(`[data-testid="${pctTestId}"]`)?.textContent?.trim();
    if (!name || !pctText) continue;
    const mappedKey = keyMap[name];
    if (mappedKey === undefined) continue;
    const num = Number.parseFloat(pctText.replace("%", "").replace(",", "."));
    if (!Number.isNaN(num)) result[mappedKey] = num;
  }
  return result;
}

function getRiskTableValue(doc: Document, label: string): string | undefined {
  const panel = doc.querySelector(`[data-testid="etf-risk_table_panel"]`);
  if (!panel) return undefined;
  const labelCell = Array.from(panel.querySelectorAll("td.vallabel")).find(cell => cell.textContent?.trim() === label);
  const value = (labelCell?.nextElementSibling as HTMLElement | null)?.textContent?.trim();
  return value !== "" && value !== undefined ? value : undefined;
}

function parsePercentValue(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const num = Number.parseFloat(raw.replace(",", "."));
  return Number.isNaN(num) ? undefined : String(num);
}

export function parseSectorsFromAjaxXml(xml: string): Partial<Record<Sector, number>> {
  const cdataMatches = [...xml.matchAll(/<!\[CDATA\[(.*?)\]\]>/gs)];
  for (const match of cdataMatches) {
    const [, html] = match;
    if (!html.includes('data-testid="etf-holdings_sectors_table"')) continue;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return parseAllocation(doc, { keyMap: SECTOR_NAME_TO_KEY, nameTestId: "tl_etf-holdings_sectors_value_name", pctTestId: "tl_etf-holdings_sectors_value_percentage", rowTestId: "etf-holdings_sectors_row" });
  }
  return {};
}

export function parseEtfHtml(html: string): EtfPrefillData {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const rawDistribution = getTestIdText(doc, "tl_etf-basics_value_distribution-policy");

  return {
    fees: parsePercentValue(getTestIdText(doc, "etf-profile-header_ter-value")),
    geoAllocation: parseAllocation(doc, { keyMap: GEO_NAME_TO_KEY, nameTestId: "tl_etf-holdings_countries_value_name", pctTestId: "tl_etf-holdings_countries_value_percentage", rowTestId: "etf-holdings_countries_row" }),
    isAccumulating: rawDistribution === undefined ? undefined : rawDistribution.toLowerCase().includes("accum"),
    name: getTestIdText(doc, "etf-profile-header_etf-name"),
    performance1y: parsePercentValue(getTestIdText(doc, "etf-returns-section_1year-return")),
    performance3y: parsePercentValue(getTestIdText(doc, "etf-returns-section_3year-return")),
    performance5y: parsePercentValue(getTestIdText(doc, "etf-returns-section_5year-return")),
    provider: getTestIdText(doc, "tl_etf-basics_value_fund-provider"),
    riskReward1y: getRiskTableValue(doc, "Return per risk 1 year"),
    riskReward3y: getRiskTableValue(doc, "Return per risk 3 years"),
    riskReward5y: getRiskTableValue(doc, "Return per risk 5 years"),
    sectorAllocation: parseAllocation(doc, { keyMap: SECTOR_NAME_TO_KEY, nameTestId: "tl_etf-holdings_sectors_value_name", pctTestId: "tl_etf-holdings_sectors_value_percentage", rowTestId: "etf-holdings_sectors_row" }),
    tickers: getTestIdText(doc, "etf-profile-header_identifier-value-ticker"),
  };
}

export async function fetchEtfData(isin: string): Promise<EtfPrefillData> {
  const proxyBase = "http://localhost:8010/proxy";
  const response = await fetch(`${proxyBase}/en/etf-profile.html?isin=${isin}`);
  if (!response.ok) throw new Error(`HTTP error ${String(response.status)}`);
  const text = await response.text();
  const result = parseEtfHtml(text);

  // The page-specific Wicket path (e.g. "0-1.0-holdingsSection-sectors-loadMoreSectors") is
  // embedded in a JS snippet and changes every session — extract it from the HTML rather than
  // relying on a hardcoded page ID.
  const wicketUrlMatch = /"u":"(\/en\/etf-profile\.html\?[^"]*loadMoreSectors[^"]*)"/.exec(text);
  const sectorsPath = wicketUrlMatch ? wicketUrlMatch[1] : `/en/etf-profile.html?6-1.0-holdingsSection-sectors-loadMoreSectors&isin=${isin}&_wicket=1`;

  const sectorsResponse = await fetch(`${proxyBase}${sectorsPath}&_=${Date.now()}`, {
    headers: {
      Accept: "application/xml, text/xml, */*; q=0.01",
      "wicket-ajax": "true",
      "wicket-ajax-baseurl": `en/etf-profile.html?isin=${isin}`,
      "x-requested-with": "XMLHttpRequest",
    },
  });
  if (sectorsResponse.ok) {
    const xml = await sectorsResponse.text();
    const expandedSectors = parseSectorsFromAjaxXml(xml);
    if (Object.keys(expandedSectors).length > 0) result.sectorAllocation = expandedSectors;
  }

  return result;
}
