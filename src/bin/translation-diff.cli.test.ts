import { diffMessages, sortRows } from "./translation-diff.cli.ts";

describe("diffMessages", () => {
  it("marks a key only in new messages as added", () => {
    expect.hasAssertions();
    const rows = diffMessages({}, { "new-key": "hello" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toStrictEqual({ key: "new-key", status: "added", translation: "hello" });
  });
  it("marks a key only in old messages as deleted, keeping the old translation", () => {
    expect.hasAssertions();
    const rows = diffMessages({ "old-key": "bye" }, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toStrictEqual({ key: "old-key", status: "deleted", translation: "bye" });
  });
  it("marks a key with the same value in both as un-touched", () => {
    expect.hasAssertions();
    const rows = diffMessages({ same: "value" }, { same: "value" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toStrictEqual({ key: "same", status: "un-touched", translation: "value" });
  });
  it("marks a key with a different value as changed, using the new translation", () => {
    expect.hasAssertions();
    const rows = diffMessages({ key: "before" }, { key: "after" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toStrictEqual({ key: "key", status: "changed", translation: "after" });
  });
});

describe("sortRows", () => {
  it("orders rows by status then alphabetically by key", () => {
    expect.hasAssertions();
    const rows = sortRows([
      { key: "b-untouched", status: "un-touched", translation: "b" },
      { key: "a-added", status: "added", translation: "a" },
      { key: "z-deleted", status: "deleted", translation: "z" },
      { key: "m-changed", status: "changed", translation: "m" },
      { key: "a-untouched", status: "un-touched", translation: "a" },
    ]);
    expect(rows.map(row => row.key)).toStrictEqual(["m-changed", "a-added", "z-deleted", "a-untouched", "b-untouched"]);
  });
});
