import { Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useDexieSync, useHydration } from "./components/asset-table-db.ts";
import { CreatePortfolioModal } from "./components/create-portfolio-modal.tsx";
import { Navbar } from "./components/navbar.tsx";
import { OfflineWarning } from "./components/offline-warning.tsx";
import { setupPwa } from "./pwa.ts";
import { useAppStore } from "./store/use-app-store.ts";
import { useThemeColorSync } from "./utils/theme.ts";

function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(() => !globalThis.navigator.onLine);

  useEffect(() => {
    const markOffline = () => setIsOffline(true);
    const markOnline = () => setIsOffline(false);
    globalThis.addEventListener("offline", markOffline);
    globalThis.addEventListener("online", markOnline);
    return () => {
      globalThis.removeEventListener("offline", markOffline);
      globalThis.removeEventListener("online", markOnline);
    };
  }, []);

  return isOffline;
}

export function App() {
  const [createOpen, setCreateOpen] = useState(false);
  const isOffline = useOfflineStatus();
  const theme = useAppStore(state => state.data.settings.theme);
  useEffect(setupPwa, []);
  useThemeColorSync(theme);
  useHydration(0);
  useDexieSync();
  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <OfflineWarning isOffline={isOffline} />
      <Navbar onCreatePortfolio={() => setCreateOpen(true)} />
      <main className="flex h-full grow flex-col">
        <Outlet />
      </main>
      {createOpen && <CreatePortfolioModal onClose={() => setCreateOpen(false)} />}
      <Toaster />
    </div>
  );
}
