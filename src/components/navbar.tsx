import { Link } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useAppStore } from "../store/use-app-store.ts";
import { cn } from "../utils/browser-styles";
import { ImportExportButtons } from "./import-export-buttons.tsx";
import { InvestIcon } from "./invest-icon.tsx";
import { ThemeSwitcher } from "./theme-switcher.tsx";

function useNavLinks() {
  const portfolios = useAppStore(state => state.data.portfolios);
  return [
    { id: "assets", label: "Assets", params: {}, title: "All assets available", to: "/" },
    ...portfolios.map(portfolio => ({
      id: portfolio.id,
      label: portfolio.name,
      params: { id: portfolio.id },
      title: `My ${portfolio.name} portfolio`,
      to: "/portfolios/$id",
    })),
    { id: "about", label: "About", to: "/about" },
  ];
}

type NavbarProps = {
  onCreatePortfolio: () => void;
};

export function Navbar({ onCreatePortfolio }: NavbarProps) {
  return (
    <nav className="flex bg-base-100" data-testid="navbar">
      <div className="container mx-auto">
        <div className="relative flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between md:pb-4">
          <div className="flex justify-between">
            <Link to="/" data-testid="navbar-home">
              <div className="flex items-center gap-3 text-2xl font-bold text-base-content transition-colors hover:text-accent" data-testid="logo">
                <InvestIcon /> Invest
              </div>
            </Link>
            <div className="flex gap-2 md:absolute md:right-0" data-testid="navbar-actions">
              <button type="button" className="btn btn-soft btn-sm" aria-label="New portfolio" title="Add portfolio" data-testid="navbar-create-portfolio" onClick={onCreatePortfolio}>
                <PlusCircle size={16} />
              </button>
              <ImportExportButtons />
              <ThemeSwitcher />
            </div>
          </div>
          <ul className="menu menu-horizontal gap-1 self-center px-1" data-testid="navbar-links">
            {useNavLinks().map(link => (
              <li key={link.id} data-testid={`navbar-link-${link.id}`}>
                <Link to={link.to} title={link.title} params={link.params} activeProps={{ className: cn("bg-accent/20 font-bold", "hover:bg-accent/30") }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div data-testid="navbar-actions-placeholder" className="hidden md:block md:w-48" />
        </div>
      </div>
    </nav>
  );
}
