import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { Staff } from "@/lib/types";
import type { Locale } from "@/lib/types";
import { cn, formatMoney, formatRating } from "@/lib/utils";

/** Spotify "top tracks" row: rank, face, name, then the numbers that matter. */
export function LeaderRow({
  rank,
  staff,
  volumeCents,
  avgRating,
  subtitle,
  locale,
  muted,
}: {
  rank: number;
  staff: Staff;
  volumeCents: number;
  avgRating: number | null;
  subtitle: string;
  locale: Locale;
  muted?: boolean;
}) {
  return (
    <Link
      href={`/dashboard/staff/${staff.id}`}
      className={cn("group/row flex items-center gap-3 pl-3 transition-colors active:bg-fill hover:bg-fill/50", muted && "opacity-55")}
    >
      <span className="w-6 text-center text-subhead font-semibold text-ink-3 tabular-nums">{rank}</span>
      <Avatar name={staff.displayName} color={staff.color} photoUrl={staff.photoUrl} size={44} />
      <span className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-headline">{staff.displayName}</span>
          <span className="block truncate text-footnote text-ink-2">{subtitle}</span>
        </span>
        <span className="text-right">
          <span className="block text-headline tabular-nums">{formatMoney(volumeCents, locale)}</span>
          <span className="flex items-center justify-end gap-1 text-footnote text-ink-2 tabular-nums">
            <Star size={11} className="fill-star" strokeWidth={0} aria-hidden />
            {formatRating(avgRating, locale)}
          </span>
        </span>
        <ChevronRight size={18} className="text-ink-3" aria-hidden />
      </span>
    </Link>
  );
}
