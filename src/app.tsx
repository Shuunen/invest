import { Link, Outlet } from "@tanstack/react-router";
import { ImportExportButtons } from "./components/import-export-buttons.tsx";
import { cn } from "./utils/browser-styles";

const activeMenuClass = cn("bg-primary/10 font-bold text-primary", "hover:border-primary/50");

export function App() {
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
              <Link to="/" activeProps={{ className: activeMenuClass }}>
                Assets
              </Link>
            </li>
            <li>
              <Link to="/about" activeProps={{ className: activeMenuClass }}>
                About
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <ImportExportButtons />
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
