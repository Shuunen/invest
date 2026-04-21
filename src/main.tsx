import { invariant } from "es-toolkit";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app.tsx";

const root = document.querySelector<HTMLElement>("#root");
// oxlint-disable-next-line require-hook
invariant(root, "Root element #root not found");
try {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  root.textContent = `Failed to start: ${error instanceof Error ? error.message : String(error)}`;
}
