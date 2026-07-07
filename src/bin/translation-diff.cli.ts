/**
 * Compares each locale file's current state against its state at a given commit
 * and generates one .xlsx diff report per locale.
 *
 * Usage:
 *   bun src/bin/translation-diff.cli.ts --files=src/locales/*.ts --commit=251316c --dist=src/locales
 *
 * Or, to preview the report styling without a real diff:
 *   bun src/bin/translation-diff.cli.ts --demo --dist=src/locales
 */
import { execFile, execFileSync } from "node:child_process";
import { globSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { invariant, range } from "es-toolkit";
import ExcelJS from "exceljs";

type LocaleMessages = Record<string, string>;
type RowStatus = "added" | "changed" | "deleted" | "un-touched";
type DiffRow = { key: string; status: RowStatus; translation: string };
type FileDiffContext = { absPath: string; commit: string; distDir: string; repoRoot: string };
type CliArgs = { dist: string; mode: "demo" } | { commit: string; dist: string; filesPattern: string; mode: "diff" };

const demoFileName = "demo.xlsx";
const demoLocale = "demo";

/** Sample rows covering every status, so `--demo` can preview the report styling without a real diff */
const demoRows: DiffRow[] = [
  { key: "action-export", status: "changed", translation: "Export to spreadsheet" },
  { key: "table-new-column", status: "added", translation: "Newly added column header" },
  {
    key: "app-description",
    status: "changed",
    translation: "Long text like this shows off the wrap-text column style.",
  },
  { key: "picker-new-feature", status: "added", translation: "Brand new picker label" },
  { key: "modal-legacy-warning", status: "deleted", translation: "This modal copy no longer exists in the current file" },
  { key: "action-back", status: "un-touched", translation: "Back" },
  { key: "section-old-tab", status: "deleted", translation: "Removed section title" },
  { key: "action-cancel", status: "un-touched", translation: "Cancel" },
  { key: "theme-dark", status: "un-touched", translation: "Dark" },
  { key: "action-import", status: "changed", translation: "Import from file" },
  { key: "theme-light", status: "un-touched", translation: "Light" },
];

const flagPrefixLength = 2;
const cliArgsStartIndex = 2;

/** Most actionable statuses first; alphabetical by key within a status */
const statusSortOrder: Record<RowStatus, number> = { added: 1, changed: 0, deleted: 2, "un-touched": 3 };

const keyColumnWidth = 40;
const translationColumnWidth = 60;
const statusColumnWidth = 14;
const headerRowNumber = 1;
const firstDataRowNumber = 2;
const keyColumnIndex = 1;
const translationColumnIndex = 2;
const statusColumnIndex = 3;

/** Light background tint per status, so scanning the sheet doesn't require reading every cell */
const fillColorByStatus: Record<RowStatus, string> = {
  added: "FFDCF7DC",
  changed: "FFFFF3CD",
  deleted: "FFFADBD8",
  "un-touched": "FFFFFFFF",
};

/** Thin grey border on every side, so adjacent rows stay distinguishable even when they share a fill color */
const cellBorder: ExcelJS.Border = { color: { argb: "FFB7B7B7" }, style: "thin" };

function parseArgs(argv: readonly string[]): CliArgs {
  const flags = new Map(
    argv
      .filter(arg => arg.startsWith("--"))
      .map(arg => {
        const [key, ...rest] = arg.slice(flagPrefixLength).split("=");
        return [key, rest.join("=")];
      }),
  );
  const dist = flags.get("dist");
  invariant(dist, "Missing required --dist=<dir> argument");
  if (flags.has("demo")) return { dist, mode: "demo" };
  const filesPattern = flags.get("files");
  const commit = flags.get("commit");
  invariant(filesPattern, "Missing required --files=<glob> argument (or use --demo)");
  invariant(commit, "Missing required --commit=<hash> argument (or use --demo)");
  return { commit, dist, filesPattern, mode: "diff" };
}

async function loadMessages(absPath: string): Promise<LocaleMessages> {
  const mod = (await import(pathToFileURL(absPath).href)) as { messages?: LocaleMessages };
  invariant(mod.messages, `Expected ${absPath} to export a 'messages' object`);
  return mod.messages;
}

// Tolerant variant for historical content: older revisions may predate the `messages` export entirely.
async function loadMessagesOrEmpty(absPath: string): Promise<LocaleMessages> {
  const mod = (await import(pathToFileURL(absPath).href)) as { messages?: LocaleMessages };
  return mod.messages ?? {};
}

const execFileAsync = promisify(execFile);
const pathNotFoundPatterns = [/does not exist in/u, /exists on disk, but not in/u];

async function readFileAtCommit(repoRoot: string, commit: string, absPath: string): Promise<string | undefined> {
  const relPath = path.relative(repoRoot, absPath);
  try {
    const { stdout } = await execFileAsync("git", ["show", `${commit}:${relPath}`], { cwd: repoRoot, encoding: "utf8" });
    return stdout;
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String(error.stderr) : "";
    if (pathNotFoundPatterns.some(pattern => pattern.test(stderr))) return undefined;
    throw error;
  }
}

export function diffMessages(oldMessages: LocaleMessages, newMessages: LocaleMessages): DiffRow[] {
  const keys = new Set([...Object.keys(oldMessages), ...Object.keys(newMessages)]);
  return [...keys].map(key => {
    const hasOld = key in oldMessages;
    const hasNew = key in newMessages;
    if (hasNew && !hasOld) return { key, status: "added" as const, translation: newMessages[key] };
    if (hasOld && !hasNew) return { key, status: "deleted" as const, translation: oldMessages[key] };
    if (oldMessages[key] === newMessages[key]) return { key, status: "un-touched" as const, translation: newMessages[key] };
    return { key, status: "changed" as const, translation: newMessages[key] };
  });
}

export function sortRows(rows: readonly DiffRow[]): DiffRow[] {
  return rows.toSorted((rowA, rowB) => statusSortOrder[rowA.status] - statusSortOrder[rowB.status] || rowA.key.localeCompare(rowB.key));
}

function applyStatusFills(sheet: ExcelJS.Worksheet, rows: readonly DiffRow[]) {
  for (const [index, row] of rows.entries()) {
    const fillColor = fillColorByStatus[row.status];
    if (fillColor === fillColorByStatus["un-touched"]) continue;
    sheet.getRow(index + firstDataRowNumber).eachCell(cell => {
      cell.fill = { fgColor: { argb: fillColor }, pattern: "solid", type: "pattern" };
    });
  }
}

function applyTableBorders(sheet: ExcelJS.Worksheet, rowCount: number) {
  const lastRowNumber = rowCount + firstDataRowNumber - 1;
  for (const rowNumber of range(headerRowNumber, lastRowNumber + 1))
    sheet.getRow(rowNumber).eachCell(cell => {
      cell.border = { bottom: cellBorder, left: cellBorder, right: cellBorder, top: cellBorder };
    });
}

async function writeReport(rows: readonly DiffRow[], outPath: string, locale: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("diff", { views: [{ state: "frozen", ySplit: headerRowNumber }] });

  sheet.getColumn(keyColumnIndex).width = keyColumnWidth;
  sheet.getColumn(translationColumnIndex).width = translationColumnWidth;
  sheet.getColumn(translationColumnIndex).alignment = { vertical: "top", wrapText: true };
  sheet.getColumn(statusColumnIndex).width = statusColumnWidth;

  sheet.addTable({
    columns: [
      { filterButton: true, name: `key (${locale})` },
      { filterButton: true, name: `translation (${locale})` },
      { filterButton: true, name: "status" },
    ],
    name: "translationDiff",
    ref: "A1",
    rows: rows.map(row => [row.key, row.translation, row.status]),
    style: { showRowStripes: true, theme: "TableStyleMedium9" },
  });
  applyStatusFills(sheet, rows);
  applyTableBorders(sheet, rows.length);

  await workbook.xlsx.writeFile(outPath);
}

async function processFile({ absPath, commit, distDir, repoRoot }: FileDiffContext) {
  const oldSource = await readFileAtCommit(repoRoot, commit, absPath);
  if (oldSource === undefined) console.warn(`Warning: ${path.relative(repoRoot, absPath)} not found at commit ${commit}, treating all keys as added`);

  // Each file gets its own temp directory so concurrent processFile calls never write to the
  // same path or alias each other through the runtime's module cache (which is keyed by resolved
  // file URL, not content).
  const tempDir = mkdtempSync(path.join(tmpdir(), "translation-diff-file-"));
  try {
    const tempPath = path.join(tempDir, path.basename(absPath));
    writeFileSync(tempPath, oldSource ?? "export const messages = {};\n", "utf8");

    const [oldMessages, newMessages] = await Promise.all([loadMessagesOrEmpty(tempPath), loadMessages(absPath)]);
    const rows = sortRows(diffMessages(oldMessages, newMessages));

    const locale = path.basename(absPath, ".ts");
    const outPath = path.join(distDir, `${locale}.xlsx`);
    await writeReport(rows, outPath, locale);
    console.log(`Wrote ${outPath} (${String(rows.length)} keys)`);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(cliArgsStartIndex));
  const distDir = path.resolve(args.dist);
  await mkdir(distDir, { recursive: true });

  if (args.mode === "demo") {
    const outPath = path.join(distDir, demoFileName);
    await writeReport(sortRows(demoRows), outPath, demoLocale);
    console.log(`Wrote ${outPath} (${String(demoRows.length)} sample keys)`);
    return;
  }

  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  try {
    execFileSync("git", ["rev-parse", "--verify", `${args.commit}^{commit}`], { cwd: repoRoot, encoding: "utf8" });
  } catch {
    throw new Error(`Unknown commit: ${args.commit}`);
  }
  const matches = globSync(args.filesPattern).map(match => path.resolve(match));
  invariant(matches.length > 0, `No files matched pattern: ${args.filesPattern}`);

  const locales = matches.map(absPath => path.basename(absPath, ".ts"));
  const duplicateLocale = locales.find((locale, index) => locales.indexOf(locale) !== index);
  invariant(!duplicateLocale, `Multiple matched files would write the same report: ${duplicateLocale}.xlsx`);

  await Promise.all(matches.map(absPath => processFile({ absPath, commit: args.commit, distDir, repoRoot })));
}

if (process.argv[cliArgsStartIndex - 1] === import.meta.filename) await main();
