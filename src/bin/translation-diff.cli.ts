/**
 * Compares each locale file's current state against its state at a given commit
 * and generates one .xlsx diff report per locale.
 *
 * Usage:
 *   bun src/bin/translation-diff.cli.ts --files=src/locales/*.ts --commit=251316c --dist=src/locales
 */
import { execFileSync } from "node:child_process";
import { globSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { invariant } from "es-toolkit";
import ExcelJS from "exceljs";

type LocaleMessages = Record<string, string>;
type RowStatus = "added" | "changed" | "deleted" | "un-touched";
type DiffRow = { key: string; status: RowStatus; translation: string };
type FileDiffContext = { absPath: string; commit: string; distDir: string; repoRoot: string; tempDir: string };

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

function parseArgs(argv: readonly string[]) {
  const flags = new Map(
    argv
      .filter(arg => arg.startsWith("--"))
      .map(arg => {
        const [key, ...rest] = arg.slice(flagPrefixLength).split("=");
        return [key, rest.join("=")];
      }),
  );
  const filesPattern = flags.get("files");
  const commit = flags.get("commit");
  const dist = flags.get("dist");
  invariant(filesPattern, "Missing required --files=<glob> argument");
  invariant(commit, "Missing required --commit=<hash> argument");
  invariant(dist, "Missing required --dist=<dir> argument");
  return { commit, dist, filesPattern };
}

async function loadMessages(absPath: string): Promise<LocaleMessages> {
  const mod = (await import(pathToFileURL(absPath).href)) as { messages: LocaleMessages };
  return mod.messages;
}

function readFileAtCommit(repoRoot: string, commit: string, absPath: string): string | undefined {
  const relPath = path.relative(repoRoot, absPath);
  try {
    return execFileSync("git", ["show", `${commit}:${relPath}`], { cwd: repoRoot, encoding: "utf8" });
  } catch {
    return undefined;
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

async function writeReport(rows: readonly DiffRow[], outPath: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("diff", { views: [{ state: "frozen", ySplit: headerRowNumber }] });

  sheet.getColumn(keyColumnIndex).width = keyColumnWidth;
  sheet.getColumn(translationColumnIndex).width = translationColumnWidth;
  sheet.getColumn(translationColumnIndex).alignment = { vertical: "top", wrapText: true };
  sheet.getColumn(statusColumnIndex).width = statusColumnWidth;

  sheet.addTable({
    columns: [
      { filterButton: true, name: "key" },
      { filterButton: true, name: "translation" },
      { filterButton: true, name: "status" },
    ],
    name: "translationDiff",
    ref: "A1",
    rows: rows.map(row => [row.key, row.translation, row.status]),
    style: { showRowStripes: true, theme: "TableStyleMedium9" },
  });
  applyStatusFills(sheet, rows);

  await workbook.xlsx.writeFile(outPath);
}

async function processFile({ absPath, commit, distDir, repoRoot, tempDir }: FileDiffContext) {
  const oldSource = readFileAtCommit(repoRoot, commit, absPath);
  if (oldSource === undefined) console.warn(`Warning: ${path.relative(repoRoot, absPath)} not found at commit ${commit}, treating all keys as added`);
  const tempPath = path.join(tempDir, path.basename(absPath));
  writeFileSync(tempPath, oldSource ?? "export const messages = {};\n", "utf8");

  const [oldMessages, newMessages] = await Promise.all([loadMessages(tempPath), loadMessages(absPath)]);
  const rows = sortRows(diffMessages(oldMessages, newMessages));

  const outPath = path.join(distDir, `${path.basename(absPath, ".ts")}.xlsx`);
  await writeReport(rows, outPath);
  console.log(`Wrote ${outPath} (${String(rows.length)} keys)`);
}

async function main() {
  const { commit, dist, filesPattern } = parseArgs(process.argv.slice(cliArgsStartIndex));
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const matches = globSync(filesPattern).map(match => path.resolve(match));
  invariant(matches.length > 0, `No files matched pattern: ${filesPattern}`);

  const distDir = path.resolve(dist);
  await mkdir(distDir, { recursive: true });

  const tempDir = mkdtempSync(path.join(tmpdir(), "translation-diff-"));
  try {
    await Promise.all(matches.map(absPath => processFile({ absPath, commit, distDir, repoRoot, tempDir })));
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

if (process.argv[cliArgsStartIndex - 1] === import.meta.filename) await main();
