import { RouterProvider } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router.tsx";
import "./index.css";
import { TranslationProvider } from "./utils/translations-provider.tsx";

const root = document.querySelector<HTMLElement>("#root");
// oxlint-disable-next-line require-hook
invariant(root, "Root element #root not found");
try {
  createRoot(root).render(
    <StrictMode>
      <TranslationProvider>
        <RouterProvider router={router} />
      </TranslationProvider>
    </StrictMode>,
  );
} catch (error) {
  root.textContent = `Failed to start : ${error instanceof Error ? error.message : String(error)}`;
}
