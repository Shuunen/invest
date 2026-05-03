import { Link, Outlet } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useDexieSync, useHydration } from "./components/asset-table-db.ts";
import { CreatePortfolioModal } from "./components/create-portfolio-modal.tsx";
import { ImportExportButtons } from "./components/import-export-buttons.tsx";
import { InvestIcon } from "./components/invest-icon.tsx";
import { OfflineWarning } from "./components/offline-warning.tsx";
import { setupPwa } from "./pwa.ts";
import { useAppStore } from "./store/use-app-store.ts";
import { cn } from "./utils/browser-styles";

const activeMenuClass = cn("bg-primary/10 font-bold text-primary", "hover:border-primary/50");

function PortfolioNavLinks() {
  const portfolios = useAppStore(state => state.data.portfolios);
  return portfolios.map(portfolio => (
    <li key={portfolio.id}>
      <Link to="/portfolios/$id" title={`My ${portfolio.name} portfolio`} params={{ id: portfolio.id }} activeProps={{ className: activeMenuClass }}>
        {portfolio.name}
      </Link>
    </li>
  ));
}

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

  useEffect(() => {
    setupPwa();
  }, []);

  useHydration(0);
  useDexieSync();
  return (
    <div className="flex min-h-screen flex-col">
      <OfflineWarning isOffline={isOffline} />
      <nav className="navbar sticky top-0 z-50 bg-base-100 px-4 shadow-sm">
        <div className="navbar-start">
          <Link to="/">
            <div className="flex items-center gap-3 text-2xl font-bold text-primary">
              <InvestIcon /> Invest
            </div>
          </Link>
        </div>
        <div className="navbar-center">
          <ul className="menu menu-horizontal gap-1 px-1">
            <li>
              <Link to="/" title="All assets available" activeProps={{ className: activeMenuClass }}>
                Assets
              </Link>
            </li>
            <PortfolioNavLinks />
            <li>
              <Link to="/about" activeProps={{ className: activeMenuClass }}>
                About
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <button type="button" className="btn btn-soft btn-sm btn-primary" aria-label="New portfolio" title="Add portfolio" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={16} />
          </button>
          <ImportExportButtons />
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      {createOpen && <CreatePortfolioModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
