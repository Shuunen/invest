import { invariant } from "es-toolkit";
import type { Allocation } from "../schemas/index.ts";
import { buildAllocationEntries } from "./allocation-charts.ts";

describe("buildAllocationEntries", () => {
  it("returns undefined for empty allocation", () => {
    expect.hasAssertions();
    const allocation: Allocation = {};
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("returns undefined when all values are zero or undefined", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0, uk: undefined, us: 0 };
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("returns undefined when all values are negative", () => {
    expect.hasAssertions();
    const allocation: Allocation = { us: -0.5 };
    expect(buildAllocationEntries(allocation)).toBeUndefined();
  });

  it("formats keyMapping keys: communicationServices, consumerDiscretionary, consumerStaples", () => {
    expect.hasAssertions();
    const allocation: Allocation = { communicationServices: 0.4, consumerDiscretionary: 0.4, consumerStaples: 0.2 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    const labels = entries.map(entry => entry.label);
    expect(labels).toContain("Communication");
    expect(labels).toContain("Luxury");
    expect(labels).toContain("Basic needs");
  });

  it("formats keyMapping keys: uk, us", () => {
    expect.hasAssertions();
    const allocation: Allocation = { uk: 0.5, us: 0.5 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    const labels = entries.map(entry => entry.label);
    expect(labels).toContain("UK");
    expect(labels).toContain("USA");
  });

  it("uses startCase for keys not in keyMapping", () => {
    expect.hasAssertions();
    const allocation: Allocation = { realEstate: 0.5 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for non-empty allocation");
    expect(entries[0]).toBeDefined();
    invariant(entries[0], "Expected first entry");
    expect(entries[0].label).toBe("Real Estate");
  });

  it("sorts entries by value descending", () => {
    expect.hasAssertions();
    const allocation: Allocation = { asia: 0.3, europe: 0.1, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    invariant(entries[1], "Expected second entry");
    invariant(entries[2], "Expected third entry");
    expect(entries[0].key).toBe("us");
    expect(entries[1].key).toBe("asia");
    expect(entries[2].key).toBe("europe");
  });

  it("assigns colorMap color to known keys", () => {
    expect.hasAssertions();
    const allocation: Allocation = { us: 1 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    expect(entries[0].fill).toBe("var(--color-sky-900)");
  });

  it("assigns fallback color for unknown keys", () => {
    expect.hasAssertions();
    const allocation: Allocation = { unknownCountry: 1 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    invariant(entries[0], "Expected first entry");
    expect(entries[0].fill).toBe("#0072B2");
  });

  it("cycles through fallbackColors for more than 11 entries", () => {
    expect.hasAssertions();
    const allocation: Allocation = {};
    for (let idx = 0; idx < 13; idx += 1) allocation[`unknown${String(idx)}`] = 0.05;
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries for 13-key allocation");
    expect(entries.length).toBeGreaterThanOrEqual(12);
  });

  it("appends Other entry when sum is below 0.95 threshold", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0.3, us: 0.5 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    const other = entries.find(entry => entry.key === "other");
    expect(other).toBeDefined();
    invariant(other, "Expected Other entry");
    expect(other.label).toBe("Other");
    expect(other.value).toBeCloseTo(0.2);
    expect(other.fill).toBe("#777");
  });

  it("does not append Other entry when sum is exactly 0.95", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0.35, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    expect(entries.find(entry => entry.key === "other")).toBeUndefined();
  });

  it("does not append Other entry when sum exceeds 0.95", () => {
    expect.hasAssertions();
    const allocation: Allocation = { europe: 0.4, us: 0.6 };
    const entries = buildAllocationEntries(allocation);
    expect(entries).toBeDefined();
    invariant(entries, "Expected entries");
    expect(entries.find(entry => entry.key === "other")).toBeUndefined();
  });
});
