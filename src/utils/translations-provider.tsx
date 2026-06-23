import { useEffect, useMemo, useState, type ReactNode } from "react";
import { messages as en } from "../locales/en.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { TranslationContext } from "./translations.ts";

type Messages = typeof en;

const localeLoaders: Partial<Record<string, () => Promise<{ messages: Messages }>>> = {
  fr: () => import("../locales/fr.ts") as unknown as Promise<{ messages: Messages }>,
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore(state => state.data.settings.locale);
  const setLocale = useAppStore(state => state.setLocale);
  const [messages, setMessages] = useState<Messages>(en);

  useEffect(() => {
    async function main() {
      const loader = localeLoaders[locale];
      if (!loader) {
        console.info(`no loader found for locale "${locale}", falling back to "en"`);
        setMessages(en);
        return;
      }
      const data = await loader();
      console.info(`loaded locale "${locale}"`);
      setMessages(data.messages);
    }
    void main();
  }, [locale]);

  const value = useMemo(() => ({ locale, messages, setLocale }), [locale, messages, setLocale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}
