"use client";

import { Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n/client";
import type { PublicStaff } from "@/lib/services/tips";
import { formatRating } from "@/lib/utils";
import { haptic } from "./haptics";

/** Spotify "artists" grid: big round faces, name underneath. */
export function StaffPicker({ team, onPick }: { team: PublicStaff[]; onPick: (s: PublicStaff) => void }) {
  const { t, locale } = useI18n();
  return (
    <section aria-labelledby="picker-title">
      <h2 id="picker-title" className="text-center text-title-2">
        {t("tip.whoServedYou")}
      </h2>
      <p className="mt-1 text-center text-subhead text-ink-2">{t("tip.whoServedYouHint")}</p>
      <ul className="mt-8 grid grid-cols-3 gap-x-3 gap-y-6">
        {team.map((s, i) => (
          <li key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <button
              onClick={() => {
                haptic();
                onPick(s);
              }}
              className="flex w-full flex-col items-center gap-2 rounded-[18px] p-1 transition active:scale-95"
            >
              <Avatar name={s.displayName} color={s.color} photoUrl={s.photoUrl} size={84} />
              <span className="w-full truncate text-subhead font-semibold">{s.displayName}</span>
              <span className="-mt-1.5 inline-flex items-center gap-1 text-footnote text-ink-2">
                {s.avgRating != null ? (
                  <>
                    <Star size={11} className="fill-star" strokeWidth={0} aria-hidden />
                    {formatRating(s.avgRating, locale)}
                  </>
                ) : (
                  s.roleLabel
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
