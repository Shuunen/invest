import { invariant, startCase } from "es-toolkit";
import { countries, sectors } from "../../schemas/index.ts";
import { buildDiffRows } from "./form-diff.ts";
import { emptyFormState, type FormState } from "./form-state.ts";

function makeFormState(overrides: Partial<FormState>): FormState {
  return {
    ...emptyFormState,
    ...overrides,
    geoAllocation: { ...emptyFormState.geoAllocation, ...overrides.geoAllocation },
    sectorAllocation: { ...emptyFormState.sectorAllocation, ...overrides.sectorAllocation },
  };
}

describe("buildDiffRows", () => {
  it("resets a scalar diff row to its initial value", () => {
    expect.hasAssertions();
    const initialForm = makeFormState({ name: "Initial Name" });
    const currentForm = makeFormState({ name: "Changed Name" });

    const rows = buildDiffRows(initialForm, currentForm);
    const nameRow = rows.find(row => row.field === "Name");

    expect(nameRow).toBeDefined();
    invariant(nameRow, "Expected Name row to exist");
    const resetForm = nameRow.reset(currentForm, initialForm);
    expect(resetForm.name).toBe("Initial Name");
  });

  it("resets geo and sector allocation diff rows to their initial values", () => {
    expect.hasAssertions();
    const [geoKey] = countries;
    const [sectorKey] = sectors;

    invariant(geoKey, "Expected at least one country key");
    invariant(sectorKey, "Expected at least one sector key");

    const initialForm = makeFormState({
      geoAllocation: { [geoKey]: "20" } as FormState["geoAllocation"],
      sectorAllocation: { [sectorKey]: "10" } as FormState["sectorAllocation"],
    });
    const currentForm = makeFormState({
      geoAllocation: { [geoKey]: "35" } as FormState["geoAllocation"],
      sectorAllocation: { [sectorKey]: "45" } as FormState["sectorAllocation"],
    });

    const rows = buildDiffRows(initialForm, currentForm);
    const geoRow = rows.find(row => row.field === `Geo ${startCase(geoKey)} (%)`);
    const sectorRow = rows.find(row => row.field === `Sector ${startCase(sectorKey)} (%)`);

    invariant(geoRow, "Expected geo allocation row to exist");
    invariant(sectorRow, "Expected sector allocation row to exist");

    const withGeoReset = geoRow.reset(currentForm, initialForm);
    const withSectorReset = sectorRow.reset(currentForm, initialForm);

    expect(withGeoReset.geoAllocation[geoKey]).toBe("20");
    expect(withSectorReset.sectorAllocation[sectorKey]).toBe("10");
  });

  it("resets allocation rows to empty string when initial allocation is missing", () => {
    expect.hasAssertions();
    const [geoKey] = countries;
    const [sectorKey] = sectors;

    invariant(geoKey, "Expected at least one country key");
    invariant(sectorKey, "Expected at least one sector key");

    const initialForm = makeFormState({ geoAllocation: {}, sectorAllocation: {} });
    const currentForm = makeFormState({
      geoAllocation: { [geoKey]: "35" } as FormState["geoAllocation"],
      sectorAllocation: { [sectorKey]: "45" } as FormState["sectorAllocation"],
    });

    const rows = buildDiffRows(initialForm, currentForm);
    const geoRow = rows.find(row => row.field === `Geo ${startCase(geoKey)} (%)`);
    const sectorRow = rows.find(row => row.field === `Sector ${startCase(sectorKey)} (%)`);

    invariant(geoRow, "Expected geo allocation row to exist");
    invariant(sectorRow, "Expected sector allocation row to exist");

    const withGeoReset = geoRow.reset(currentForm, initialForm);
    const withSectorReset = sectorRow.reset(currentForm, initialForm);

    expect(withGeoReset.geoAllocation[geoKey]).toBe("");
    expect(withSectorReset.sectorAllocation[sectorKey]).toBe("");
  });
});
