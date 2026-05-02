import type { EtfPrefillData } from "../../utils/fetch-etf-data.ts";
import { applyEtfPrefill } from "./apply-etf-prefill.ts";
import type { FormState } from "./form-state.ts";

function makeEmptyPrefill(): EtfPrefillData {
  return {
    fees: undefined,
    geoAllocation: {},
    isAccumulating: undefined,
    name: undefined,
    performance1y: undefined,
    performance3y: undefined,
    performance5y: undefined,
    provider: undefined,
    riskReward1y: undefined,
    riskReward3y: undefined,
    riskReward5y: undefined,
    sectorAllocation: {},
    tickers: undefined,
  };
}

describe("applyEtfPrefill — scalar fields", () => {
  it("patches name when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), name: "World ETF" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.name).toBe("World ETF");
  });

  it("does not patch name when undefined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill(makeEmptyPrefill(), (key, value) => {
      patched[key] = value as never;
    });
    expect(patched).not.toHaveProperty("name");
  });

  it("patches provider when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), provider: "iShares" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.provider).toBe("iShares");
  });

  it("patches tickers when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), tickers: "SXR8" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.tickers).toBe("SXR8");
  });

  it("patches isAccumulating when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), isAccumulating: true }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.isAccumulating).toBe(true);
  });

  it("patches isAccumulating false (does not treat false as undefined)", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), isAccumulating: false }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.isAccumulating).toBe(false);
  });

  it("patches fees when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), fees: "0.07" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.fees).toBe("0.07");
  });

  it("patches performance1y, performance3y, performance5y when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), performance1y: "26.14", performance3y: "66.54", performance5y: "87.45" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.performance1y).toBe("26.14");
    expect(patched.performance3y).toBe("66.54");
    expect(patched.performance5y).toBe("87.45");
  });

  it("patches riskReward1y, riskReward3y, riskReward5y when defined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), riskReward1y: "2.08", riskReward3y: "1.19", riskReward5y: "0.77" }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.riskReward1y).toBe("2.08");
    expect(patched.riskReward3y).toBe("1.19");
    expect(patched.riskReward5y).toBe("0.77");
  });

  it("does not patch performance fields when undefined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill(makeEmptyPrefill(), (key, value) => {
      patched[key] = value as never;
    });
    expect(patched).not.toHaveProperty("performance1y");
    expect(patched).not.toHaveProperty("performance3y");
    expect(patched).not.toHaveProperty("performance5y");
  });

  it("does not patch riskReward fields when undefined", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill(makeEmptyPrefill(), (key, value) => {
      patched[key] = value as never;
    });
    expect(patched).not.toHaveProperty("riskReward1y");
    expect(patched).not.toHaveProperty("riskReward3y");
    expect(patched).not.toHaveProperty("riskReward5y");
  });
});

describe("applyEtfPrefill — allocation fields", () => {
  it("patches geoAllocation when non-empty, converting numbers to strings", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), geoAllocation: { japan: 6.2, us: 65.3 } }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.geoAllocation).toStrictEqual({ japan: "6.2", us: "65.3" });
  });

  it("does not patch geoAllocation when empty", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill(makeEmptyPrefill(), (key, value) => {
      patched[key] = value as never;
    });
    expect(patched).not.toHaveProperty("geoAllocation");
  });

  it("patches sectorAllocation when non-empty, converting numbers to strings", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill({ ...makeEmptyPrefill(), sectorAllocation: { financials: 10.38, technology: 33.9 } }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.sectorAllocation).toStrictEqual({ financials: "10.38", technology: "33.9" });
  });

  it("does not patch sectorAllocation when empty", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    applyEtfPrefill(makeEmptyPrefill(), (key, value) => {
      patched[key] = value as never;
    });
    expect(patched).not.toHaveProperty("sectorAllocation");
  });

  it("filters out undefined values within geoAllocation entries", () => {
    expect.hasAssertions();
    const patched: Partial<FormState> = {};
    // TypeScript cast to simulate runtime partial undefined values
    applyEtfPrefill({ ...makeEmptyPrefill(), geoAllocation: { japan: undefined as unknown as number, us: 65.3 } }, (key, value) => {
      patched[key] = value as never;
    });
    expect(patched.geoAllocation).toStrictEqual({ us: "65.3" });
    expect(patched.geoAllocation).not.toHaveProperty("japan");
  });
});
