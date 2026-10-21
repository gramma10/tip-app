import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "../types";
import {
  createTranslator,
  dictionaries,
  isLocale,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
} from "./translate";

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

export async function getI18n() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return { locale, dict, t: createTranslator(dict) };
}
