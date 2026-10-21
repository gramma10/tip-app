import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { PublicStaff } from "@/lib/services/tips";
import type { Locale } from "@/lib/types";
import { formatRating, shade } from "@/lib/utils";

/**
 * Spotify-style header: the person's own colour floods the top of the page,
 * so every waiter's page feels like theirs.
 */
export function TipHeader({
  color,
  venueName,
  topRight,
  children,
}: {
  color: string;
  venueName: string;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden pt-safe text-white"
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${shade(color, 0.12)} 0%, ${color} 45%, ${shade(color, -0.45)} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-3">
        <span className="truncate rounded-full bg-black/15 px-3 py-1.5 text-footnote font-semibold backdrop-blur-md">
          {venueName}
        </span>
        {topRight}
      </div>
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 pt-3 pb-11 text-center">{children}</div>
    </header>
  );
}

export function StaffIdentity({
  staff,
  locale,
  newHereLabel,
  reviewsLabel,
  trailing,
}: {
  staff: PublicStaff;
  locale: Locale;
  newHereLabel: string;
  reviewsLabel: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <Avatar name={staff.displayName} color={shade(staff.color, -0.1)} photoUrl={staff.photoUrl} size={88} ring />
      <h1 className="mt-3 text-large-title">{staff.displayName}</h1>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-subhead font-medium">
        {staff.roleLabel && <span className="rounded-full bg-white/15 px-2.5 py-1">{staff.roleLabel}</span>}
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
          {staff.avgRating != null ? (
            <>
              <Star size={13} className="fill-white" strokeWidth={0} aria-hidden />
              {formatRating(staff.avgRating, locale)}
              <span className="ml-1 text-white/70">{reviewsLabel}</span>
            </>
          ) : (
            newHereLabel
          )}
        </span>
        {trailing}
      </div>
    </>
  );
}
