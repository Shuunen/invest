import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { invariant, range } from "es-toolkit";
import ExcelJS from "exceljs";
import { diffMessages, sortRows } from "./translation-diff.cli.ts";

const cliPath = path.join(import.meta.dirname, "translation-diff.cli.ts");
const demoRowCount = 11;
const preI18nCommit = "6bf64e3";

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

describe("cli --commit", () => {
  // Regression: ISSUE-001 — an unknown commit hash was silently swallowed and treated
  // as "file absent at that commit", reporting every key as added instead of failing.
  // Found by /qa on 2026-07-07
  it("fails loudly when --commit points at a hash that does not exist", () => {
    expect.hasAssertions();
    const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
    try {
      expect(() =>
        execFileSync("bun", [cliPath, "--files=src/locales/*.ts", "--commit=deadbeef", `--dist=${distDir}`], {
          encoding: "utf8",
          stdio: "pipe",
        }),
      ).toThrow(/Unknown commit: deadbeef/u);
    } finally {
      rmSync(distDir, { force: true, recursive: true });
    }
  });
});

describe("cli --demo", () => {
  it("writes a valid demo.xlsx with the sample rows", async () => {
    expect.hasAssertions();
    const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
    try {
      execFileSync("bun", [cliPath, "--demo", `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" });
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path.join(distDir, "demo.xlsx"));
      const sheet = workbook.getWorksheet("diff");
      invariant(sheet, "expected a 'diff' worksheet in demo.xlsx");
      expect(sheet.rowCount).toBe(demoRowCount + 1);
      expect(sheet.getRow(1).getCell(1).value).toBe("key (demo)");
      expect(sheet.getRow(2).getCell(3).value).toBe("changed");
    } finally {
      rmSync(distDir, { force: true, recursive: true });
    }
  });
});

describe("cli --files (real diff mode)", () => {
  it("writes one xlsx per matched locale file with the diffed rows", async () => {
    expect.hasAssertions();
    const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
    try {
      execFileSync("bun", [cliPath, "--files=src/locales/en.ts", `--commit=${preI18nCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" });
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path.join(distDir, "en.xlsx"));
      const sheet = workbook.getWorksheet("diff");
      invariant(sheet, "expected a 'diff' worksheet in en.xlsx");
      expect(sheet.rowCount).toBeGreaterThan(1);
      expect(sheet.getRow(1).getCell(1).value).toBe("key (en)");
      // en.ts did not exist at preI18nCommit, so every current key must show as "added"
      const statuses = new Set<unknown>();
      for (const rowNumber of range(2, sheet.rowCount + 1)) statuses.add(sheet.getRow(rowNumber).getCell(3).value);
      expect(statuses).toStrictEqual(new Set(["added"]));
    } finally {
      rmSync(distDir, { force: true, recursive: true });
    }
  });
});

describe("cli argument validation", () => {
  it("fails loudly when --dist is missing", () => {
    expect.hasAssertions();
    expect(() => execFileSync("bun", [cliPath, "--demo"], { encoding: "utf8", stdio: "pipe" })).toThrow(/Missing required --dist=<dir> argument/u);
  });
  it("fails loudly when --files is missing in diff mode", () => {
    expect.hasAssertions();
    const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
    try {
      expect(() => execFileSync("bun", [cliPath, `--commit=${preI18nCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" })).toThrow(/Missing required --files=<glob> argument/u);
    } finally {
      rmSync(distDir, { force: true, recursive: true });
    }
  });
  it("fails loudly when --files matches no file", () => {
    expect.hasAssertions();
    const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
    try {
      expect(() => execFileSync("bun", [cliPath, "--files=src/locales/nope-*.ts", `--commit=${preI18nCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" })).toThrow(/No files matched pattern/u);
    } finally {
      rmSync(distDir, { force: true, recursive: true });
    }
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
