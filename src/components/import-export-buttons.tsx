import { Download, Upload, X } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { safeImportJson, type AppData } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { jsonStringify } from "../utils/json.ts";

const ISO_DATE_SLICE_END = 10;
const REVOKE_DELAY_MS = 100;
const ISO_TIME_START = 11;
const ISO_TIME_END = 16;

function buildExportBlob(data: AppData, now: string): Blob | undefined {
  const exportData = { ...data, settings: { ...data.settings, lastExportedAt: now } };
  const json = jsonStringify(exportData);
  if (json === undefined) return undefined;
  return new Blob([json], { type: "application/json" });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  /* v8 ignore next */
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

function useImportExport() {
  const data = useAppStore(state => state.data);
  const loadData = useAppStore(state => state.loadData);
  const setLastExportedAt = useAppStore(state => state.setLastExportedAt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [exportError, setExportError] = useState<string | undefined>(undefined);

  function handleExport() {
    const now = new Date().toISOString();
    const datetime = `${now.slice(0, ISO_DATE_SLICE_END)} ${now.slice(ISO_TIME_START, ISO_TIME_END).replace(":", "h")}`;
    const blob = buildExportBlob(data, now);
    if (!blob) {
      setExportError("Export failed: could not serialize data.");
      return;
    }
    triggerDownload(blob, `invest-${datetime}.json`);
    setLastExportedAt(now);
  }

  function handleImportClick() {
    setImportError(undefined);
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
      if ("error" in result) setImportError(result.error);
      else loadData(result.data);
    });
    reader.readAsText(file, "utf8");
    event.target.value = "";
  }

  function dismissError() {
    setImportError(undefined);
    setExportError(undefined);
  }

  return { data, dismissError, exportError, fileInputRef, handleExport, handleFileChange, handleImportClick, importError };
}

export function ImportExportButtons() {
  const { data, dismissError, exportError, fileInputRef, handleExport, handleFileChange, handleImportClick, importError } = useImportExport();
  const displayError = importError ?? exportError;
  const errorTestId = importError === undefined ? "export-error" : "import-error";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" data-testid="file-input" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <button type="button" data-testid="import-button" className="btn btn-soft btn-sm btn-primary" aria-label="Import data" title="Import data" onClick={handleImportClick}>
          <Upload size={16} />
        </button>
        <button type="button" data-testid="export-button" className="btn btn-soft btn-sm btn-primary" aria-label="Export data" title="Export data" disabled={data.assets.length === 0 && data.portfolios.length === 0} onClick={handleExport}>
          <Download size={16} />
        </button>
      </div>
      {displayError !== undefined && (
        <div role="alert" data-testid={errorTestId} className="alert px-3 py-1 text-sm alert-error">
          <span>{displayError}</span>
          <button type="button" data-testid="dismiss-error-button" className="btn btn-ghost btn-xs" aria-label="Dismiss error" onClick={dismissError}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
