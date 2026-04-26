import { Link, Outlet } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useHydration } from "./components/asset-table-db.ts";
import { CreatePortfolioModal } from "./components/create-portfolio-modal.tsx";
import { ImportExportButtons } from "./components/import-export-buttons.tsx";
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

export function App() {
  const [createOpen, setCreateOpen] = useState(false);
  useHydration(0);
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="navbar sticky top-0 z-50 border-b border-base-200 bg-base-100 px-4 shadow-sm">
        <div className="navbar-start">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            📈 Invest
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
