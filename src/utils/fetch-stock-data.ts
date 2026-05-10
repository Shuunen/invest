import type { EtfPrefillData } from "./fetch-etf-data.ts";

type StockMetrics = {
  Sharpe?: number;
  TotalReturn?: number;
};

type StockAssetResponse = {
  exchange?: string;
  lastClosePrice?: number;
  metrics?: Partial<Record<"1y" | "3y" | "5y", StockMetrics>>;
  name?: string;
  symbol?: string;
};

const usdToEurConversionRate = 0.848;

function toOptionalString(value: number | undefined): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return String(value);
}

function toEuroPrice(value: number | undefined): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return String(Math.round(value * usdToEurConversionRate));
}

export async function fetchStockData(symbol: string): Promise<EtfPrefillData> {
  const encodedSymbol = encodeURIComponent(symbol.trim());
  const response = await fetch(`http://localhost:8010/stock/${encodedSymbol}`);
  if (!response.ok) throw new Error(`HTTP error ${String(response.status)}`);

  const stock = (await response.json()) as StockAssetResponse;

  return {
    fees: undefined,
    geoAllocation: {},
    isAccumulating: undefined,
    name: stock.name,
    performance1y: toOptionalString(stock.metrics?.["1y"]?.TotalReturn),
    performance3y: toOptionalString(stock.metrics?.["3y"]?.TotalReturn),
    performance5y: toOptionalString(stock.metrics?.["5y"]?.TotalReturn),
    price: toEuroPrice(stock.lastClosePrice),
    provider: stock.exchange,
    riskReward1y: toOptionalString(stock.metrics?.["1y"]?.Sharpe),
    riskReward3y: toOptionalString(stock.metrics?.["3y"]?.Sharpe),
    riskReward5y: toOptionalString(stock.metrics?.["5y"]?.Sharpe),
    sectorAllocation: {},
    tickers: stock.symbol,
  };
}
