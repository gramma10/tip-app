import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import type { Locale } from "./types";

// Teach tailwind-merge our type-scale utilities, so `text-title-2 text-ink-2` keeps both.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "large-title", "title-1", "title-2", "title-3", "headline", "body",
            "callout", "subhead", "footnote", "caption", "money-hero",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const intlLocale: Record<Locale, string> = { el: "el-GR", en: "en-IE" };

export function formatMoney(cents: number, locale: Locale, opts: { compact?: boolean } = {}) {
  const value = cents / 100;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: opts.compact && whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRating(rating: number | null, locale: Locale) {
  if (rating == null) return "–";
  return new Intl.NumberFormat(intlLocale[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale[locale]).format(n);
}

export function formatRelativeTime(iso: string, locale: Locale, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function formatDay(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Short, unambiguous, URL-safe codes for QR/NFC cards (no 0/o/1/l/i). */
export function generateCode(length = 7) {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function googleReviewUrl(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/** Mixes a hex colour with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
