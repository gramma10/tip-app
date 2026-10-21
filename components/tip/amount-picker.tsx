"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn, formatMoney } from "@/lib/utils";
import { haptic } from "./haptics";

// Most guests tap a preset, so the keypad sheet (and its drawer library) loads on first use.
const CustomAmountSheet = dynamic(() => import("./custom-amount-sheet"), { ssr: false });

/** The hero of the page: one big number, three preset chips and "Other". */
export function AmountPicker({
  presets,
  value,
  onChange,
}: {
  presets: number[];
  value: number | null;
  onChange: (cents: number) => void;
}) {
  const { t, locale } = useI18n();
  const [customOpen, setCustomOpen] = useState(false);
  const [customMounted, setCustomMounted] = useState(false);
  const isCustom = value != null && !presets.includes(value);

  return (
    <div>
      <div className="flex h-[76px] items-center justify-center" aria-live="polite">
        <span
          key={value ?? "empty"}
          className={cn("text-money-hero", value == null ? "text-ink-3" : "animate-pop-in")}
        >
          {formatMoney(value ?? 0, locale, { compact: true })}
        </span>
      </div>

      <div role="radiogroup" aria-label={t("tip.chooseAmount")} className="mt-4 grid grid-cols-4 gap-2">
        {presets.map((cents) => (
          <Chip
            key={cents}
            selected={value === cents}
            onClick={() => {
              haptic();
              onChange(cents);
            }}
          >
            {formatMoney(cents, locale, { compact: true })}
          </Chip>
        ))}
        <Chip
          selected={isCustom}
          onClick={() => {
            setCustomMounted(true);
            setCustomOpen(true);
          }}
        >
          {isCustom ? formatMoney(value, locale, { compact: true }) : t("tip.other")}
        </Chip>
      </div>

      {customMounted && (
        <CustomAmountSheet
          open={customOpen}
          onOpenChange={setCustomOpen}
          initial={isCustom ? value : null}
          onConfirm={(cents) => {
            haptic();
            onChange(cents);
            setCustomOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "h-[60px] rounded-[16px] text-headline tabular-nums",
        "transition-[transform,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.94]",
        selected ? "scale-[1.03] bg-primary text-primary-fg shadow-card" : "bg-fill text-ink",
      )}
    >
      {children}
    </button>
  );
}
