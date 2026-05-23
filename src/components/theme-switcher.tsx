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
      <ul className="dropdown-content menu z-50 mt-2 rounded-box bg-base-100 p-2 shadow-md">
        <li className="menu-title px-3 py-2 text-xs whitespace-nowrap uppercase">Light</li>
        {lightThemes.map(themeName => renderThemeOption(themeName, theme, setTheme))}
        <li className="menu-title px-3 py-2 text-xs uppercase">Dark</li>
        {darkThemes.map(themeName => renderThemeOption(themeName, theme, setTheme))}
      </ul>
    </div>
  );
}
