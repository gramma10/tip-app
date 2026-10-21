import type { Locale } from "../types";
import { en, type Dictionary } from "./en";
import { el } from "./el";

export const dictionaries: Record<Locale, Dictionary> = { en, el };
export const LOCALES: Locale[] = ["el", "en"];
export const LOCALE_COOKIE = "locale";

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<Dictionary>;
export type TVars = Record<string, string | number>;
export type Translate = (key: TKey, vars?: TVars) => string;

export function createTranslator(dict: Dictionary): Translate {
  return (key, vars) => {
    let value: unknown = dict;
    for (const part of key.split(".")) value = (value as Record<string, unknown>)?.[part];
    if (typeof value !== "string") return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
  };
}

export function isLocale(value: unknown): value is Locale {
  return value === "el" || value === "en";
}

/** Greek if the browser prefers Greek anywhere in its list before English; otherwise English. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag!.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    if (tag.startsWith("el")) return "el";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}
