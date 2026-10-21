"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "../types";
import type { Dictionary } from "./en";
import { createTranslator, type Translate } from "./translate";

type I18nValue = { locale: Locale; dict: Dictionary; t: Translate };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict, t: createTranslator(dict) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
