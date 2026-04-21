import { RouterProvider } from "@tanstack/react-router";
import { invariant } from "es-toolkit";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { router } from "./router.tsx";

const root = document.querySelector<HTMLElement>("#root");
// oxlint-disable-next-line require-hook
invariant(root, "Root element #root not found");
try {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
} catch (error) {
  root.textContent = `Failed to start: ${error instanceof Error ? error.message : String(error)}`;
}
