import { upperFirst } from "es-toolkit";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { useAppStore } from "../store/use-app-store.ts";
import { darkThemes, lightThemes, type Theme } from "../utils/theme.ts";

function renderThemeOption(themeName: Theme, theme: string, setTheme: (themeName: Theme) => void) {
  return (
    <li key={themeName}>
      <button
        className="flex items-center justify-between"
        data-testid={`theme-option-${themeName}`}
        type="button"
        onClick={() => {
          setTheme(themeName);
        }}
      >
        {upperFirst(themeName)}
        {theme === themeName && <CheckIcon size={14} />}
      </button>
    </li>
  );
}

export function ThemeSwitcher() {
  const theme = useAppStore(state => state.data.settings.theme);
  const setTheme = useAppStore(state => state.setTheme);
  return (
    <div className="dropdown dropdown-end">
      <button aria-label="Switch theme" className="btn btn-soft btn-sm" data-testid="theme-switcher" title="Switch theme" type="button">
        <PaletteIcon size={16} />
      </button>
      <div className="dropdown-content w-64">
        <div className="grid grid-cols-2 gap-x-4">
          <div className="px-3 pt-2 text-xs uppercase opacity-50">Light</div>
          <div className="px-3 pt-2 text-xs uppercase opacity-50">Dark</div>
          <ul className="menu pl-0">{lightThemes.map(themeName => renderThemeOption(themeName, theme, setTheme))}</ul>
          <ul className="menu pl-0">{darkThemes.map(themeName => renderThemeOption(themeName, theme, setTheme))}</ul>
        </div>
      </div>
    </div>
  );
}
