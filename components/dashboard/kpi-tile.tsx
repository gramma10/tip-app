import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Stat tile: label, value, optional signed delta vs the previous period. Up is good for every KPI here. */
export function KpiTile({
  label,
  value,
  delta,
  deltaLabel,
  caption,
}: {
  label: string;
  value: ReactNode;
  delta?: { text: string; direction: "up" | "down" | "flat" } | null;
  deltaLabel?: string;
  caption?: string;
}) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-card lg:p-5">
      <div className="text-footnote font-medium text-ink-2">{label}</div>
      <div className="mt-1 text-title-1">{value}</div>
      {delta ? (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-footnote font-medium",
            delta.direction === "up" ? "text-positive" : delta.direction === "down" ? "text-negative" : "text-ink-2",
          )}
          title={deltaLabel}
        >
          {delta.direction === "up" && <TrendingUp size={14} aria-hidden />}
          {delta.direction === "down" && <TrendingDown size={14} aria-hidden />}
          <span>{delta.text}</span>
          {deltaLabel && <span className="sr-only">{deltaLabel}</span>}
        </div>
      ) : (
        caption && <div className="mt-1.5 text-footnote text-ink-3">{caption}</div>
      )}
    </div>
  );
}

export function percentDelta(value: number | null, locale: "el" | "en") {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const text = `${pct > 0 ? "+" : ""}${new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE").format(pct)}%`;
  return { text, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" } as const;
}

export function ratingDelta(value: number | null, locale: "el" | "en") {
  if (value == null) return null;
  const rounded = Math.round(value * 10) / 10 || 0; // `|| 0` turns -0 into 0
  const text = `${rounded > 0 ? "+" : ""}${new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE", { minimumFractionDigits: 1 }).format(rounded)}`;
  return { text, direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat" } as const;
}
