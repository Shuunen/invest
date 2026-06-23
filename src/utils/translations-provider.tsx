import { invariant } from "es-toolkit";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { messages as en } from "../locales/en.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { TranslationContext } from "./translations.ts";

type Messages = Record<keyof typeof en, string>;

const localeLoaders: Record<string, () => Promise<{ messages: Messages }>> = {
  en: () => Promise.resolve({ messages: en }),
  fr: () => import("../locales/fr.ts"),
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore(state => state.data.settings.locale);
  const setLocale = useAppStore(state => state.setLocale);
  const [messages, setMessages] = useState<Messages>(en);

  useEffect(() => {
    async function main() {
      console.info(`locale changed to "${locale}"`);
      const loader = localeLoaders[locale];
      invariant(loader, `no loader found for locale "${locale}"`);
      const data = await loader();
      console.info(`loaded locale "${locale}"`);
      setMessages(data.messages);
    }
    void main();
  }, [locale]);

  const value = useMemo(() => ({ locale, messages, setLocale }), [locale, messages, setLocale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}
