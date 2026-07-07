import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { invariant, range } from "es-toolkit";
import { diffMessages, loadExcelJs, sortRows } from "./translation-diff.cli.ts";

const cliPath = path.join(import.meta.dirname, "translation-diff.cli.ts");
const demoRowCount = 11;
const preI18nCommit = "6bf64e3";
const preInterpolationFixCommit = "d146678^";

async function withTempDistDir<Result>(run: (distDir: string) => Promise<Result> | Result): Promise<Result> {
  const distDir = mkdtempSync(path.join(tmpdir(), "translation-diff-test-"));
  try {
    return await run(distDir);
  } finally {
    rmSync(distDir, { force: true, recursive: true });
  }
}

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
  it("returns no rows when both old and new messages are empty", () => {
    expect.hasAssertions();
    expect(diffMessages({}, {})).toStrictEqual([]);
  });
});

describe("cli --commit", () => {
  // Regression: ISSUE-001 — an unknown commit hash was silently swallowed and treated
  // as "file absent at that commit", reporting every key as added instead of failing.
  // Found by /qa on 2026-07-07
  it("fails loudly when --commit points at a hash that does not exist", async () => {
    expect.hasAssertions();
    await withTempDistDir(distDir => {
      expect(() =>
        execFileSync("bun", [cliPath, "--files=src/locales/*.ts", "--commit=deadbeef", `--dist=${distDir}`], {
          encoding: "utf8",
          stdio: "pipe",
        }),
      ).toThrow(/Unknown commit: deadbeef/u);
    });
  });
});

describe("cli --demo", () => {
  it("writes a valid demo.xlsx with the sample rows", async () => {
    expect.hasAssertions();
    await withTempDistDir(async distDir => {
      execFileSync("bun", [cliPath, "--demo", `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" });
      const ExcelJS = await loadExcelJs();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path.join(distDir, "demo.xlsx"));
      const sheet = workbook.getWorksheet("diff");
      invariant(sheet, "expected a 'diff' worksheet in demo.xlsx");
      expect(sheet.rowCount).toBe(demoRowCount + 1);
      expect(sheet.getRow(1).getCell(1).value).toBe("key (demo)");
      expect(sheet.getRow(2).getCell(3).value).toBe("changed");
    });
  });
});

describe("cli --files (real diff mode)", () => {
  it("writes one xlsx per matched locale file with the diffed rows", async () => {
    expect.hasAssertions();
    await withTempDistDir(async distDir => {
      execFileSync("bun", [cliPath, "--files=src/locales/en.ts", `--commit=${preI18nCommit}`, `--dist=${distDir}`], {
        encoding: "utf8",
        stdio: "pipe",
      });
      const ExcelJS = await loadExcelJs();
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
    });
  });
  it("diffs against real prior content from git history and marks edited keys as changed", async () => {
    expect.hasAssertions();
    await withTempDistDir(async distDir => {
      execFileSync("bun", [cliPath, "--files=src/locales/en.ts", `--commit=${preInterpolationFixCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" });
      const ExcelJS = await loadExcelJs();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path.join(distDir, "en.xlsx"));
      const sheet = workbook.getWorksheet("diff");
      invariant(sheet, "expected a 'diff' worksheet in en.xlsx");
      const rowsByKey = new Map<unknown, unknown>();
      for (const rowNumber of range(2, sheet.rowCount + 1)) {
        const row = sheet.getRow(rowNumber);
        rowsByKey.set(row.getCell(1).value, row.getCell(3).value);
      }
      // "export-un-exported" and "picker-split-equally" had their interpolation variable
      // renamed between preInterpolationFixCommit and HEAD, so they must show as "changed".
      expect(rowsByKey.get("export-un-exported")).toBe("changed");
      expect(rowsByKey.get("picker-split-equally")).toBe("changed");
      // "action-back" was untouched by that rename, so it must show as "un-touched".
      expect(rowsByKey.get("action-back")).toBe("un-touched");
    });
  });
  it("writes one xlsx per matched file when the glob matches several locales", async () => {
    expect.hasAssertions();
    await withTempDistDir(distDir => {
      execFileSync("bun", [cliPath, "--files=src/locales/*.ts", `--commit=${preI18nCommit}`, `--dist=${distDir}`], {
        encoding: "utf8",
        stdio: "pipe",
      });
      const output = execFileSync("ls", [distDir], { encoding: "utf8" }).trim().split("\n");
      expect(output.toSorted()).toStrictEqual(["en.xlsx", "fr.xlsx"]);
    });
  });
  it("fails loudly instead of silently overwriting one report with another when two matched files share a locale basename", async () => {
    expect.hasAssertions();
    // Regression: adversarial review found that two matched files with the same basename in
    // different directories would silently overwrite each other's report (and even alias each
    // other's content via the module cache), with zero error signal.
    const repoRoot = path.join(import.meta.dirname, "..", "..");
    const dupDirA = mkdtempSync(path.join(repoRoot, "src", "locales", "tmp-dup-a-"));
    const dupDirB = mkdtempSync(path.join(repoRoot, "src", "locales", "tmp-dup-b-"));
    try {
      writeFileSync(path.join(dupDirA, "en.ts"), 'export const messages = { k: "a" };\n', "utf8");
      writeFileSync(path.join(dupDirB, "en.ts"), 'export const messages = { k: "b" };\n', "utf8");
      await withTempDistDir(distDir => {
        expect(() => execFileSync("bun", [cliPath, `--files=${path.join(repoRoot, "src", "locales", "tmp-dup-*", "en.ts")}`, `--commit=${preI18nCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" })).toThrow(
          /Multiple matched files would write the same report: en\.xlsx/u,
        );
      });
    } finally {
      rmSync(dupDirA, { force: true, recursive: true });
      rmSync(dupDirB, { force: true, recursive: true });
    }
  });
  it("fails with a descriptive error when a matched file has no messages export", async () => {
    expect.hasAssertions();
    // The broken file must live inside the repo (not a system tempdir) so `git show` can resolve
    // a relative path for it and the failure actually exercises the loadMessages invariant,
    // rather than "path is outside repository" from readFileAtCommit.
    const repoRoot = path.join(import.meta.dirname, "..", "..");
    const badDir = mkdtempSync(path.join(repoRoot, "src", "locales", "tmp-test-"));
    try {
      await withTempDistDir(distDir => {
        writeFileSync(path.join(badDir, "broken.ts"), "export const notMessages = {};\n", "utf8");
        expect(() =>
          execFileSync("bun", [cliPath, `--files=${path.join(badDir, "*.ts")}`, `--commit=${preI18nCommit}`, `--dist=${distDir}`], {
            encoding: "utf8",
            stdio: "pipe",
          }),
        ).toThrow(/Expected .* to export a 'messages' object/u);
      });
    } finally {
      rmSync(badDir, { force: true, recursive: true });
    }
  });
});

describe("cli argument validation", () => {
  it("fails loudly when --dist is missing", () => {
    expect.hasAssertions();
    expect(() => execFileSync("bun", [cliPath, "--demo"], { encoding: "utf8", stdio: "pipe" })).toThrow(/Missing required --dist=<dir> argument/u);
  });
  it("fails loudly when --files is missing in diff mode", async () => {
    expect.hasAssertions();
    await withTempDistDir(distDir => {
      expect(() => execFileSync("bun", [cliPath, `--commit=${preI18nCommit}`, `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" })).toThrow(/Missing required --files=<glob> argument/u);
    });
  });
  it("fails loudly when --files matches no file", async () => {
    expect.hasAssertions();
    await withTempDistDir(distDir => {
      expect(() =>
        execFileSync("bun", [cliPath, "--files=src/locales/nope-*.ts", `--commit=${preI18nCommit}`, `--dist=${distDir}`], {
          encoding: "utf8",
          stdio: "pipe",
        }),
      ).toThrow(/No files matched pattern/u);
    });
  });
  it("fails loudly when --commit is missing in diff mode", async () => {
    expect.hasAssertions();
    await withTempDistDir(distDir => {
      expect(() => execFileSync("bun", [cliPath, "--files=src/locales/*.ts", `--dist=${distDir}`], { encoding: "utf8", stdio: "pipe" })).toThrow(/Missing required --commit=<hash> argument/u);
    });
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
  it("returns an empty array unchanged", () => {
    expect.hasAssertions();
    expect(sortRows([])).toStrictEqual([]);
  });
  it("returns a single-element array unchanged", () => {
    expect.hasAssertions();
    const rows = [{ key: "solo", status: "added" as const, translation: "alone" }];
    expect(sortRows(rows)).toStrictEqual(rows);
  });
});
