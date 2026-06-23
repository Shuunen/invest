import { invariant } from "es-toolkit";
import { locales, useTranslation, type Locale } from "../utils/translations.ts";

function nextLocale(current: string): Locale {
  const idx = locales.indexOf(current as Locale);
  const next = locales[(idx + 1) % locales.length];
  invariant(next, "nextLocale: index out of bounds");
  return next;
}

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  const next = nextLocale(locale);
  return (
    <button
      aria-label="Switch language"
      className="btn btn-soft btn-sm"
      data-testid="locale-switcher"
      title={`Switch to ${next.toUpperCase()}`}
      type="button"
      onClick={() => {
        setLocale(next);
      }}
    >
      <span className="text-xs font-semibold uppercase">{locale}</span>
    </button>
  );
}
