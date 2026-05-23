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
    <nav className="flex grow items-end bg-base-100">
      <div className="container mx-auto">
        <div className="flex items-center py-4">
          <Link to="/">
            <div className="flex items-center gap-3 text-2xl font-bold text-base-content transition-colors hover:text-accent" data-testid="logo">
              <InvestIcon /> Invest
            </div>
          </Link>
          <ul className="menu menu-horizontal ml-auto gap-1 px-1">
            {useNavLinks().map(link => (
              <li key={link.id}>
                <Link to={link.to} title={link.title} params={link.params} activeProps={{ className: cn("bg-accent/20 font-bold", "hover:bg-accent/30") }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn btn-soft btn-sm" aria-label="New portfolio" title="Add portfolio" onClick={onCreatePortfolio}>
              <PlusCircle size={16} />
            </button>
            <ImportExportButtons />
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
