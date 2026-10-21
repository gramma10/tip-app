import { describe, expect, it } from "vitest";
import { el } from "@/lib/i18n/el";
import { en } from "@/lib/i18n/en";
import { createTranslator, localeFromAcceptLanguage } from "@/lib/i18n/translate";

function keys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("Greek covers every English key", () => {
    expect(keys(el).sort()).toEqual(keys(en).sort());
  });

  it("placeholders match between languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    const t = { en: createTranslator(en), el: createTranslator(el) };
    for (const key of keys(en)) {
      const enValue = t.en(key as never);
      if (enValue === key) continue; // arrays
      // Greek may legitimately drop {name} to avoid gendered articles, but must not invent new ones.
      const elPh = placeholders(t.el(key as never)).split(",").filter(Boolean);
      const enPh = placeholders(enValue).split(",").filter(Boolean);
      for (const p of elPh) expect(enPh, `${key} uses ${p}`).toContain(p);
    }
  });
});

describe("translator", () => {
  it("interpolates variables", () => {
    expect(createTranslator(en)("tip.pay", { amount: "€3.00" })).toBe("Pay €3.00");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("prefers the highest-weighted supported language", () => {
    expect(localeFromAcceptLanguage("el-GR,el;q=0.9,en;q=0.8")).toBe("el");
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("en-US;q=0.5,el;q=0.9")).toBe("el");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});
