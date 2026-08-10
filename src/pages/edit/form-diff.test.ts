import { invariant, startCase } from "es-toolkit";
import { countries, sectors } from "../../schemas/asset.ts";
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
  it("resets a comments diff row to its initial value", () => {
    expect.hasAssertions();
    const initialForm = makeFormState({ comments: "Initial note" });
    const currentForm = makeFormState({ comments: "Changed note" });
    const rows = buildDiffRows(initialForm, currentForm);
    const commentsRow = rows.find(row => row.field === "Comments");
    expect(commentsRow).toBeDefined();
    invariant(commentsRow, "Expected Comments row to exist");
    const resetForm = commentsRow.reset(currentForm, initialForm);
    expect(resetForm.comments).toBe("Initial note");
  });

  it("resets an availableForPea diff row to its initial value", () => {
    expect.hasAssertions();
    const initialForm = makeFormState({ availableForPea: false });
    const currentForm = makeFormState({ availableForPea: true });
    const rows = buildDiffRows(initialForm, currentForm);
    const peaRow = rows.find(row => row.field === "Available For Pea");
    expect(peaRow).toBeDefined();
    invariant(peaRow, "Expected Available For Pea row to exist");
    const resetForm = peaRow.reset(currentForm, initialForm);
    expect(resetForm.availableForPea).toBe(false);
  });

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
      geoAllocation: { [geoKey]: "20" },
      sectorAllocation: { [sectorKey]: "10" },
    });
    const currentForm = makeFormState({
      geoAllocation: { [geoKey]: "35" },
      sectorAllocation: { [sectorKey]: "45" },
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
      geoAllocation: { [geoKey]: "35" },
      sectorAllocation: { [sectorKey]: "45" },
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
