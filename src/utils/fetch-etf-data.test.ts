import { fetchEtfData, parseEtfHtml } from "./fetch-etf-data.ts";
import sampleHtml from "./fetch-etf-sample.html?raw";

function buildHtml(overrides: Record<string, string> = {}): string {
  const defaults: Record<string, string> = {
    "etf-profile-header_etf-name": "iShares Core S&amp;P 500 UCITS ETF USD (Acc)",
    "etf-profile-header_identifier-value-ticker": "SXR8",
    "etf-profile-header_ter-value": "0.07% p.a.",
    "etf-returns-section_1year-return": "+26.14%",
    "etf-returns-section_3year-return": "+66.54%",
    "etf-returns-section_5year-return": "+87.45%",
    "tl_etf-basics_value_distribution-policy": "Accumulating",
    "tl_etf-basics_value_fund-provider": "iShares",
  };
  const values = { ...defaults, ...overrides };
  const elements = Object.entries(values)
    .map(([id, text]) => `<span data-testid="${id}">${text}</span>`)
    .join("\n");
  return `<html><body>${elements}</body></html>`;
}

describe("parseEtfHtml — identity fields", () => {
  it("parses name, provider, tickers and accumulating flag", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(sampleHtml);
    expect(result.name).toBe("iShares Core S&P 500 UCITS ETF USD (Acc)");
    expect(result.provider).toBe("iShares");
    expect(result.tickers).toBe("SXR8");
    expect(result.isAccumulating).toBe(true);
  });

  it("parses fees and performance figures", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml());
    expect(result.fees).toBe("0.07");
    expect(result.performance1y).toBe("26.14");
    expect(result.performance3y).toBe("66.54");
    expect(result.performance5y).toBe("87.45");
  });

  it("parses return per risk figures from sample HTML", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(sampleHtml);
    expect(result.riskReward1y).toBe("2.08");
    expect(result.riskReward3y).toBe("1.19");
    expect(result.riskReward5y).toBe("0.77");
  });
});

describe("parseEtfHtml — allocation", () => {
  it("parses geo allocation from sample HTML", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(sampleHtml);
    expect(result.geoAllocation).toMatchInlineSnapshot(`
      {
        "ireland": 1.44,
        "us": 95.16,
      }
    `);
  });

  it("parses sector allocation from sample HTML", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(sampleHtml);
    expect(result.sectorAllocation).toMatchInlineSnapshot(`
      {
        "communicationServices": 10.22,
        "consumerDiscretionary": 10.01,
        "financials": 10.38,
        "technology": 33.9,
      }
    `);
  });

  it("returns empty allocation objects when no allocation rows are present", () => {
    expect.hasAssertions();
    const result = parseEtfHtml("<html><body></body></html>");
    expect(result.geoAllocation).toStrictEqual({});
    expect(result.sectorAllocation).toStrictEqual({});
  });

  it("skips rows with missing name or percentage elements", () => {
    expect.hasAssertions();
    const html = `<html><body>
      <div data-testid="etf-holdings_countries_row"><span data-testid="tl_etf-holdings_countries_value_name">United States</span></div>
      <div data-testid="etf-holdings_countries_row"><span data-testid="tl_etf-holdings_countries_value_percentage">50%</span></div>
    </body></html>`;
    const result = parseEtfHtml(html);
    expect(result.geoAllocation).toStrictEqual({});
  });

  it("skips rows with unknown country names", () => {
    expect.hasAssertions();
    const html = `<html><body>
      <div data-testid="etf-holdings_countries_row">
        <span data-testid="tl_etf-holdings_countries_value_name">Other</span>
        <span data-testid="tl_etf-holdings_countries_value_percentage">3.4%</span>
      </div>
    </body></html>`;
    const result = parseEtfHtml(html);
    expect(result.geoAllocation).toStrictEqual({});
  });

  it("skips rows with non-numeric percentage values", () => {
    expect.hasAssertions();
    const html = `<html><body>
      <div data-testid="etf-holdings_countries_row">
        <span data-testid="tl_etf-holdings_countries_value_name">United States</span>
        <span data-testid="tl_etf-holdings_countries_value_percentage">N/A</span>
      </div>
    </body></html>`;
    const result = parseEtfHtml(html);
    expect(result.geoAllocation).toStrictEqual({});
  });
});

describe("parseEtfHtml — distribution policy", () => {
  it("returns false for isAccumulating when policy is Distributing", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "tl_etf-basics_value_distribution-policy": "Distributing" }));
    expect(result.isAccumulating).toBe(false);
  });

  it("returns undefined for isAccumulating when distribution element is missing", () => {
    expect.hasAssertions();
    const html = `<html><body><span data-testid="etf-profile-header_etf-name">Test ETF</span></body></html>`;
    const result = parseEtfHtml(html);
    expect(result.isAccumulating).toBeUndefined();
  });
});

describe("parseEtfHtml — missing elements", () => {
  it("returns undefined for identity fields when page has no matching elements", () => {
    expect.hasAssertions();
    const result = parseEtfHtml("<html><body></body></html>");
    expect(result.name).toBeUndefined();
    expect(result.provider).toBeUndefined();
    expect(result.tickers).toBeUndefined();
    expect(result.isAccumulating).toBeUndefined();
  });

  it("returns undefined for financial fields when page has no matching elements", () => {
    expect.hasAssertions();
    const result = parseEtfHtml("<html><body></body></html>");
    expect(result.fees).toBeUndefined();
    expect(result.performance1y).toBeUndefined();
    expect(result.performance3y).toBeUndefined();
    expect(result.performance5y).toBeUndefined();
  });

  it("returns undefined for return per risk fields when page has no matching elements", () => {
    expect.hasAssertions();
    const result = parseEtfHtml("<html><body></body></html>");
    expect(result.riskReward1y).toBeUndefined();
    expect(result.riskReward3y).toBeUndefined();
    expect(result.riskReward5y).toBeUndefined();
  });

  it("returns undefined for return per risk when value cell is empty", () => {
    expect.hasAssertions();
    const html = `<html><body><div data-testid="etf-risk_table_panel"><table><tbody><tr><td class="vallabel"> Return per risk 1 year </td><td class="val"></td></tr></tbody></table></div></body></html>`;
    const result = parseEtfHtml(html);
    expect(result.riskReward1y).toBeUndefined();
  });
});

describe("parseEtfHtml — invalid values", () => {
  it("returns undefined for performance when value is not a valid number", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "etf-returns-section_1year-return": "N/A" }));
    expect(result.performance1y).toBeUndefined();
  });

  it("handles negative performance values", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "etf-returns-section_1year-return": "-5.32%" }));
    expect(result.performance1y).toBe("-5.32");
  });

  it("returns undefined for fees when value is not a valid number", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "etf-profile-header_ter-value": "N/A" }));
    expect(result.fees).toBeUndefined();
  });
});

describe("fetchEtfData", () => {
  it("fetches and parses ETF data successfully", async () => {
    expect.hasAssertions();
    const html = buildHtml();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(html) }));
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.name).toBe("iShares Core S&P 500 UCITS ETF USD (Acc)");
    expect(result.tickers).toBe("SXR8");
  });

  it("throws on HTTP error", async () => {
    expect.hasAssertions();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchEtfData("IE00B5BMR087")).rejects.toThrow("HTTP error 503");
  });

  it("throws when fetch rejects", async () => {
    expect.hasAssertions();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    await expect(fetchEtfData("IE00B5BMR087")).rejects.toThrow("Network error");
  });
});
