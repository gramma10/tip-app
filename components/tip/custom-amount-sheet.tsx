"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { MAX_TIP_CENTS, MIN_TIP_CENTS } from "@/lib/fees";
import { useI18n } from "@/lib/i18n/client";
import { cn, formatMoney } from "@/lib/utils";
import { haptic } from "./haptics";

const DELETE = "⌫";

/** Apple Cash–style keypad: digits append, one decimal separator, max two decimals. */
export default function CustomAmountSheet({
  open,
  onOpenChange,
  initial,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: number | null;
  onConfirm: (cents: number) => void;
}) {
  const { t, locale } = useI18n();
  const sep = locale === "el" ? "," : ".";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", sep, "0", DELETE];
  const fromCents = (c: number | null) => (c ? String(c / 100).replace(".", sep) : "");

  const [raw, setRaw] = useState(() => fromCents(initial));
  // Start fresh every time the sheet opens (adjusting state during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setRaw(fromCents(initial));
  }

  const toCents = (s: string) => (s ? Math.round(Number(s.replace(sep, ".")) * 100) : 0);
  const cents = toCents(raw);
  const valid = cents >= MIN_TIP_CENTS && cents <= MAX_TIP_CENTS;

  function press(key: string) {
    haptic(6);
    setRaw((prev) => {
      if (key === DELETE) return prev.slice(0, -1);
      if (key === sep) return prev.includes(sep) ? prev : (prev || "0") + sep;
      const [, dec] = prev.split(sep);
      if (dec != null && dec.length >= 2) return prev;
      if (prev === "0") return key;
      const next = prev + key;
      return toCents(next) > MAX_TIP_CENTS ? prev : next;
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("tip.customTitle")}
      description={t("tip.customHint", {
        min: formatMoney(MIN_TIP_CENTS, locale, { compact: true }),
        max: formatMoney(MAX_TIP_CENTS, locale, { compact: true }),
      })}
    >
      <div className="py-4 text-center">
        <span className={cn("text-money-hero", !raw && "text-ink-3")}>
          {raw ? (locale === "el" ? `${raw} €` : `€${raw}`) : formatMoney(0, locale, { compact: true })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === DELETE ? "Delete" : k}
            className="h-14 rounded-[14px] text-title-2 font-medium transition active:scale-95 active:bg-fill"
          >
            {k}
          </button>
        ))}
      </div>
      <Button
        size="lg"
        className="mt-4 mb-2 w-full"
        disabled={!valid}
        onClick={() => onConfirm(cents)}
      >
        {valid ? t("tip.customConfirm", { amount: formatMoney(cents, locale) }) : t("tip.chooseAmount")}
      </Button>
    </Sheet>
  );
}
