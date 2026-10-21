import { Stars } from "@/components/ui/stars";
import type { Locale } from "@/lib/types";
import { formatNumber, formatRating } from "@/lib/utils";

/** App Store–style summary: big average, star row, and a 5→1 distribution. */
export function RatingSummary({
  distribution,
  locale,
  countLabel,
}: {
  distribution: number[];
  locale: Locale;
  countLabel: string;
}) {
  const total = distribution.reduce((s, n) => s + n, 0);
  const avg = total ? distribution.reduce((s, n, i) => s + n * (i + 1), 0) / total : null;
  const max = Math.max(1, ...distribution);
  return (
    <div className="flex items-center gap-6 rounded-card bg-surface p-5 shadow-card">
      <div className="text-center">
        <div className="text-[52px] leading-none font-bold tracking-[-0.03em]">{formatRating(avg, locale)}</div>
        {avg != null && <Stars value={avg} size={14} className="mt-2" />}
        <div className="mt-1 text-footnote text-ink-2">{countLabel}</div>
      </div>
      <ul className="flex-1 space-y-1.5" aria-label="Rating distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution[star - 1] ?? 0;
          return (
            <li key={star} className="flex items-center gap-2 text-caption text-ink-2">
              <span className="w-2 tabular-nums">{star}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
                <span className="block h-full rounded-full bg-ink-2" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums">{formatNumber(n, locale)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
