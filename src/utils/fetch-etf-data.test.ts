import { cleanAssetName, cleanProviderName, fetchEtfData, parseEtfHtml, parseSectorsFromAjaxXml } from "./fetch-etf-data.ts";
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

describe("cleanProviderName", () => {
  it("returns undefined when provider is undefined", () => {
    expect.hasAssertions();
    expect(cleanProviderName(undefined)).toBeUndefined();
  });

  it("removes ' ETF' suffix from provider name", () => {
    expect.hasAssertions();
    expect(cleanProviderName("Amundi ETF")).toBe("Amundi");
  });

  it("removes all occurrences of ' ETF' in the provider name", () => {
    expect.hasAssertions();
    expect(cleanProviderName("Amundi ETF Global ETF")).toBe("Amundi Global");
  });

  it("returns provider unchanged when no noise words are present", () => {
    expect.hasAssertions();
    expect(cleanProviderName("iShares")).toBe("iShares");
  });

  it("collapses extra whitespace after removal", () => {
    expect.hasAssertions();
    expect(cleanProviderName("Amundi  ETF")).toBe("Amundi");
  });

  it("returns undefined when removing noise words leaves an empty string", () => {
    expect.hasAssertions();
    expect(cleanProviderName(" ETF")).toBeUndefined();
  });
});

describe("cleanAssetName", () => {
  it("returns undefined when name is undefined", () => {
    expect.hasAssertions();
    expect(cleanAssetName(undefined, "iShares")).toBeUndefined();
  });

  it("returns name unchanged when provider is undefined", () => {
    expect.hasAssertions();
    expect(cleanAssetName("iShares Core S&P 500 UCITS ETF", undefined)).toBe("iShares Core S&P 500 UCITS ETF");
  });

  it("removes the first word of provider from the name", () => {
    expect.hasAssertions();
    expect(cleanAssetName("iShares Core S&P 500 UCITS ETF USD (Acc)", "iShares")).toBe("Core S&P 500 UCITS ETF USD (Acc)");
  });

  it("uses only the first word when provider has multiple words", () => {
    expect.hasAssertions();
    expect(cleanAssetName("Amundi MSCI World UCITS ETF", "Amundi Asset Management")).toBe("MSCI World UCITS ETF");
  });

  it("removes all occurrences of the first provider word in the name", () => {
    expect.hasAssertions();
    expect(cleanAssetName("Xtrackers MSCI World Xtrackers UCITS ETF", "Xtrackers")).toBe("MSCI World UCITS ETF");
  });

  it("collapses extra whitespace left by removal", () => {
    expect.hasAssertions();
    expect(cleanAssetName("iShares Core ETF", "iShares")).toBe("Core ETF");
  });

  it("returns name unchanged when provider starts with whitespace (no usable first word)", () => {
    expect.hasAssertions();
    expect(cleanAssetName("iShares Core ETF", "  ")).toBe("iShares Core ETF");
  });

  it("returns undefined when removing provider word leaves an empty name", () => {
    expect.hasAssertions();
    expect(cleanAssetName("iShares", "iShares")).toBeUndefined();
  });
});

describe("parseEtfHtml — identity fields", () => {
  it("parses name, provider, tickers and accumulating flag", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(sampleHtml);
    expect(result.name).toBe("Core S&P 500 UCITS ETF USD (Acc)");
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

  it("normalizes trailing zeros in risk/reward values to avoid false diffs (1.20 → 1.2)", () => {
    expect.hasAssertions();
    const html = `<html><body><div data-testid="etf-risk_table_panel"><table><tbody><tr><td class="vallabel">Return per risk 3 years</td><td class="val">1.20</td></tr></tbody></table></div></body></html>`;
    const result = parseEtfHtml(html);
    expect(result.riskReward3y).toBe("1.2");
  });

  it("returns undefined for return per risk when value is not a valid number", () => {
    expect.hasAssertions();
    const html = `<html><body><div data-testid="etf-risk_table_panel"><table><tbody><tr><td class="vallabel">Return per risk 1 year</td><td class="val">N/A</td></tr></tbody></table></div></body></html>`;
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

  it("parses European comma-decimal performance values (e.g. '1,50%')", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "etf-returns-section_1year-return": "1,50%" }));
    expect(result.performance1y).toBe("1.5");
  });

  it("parses European comma-decimal fees (e.g. '0,07%')", () => {
    expect.hasAssertions();
    const result = parseEtfHtml(buildHtml({ "etf-profile-header_ter-value": "0,07%" }));
    expect(result.fees).toBe("0.07");
  });
});

describe("parseEtfHtml — empty text content", () => {
  it("returns undefined for name when element is present but has empty text", () => {
    expect.hasAssertions();
    const html = `<html><body><span data-testid="etf-profile-header_etf-name"></span></body></html>`;
    const result = parseEtfHtml(html);
    expect(result.name).toBeUndefined();
  });

  it("returns undefined for provider when element is present but has only whitespace", () => {
    expect.hasAssertions();
    const html = `<html><body><span data-testid="tl_etf-basics_value_fund-provider">   </span></body></html>`;
    const result = parseEtfHtml(html);
    expect(result.provider).toBeUndefined();
  });
});

describe("parseSectorsFromAjaxXml", () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><ajax-response><component id="id168" ><![CDATA[<a id="id168" state="active">Show less</a>]]></component><component id="id192" ><![CDATA[<table class="table mb-0" data-testid="etf-holdings_sectors_table" id="id192"><tbody><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Technology</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">33.90%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Financials</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">10.38%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Telecommunication</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">10.22%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Consumer Discretionary</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">10.01%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Health Care</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">9.31%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Industrials</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">8.32%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Consumer Staples</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">4.98%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Energy</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">4.01%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Utilities</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">2.54%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Real Estate</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">1.92%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Basic Materials</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">1.61%</span></div></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Other</td><td><div class="right"><span data-testid="tl_etf-holdings_sectors_value_percentage">2.81%</span></div></td></tr></tbody></table>]]></component></ajax-response>`;

  it("parses all known sectors from the AJAX XML response", () => {
    expect.hasAssertions();
    const result = parseSectorsFromAjaxXml(sampleXml);
    expect(result).toMatchInlineSnapshot(`
      {
        "communicationServices": 10.22,
        "consumerDiscretionary": 10.01,
        "consumerStaples": 4.98,
        "energy": 4.01,
        "financials": 10.38,
        "healthcare": 9.31,
        "industrials": 8.32,
        "materials": 1.61,
        "realEstate": 1.92,
        "technology": 33.9,
        "utilities": 2.54,
      }
    `);
  });

  it("skips the Other row since it has no mapped key", () => {
    expect.hasAssertions();
    const result = parseSectorsFromAjaxXml(sampleXml);
    expect(Object.keys(result)).not.toContain("other");
  });

  it("returns empty object when XML has no sectors table", () => {
    expect.hasAssertions();
    const result = parseSectorsFromAjaxXml(`<?xml version="1.0"?><ajax-response><component><![CDATA[<a>Show less</a>]]></component></ajax-response>`);
    expect(result).toStrictEqual({});
  });
});

describe("fetchEtfData", () => {
  it("fetches and parses ETF data successfully", async () => {
    expect.hasAssertions();
    const html = buildHtml();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html) })
        .mockResolvedValueOnce({ ok: false, status: 404 }),
    );
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.name).toBe("Core S&P 500 UCITS ETF USD (Acc)");
    expect(result.tickers).toBe("SXR8");
  });

  it("uses expanded sectors from AJAX endpoint when available", async () => {
    expect.hasAssertions();
    const html = buildHtml();
    const xml = `<?xml version="1.0"?><ajax-response><component><![CDATA[<table data-testid="etf-holdings_sectors_table"><tbody><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Technology</td><td><span data-testid="tl_etf-holdings_sectors_value_percentage">33.90%</span></td></tr><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Health Care</td><td><span data-testid="tl_etf-holdings_sectors_value_percentage">9.31%</span></td></tr></tbody></table>]]></component></ajax-response>`;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml) }),
    );
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.sectorAllocation).toStrictEqual({ healthcare: 9.31, technology: 33.9 });
  });

  it("extracts the Wicket sectors URL from the HTML when present", async () => {
    expect.hasAssertions();
    const wicketPath = "/en/etf-profile.html?0-1.0-holdingsSection-sectors-loadMoreSectors&isin=IE00B5BMR087&_wicket=1";
    const html = `${buildHtml()}<script>Wicket.Ajax.ajax({"u":"${wicketPath}","e":"click"});</script>`;
    const xml = `<?xml version="1.0"?><ajax-response><component><![CDATA[<table data-testid="etf-holdings_sectors_table"><tbody><tr data-testid="etf-holdings_sectors_row"><td data-testid="tl_etf-holdings_sectors_value_name">Technology</td><td><span data-testid="tl_etf-holdings_sectors_value_percentage">42.00%</span></td></tr></tbody></table>]]></component></ajax-response>`;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml) }),
    );
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.sectorAllocation).toStrictEqual({ technology: 42 });
  });

  it("falls back to parsed sectors when AJAX endpoint fails", async () => {
    expect.hasAssertions();
    const html = buildHtml();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html) })
        .mockResolvedValueOnce({ ok: false, status: 404 }),
    );
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.sectorAllocation).toStrictEqual({});
  });

  it("falls back to parsed sectors when AJAX endpoint returns no recognizable sectors", async () => {
    expect.hasAssertions();
    const html = buildHtml();
    const emptyXml = `<?xml version="1.0"?><ajax-response><component><![CDATA[<a>Show less</a>]]></component></ajax-response>`;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html) })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(emptyXml) }),
    );
    const result = await fetchEtfData("IE00B5BMR087");
    expect(result.sectorAllocation).toStrictEqual({});
  });

  it("throws on invalid ISIN format", async () => {
    expect.hasAssertions();
    await expect(fetchEtfData("INVALID")).rejects.toThrow("Invalid ISIN format: INVALID");
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
