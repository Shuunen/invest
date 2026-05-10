import type { EtfPrefillData } from "../../utils/fetch-etf-data.ts";
import { applyEtfPrefill } from "./apply-etf-prefill.ts";
import { emptyFormState, type FormState } from "./form-state.ts";

function makeEmptyPrefill(): EtfPrefillData {
  return {
    fees: undefined,
    geoAllocation: {},
    isAccumulating: undefined,
    name: undefined,
    performance1y: undefined,
    performance3y: undefined,
    performance5y: undefined,
    price: undefined,
    provider: undefined,
    riskReward1y: undefined,
    riskReward3y: undefined,
    riskReward5y: undefined,
    sectorAllocation: {},
    tickers: undefined,
  };
}

function makePatch() {
  const patched: Partial<FormState> = {};
  const patch = (key: keyof FormState, value: FormState[keyof FormState]) => {
    patched[key] = value as never;
  };
  return { patch, patched };
}

describe("applyEtfPrefill — scalar fields", () => {
  it("patches name when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), name: "World ETF" }, patch, emptyFormState);
    expect(patched.name).toBe("World ETF");
  });

  it("does not patch name when undefined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("name");
  });

  it("patches provider when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), provider: "iShares" }, patch, emptyFormState);
    expect(patched.provider).toBe("iShares");
  });

  it("patches price when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), price: "352" }, patch, emptyFormState);
    expect(patched.price).toBe("352");
  });

  it("patches tickers when defined and form has no existing tickers", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), tickers: "SXR8" }, patch, emptyFormState);
    expect(patched.tickers).toBe("SXR8");
  });

  it("deduplicates tickers already present in the form", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), tickers: "AMEA" }, patch, { ...emptyFormState, tickers: "AASI, AMEA" });
    expect(patched.tickers).toBe("AASI, AMEA");
  });

  it("merges and sorts tickers alphabetically", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), tickers: "SWRD" }, patch, { ...emptyFormState, tickers: "AMEA, AASI" });
    expect(patched.tickers).toBe("AASI, AMEA, SWRD");
  });

  it("does not patch tickers when undefined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("tickers");
  });

  it("patches isAccumulating when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), isAccumulating: true }, patch, emptyFormState);
    expect(patched.isAccumulating).toBe(true);
  });

  it("patches isAccumulating false (does not treat false as undefined)", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), isAccumulating: false }, patch, emptyFormState);
    expect(patched.isAccumulating).toBe(false);
  });

  it("patches fees when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), fees: "0.07" }, patch, emptyFormState);
    expect(patched.fees).toBe("0.07");
  });

  it("patches performance1y, performance3y, performance5y when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), performance1y: "26.14", performance3y: "66.54", performance5y: "87.45" }, patch, emptyFormState);
    expect(patched.performance1y).toBe("26.14");
    expect(patched.performance3y).toBe("66.54");
    expect(patched.performance5y).toBe("87.45");
  });

  it("patches riskReward1y, riskReward3y, riskReward5y when defined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), riskReward1y: "2.08", riskReward3y: "1.19", riskReward5y: "0.77" }, patch, emptyFormState);
    expect(patched.riskReward1y).toBe("2.08");
    expect(patched.riskReward3y).toBe("1.19");
    expect(patched.riskReward5y).toBe("0.77");
  });

  it("does not patch performance fields when undefined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("performance1y");
    expect(patched).not.toHaveProperty("performance3y");
    expect(patched).not.toHaveProperty("performance5y");
  });

  it("does not patch riskReward fields when undefined", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("riskReward1y");
    expect(patched).not.toHaveProperty("riskReward3y");
    expect(patched).not.toHaveProperty("riskReward5y");
  });
});

describe("applyEtfPrefill — allocation fields", () => {
  it("patches geoAllocation when non-empty, converting numbers to strings", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), geoAllocation: { japan: 6.2, us: 65.3 } }, patch, emptyFormState);
    expect(patched.geoAllocation).toStrictEqual({ japan: "6.2", us: "65.3" });
  });

  it("does not patch geoAllocation when empty", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("geoAllocation");
  });

  it("patches sectorAllocation when non-empty, converting numbers to strings", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill({ ...makeEmptyPrefill(), sectorAllocation: { financials: 10.38, technology: 33.9 } }, patch, emptyFormState);
    expect(patched.sectorAllocation).toStrictEqual({ financials: "10.38", technology: "33.9" });
  });

  it("does not patch sectorAllocation when empty", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    applyEtfPrefill(makeEmptyPrefill(), patch, emptyFormState);
    expect(patched).not.toHaveProperty("sectorAllocation");
  });

  it("filters out undefined values within geoAllocation entries", () => {
    expect.hasAssertions();
    const { patch, patched } = makePatch();
    // TypeScript cast to simulate runtime partial undefined values
    applyEtfPrefill({ ...makeEmptyPrefill(), geoAllocation: { japan: undefined as unknown as number, us: 65.3 } }, patch, emptyFormState);
    expect(patched.geoAllocation).toStrictEqual({ us: "65.3" });
    expect(patched.geoAllocation).not.toHaveProperty("japan");
  });
});
