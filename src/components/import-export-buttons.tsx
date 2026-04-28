import { Download, Upload, X } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { safeImportJson, type AppData } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";

const JSON_INDENT = 2;
const ISO_DATE_SLICE_END = 10;

function buildExportBlob(data: AppData, now: string): Blob {
  const exportData = { ...data, settings: { ...data.settings, lastExportedAt: now } };
  return new Blob([JSON.stringify(exportData, undefined, JSON_INDENT)], { type: "application/json" });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function useImportExport() {
  const data = useAppStore(state => state.data);
  const loadData = useAppStore(state => state.loadData);
  const setLastExportedAt = useAppStore(state => state.setLastExportedAt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | undefined>(undefined);

  function handleExport() {
    const now = new Date().toISOString();
    // datetime should be YYYY-MM-DD HHhmm
    // oxlint-disable-next-line no-magic-numbers
    const datetime = `${now.toLocaleString().slice(0, ISO_DATE_SLICE_END).replace("T", " ")} ${now.slice(11, 16).replace(":", "h")}`;
    triggerDownload(buildExportBlob(data, now), `invest-${datetime}.json`);
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
  }

  return { data, dismissError, fileInputRef, handleExport, handleFileChange, handleImportClick, importError };
}

export function ImportExportButtons() {
  const { data, dismissError, fileInputRef, handleExport, handleFileChange, handleImportClick, importError } = useImportExport();
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <button type="button" className="btn btn-soft btn-sm btn-primary" aria-label="Import data" title="Import data" onClick={handleImportClick}>
          <Upload size={16} />
        </button>
        <button type="button" className="btn btn-soft btn-sm btn-primary" aria-label="Export data" title="Export data" disabled={data.assets.length === 0} onClick={handleExport}>
          <Download size={16} />
        </button>
      </div>
      {importError !== undefined && (
        <div role="alert" className="alert px-3 py-1 text-sm alert-error">
          <span>{importError}</span>
          <button type="button" className="btn btn-ghost btn-xs" aria-label="Dismiss error" onClick={dismissError}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
