import { invariant } from "es-toolkit";
import { createContext, useContext, useMemo } from "react";
import type { messages as en } from "../locales/en.ts";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = "en" as const satisfies Locale;

type Messages = typeof en;
type MessageKey = Exclude<keyof Messages, "$schema">;
type ExtractPlaceholders<Type extends string> = Type extends `${string}{${infer Param}}${infer Rest}` ? Param | ExtractPlaceholders<Rest> : never;
type Placeholders<Key extends MessageKey> = ExtractPlaceholders<Messages[Key] & string>;
type IsPlural<Key extends MessageKey> = Messages[Key] extends `${string} | ${string}` ? true : false;
type TranslateArgs<Key extends MessageKey> = [Placeholders<Key>] extends [never] ? (IsPlural<Key> extends true ? [params: { count: number }] : [params?: undefined]) : [params: Record<Placeholders<Key>, string | number>];
type TranslationContextValue = {
  locale: Locale;
  messages: Record<keyof Messages, string>;
  setLocale: (code: Locale) => void;
};

export const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replaceAll(/\{(?<name>\w+)\}/gu, (_match, name: string) => (name in params ? String(params[name]) : /* v8 ignore next */ `{${name}}`));
}

export function selectPlural(template: string, count: number): string {
  const variants = template.split(" | ") as Array<string | undefined>;
  const [zero, one, many] = variants;
  if (zero === undefined || one === undefined) return template;
  if (count === 0) return zero;
  if (count === 1) return one;
  invariant(many, `invalid plural template "${template}"`);
  return many;
}

export function createTranslate(messages: Record<MessageKey, string>) {
  return <Key extends MessageKey>(key: Key, ...args: TranslateArgs<Key>): string => {
    const template = messages[key];
    const [params] = args;
    if (!params) return template;
    const paramsRecord = params as Record<string, string | number>;
    if (!template.includes(" | ")) return interpolate(template, paramsRecord);
    const keys = Object.keys(paramsRecord);
    invariant("count" in paramsRecord || keys.length === 1, `plural key "${key}" with multiple interpolations requires a "count" variable`);
    const countValue = "count" in paramsRecord ? Number(paramsRecord.count) : Number(paramsRecord[keys[0]]);
    return interpolate(selectPlural(template, countValue), paramsRecord);
  };
}

export type Translate = ReturnType<typeof createTranslate>;

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used inside <TranslationProvider>");
  const { locale, messages, setLocale } = ctx;
  const translate = useMemo(() => createTranslate(messages), [messages]);
  return { locale, messages, setLocale, translate };
}
