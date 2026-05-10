import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { toast } from "react-hot-toast";
import { safeImportJson, type AppData } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles.ts";
import { jsonStringify } from "../utils/json.ts";
import { getStalenessTier, type StalenessTier } from "./import-export-utils.ts";

const isoDateSliceEnd = 10;
const revokeDelayMs = 100;
const isoTimeStart = 11;
const isoTimeEnd = 16;

function renderStalenessDecoration(tier: Exclude<StalenessTier, "1-ok">, unexportedChanges: number) {
  if (tier === "2-low")
    return (
      <span aria-hidden="true" data-testid="staleness-dot" data-staleness-tier={tier} className="pointer-events-none absolute inset-0">
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning shadow-[0_0_0_3px_oklch(var(--b1))]" />
        <span className="absolute -top-2 -right-2 h-4 w-4 animate-ping rounded-full border border-warning/80" />
      </span>
    );

  if (tier === "3-medium" || tier === "4-high")
    return (
      <span
        aria-hidden="true"
        data-testid="staleness-dot"
        data-staleness-tier={tier}
        className={cn("pointer-events-none absolute -top-2 -right-3 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] leading-none font-bold text-white shadow-lg shadow-error/30", {
          "animate-bounce bg-error": tier === "4-high",
          "bg-warning": tier === "3-medium",
        })}
      >
        {unexportedChanges}
      </span>
    );

  return (
    <span aria-hidden="true" data-testid="staleness-dot" data-staleness-tier={tier} className="pointer-events-none absolute top-3 -left-2 animate-bounce">
      <span className="absolute inset-1 rounded-xl bg-error/15 blur-md" />
      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-error shadow-[0_0_18px_var(--color-error)]" />
      <span className="absolute -top-3 -right-3 h-7 w-7 animate-ping rounded-full border-2 border-error/50" />
    </span>
  );
}

function getExportButtonClassName(tier: StalenessTier) {
  const baseClasses = "btn relative overflow-visible transition-all btn-soft btn-sm";
  const tierClasses: Record<StalenessTier, string> = {
    "1-ok": "btn-primary w-9 min-w-9 px-0",
    "2-low": "btn-primary w-9 min-w-9 px-0",
    "3-medium": "btn-warning pr-8 w-12 min-w-12 px-0",
    "4-high": "btn-error animate-pulse pr-4 pl-4",
    "5-critical":
      "btn-error animate-bounce shadow-lg shadow-error/30 before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:content-[''] after:absolute after:inset-x-2 after:bottom-[-0.35rem] after:h-2 after:rounded-full after:bg-error/30 after:blur-md after:content-['']",
  };

  return cn(baseClasses, tierClasses[tier]);
}

function renderExportButtonContent(tier: StalenessTier) {
  if (tier === "4-high" || tier === "5-critical")
    return (
      <>
        <span className="relative z-10 text-[10px] font-bold tracking-[0.12em] uppercase">Export</span>
        <span className="relative z-10">
          <Download size={16} />
        </span>
      </>
    );

  return (
    <span className="relative z-10">
      <Download size={16} />
    </span>
  );
}

function buildExportBlob(data: AppData, now: string): Blob | undefined {
  const exportData = { ...data, settings: { ...data.settings, editCount: 0, lastExportedAt: now } };
  const json = jsonStringify(exportData);
  if (json === undefined) return undefined;
  return new Blob([json], { type: "application/json" });
}

function getExportTitle(unexportedChanges: number): string {
  if (unexportedChanges === 0) return "Export data";
  if (unexportedChanges === 1) return "Export data (1 un-exported change)";
  return `Export data (${unexportedChanges} un-exported changes)`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  /* v8 ignore next */
  setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
}

function useImportExport() {
  const data = useAppStore(state => state.data);
  const loadData = useAppStore(state => state.loadData);
  const setLastExportedAt = useAppStore(state => state.setLastExportedAt);
  const unexportedChanges = data.settings.editCount;
  const stalenessTier = getStalenessTier(unexportedChanges);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const now = new Date().toISOString();
    const datetime = `${now.slice(0, isoDateSliceEnd)} ${now.slice(isoTimeStart, isoTimeEnd).replace(":", "h")}`;
    const blob = buildExportBlob(data, now);
    if (!blob) {
      toast.error("Export failed: could not serialize data.");
      return;
    }
    triggerDownload(blob, `invest-${datetime}.json`);
    setLastExportedAt(now);
    toast.success("Data exported");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const text = reader.result;
      /* v8 ignore next -- readAsText always yields a string on success; null/ArrayBuffer unreachable here */
      if (typeof text !== "string") return;
      const result = safeImportJson(text);
      if ("error" in result) toast.error(result.error);
      else {
        loadData(result.data);
        toast.success("Data imported");
      }
    });
    reader.readAsText(file, "utf8");
    event.target.value = "";
  }

  return { data, fileInputRef, handleExport, handleFileChange, handleImportClick, stalenessTier, unexportedChanges };
}

export function ImportExportButtons() {
  const { data, fileInputRef, handleExport, handleFileChange, handleImportClick, stalenessTier, unexportedChanges } = useImportExport();
  const exportTitle = getExportTitle(unexportedChanges);
  return (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" data-testid="file-input" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
      <button type="button" data-testid="import-button" className="btn btn-soft btn-sm btn-primary" aria-label="Import data" title="Import data" onClick={handleImportClick}>
        <Upload size={16} />
      </button>
      <div className="relative">
        <button
          type="button"
          data-testid="export-button"
          className={getExportButtonClassName(stalenessTier)}
          aria-label={exportTitle}
          title={exportTitle}
          disabled={data.assets.length === 0 && data.portfolios.length === 0}
          onClick={handleExport}
        >
          {renderExportButtonContent(stalenessTier)}
        </button>
        {stalenessTier !== "1-ok" && renderStalenessDecoration(stalenessTier, unexportedChanges)}
      </div>
    </div>
  );
}
