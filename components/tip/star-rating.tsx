"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { haptic } from "./haptics";

export function StarRating({
  value,
  onChange,
  size = 40,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const { t, dict } = useI18n();
  return (
    <div className="flex flex-col items-center">
      <div role="radiogroup" aria-label={t("tip.howWasService")} className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value != null && n <= value;
          return (
            <button
              key={n}
              role="radio"
              aria-checked={value === n}
              aria-label={dict.tip.ratingLabels[n - 1]}
              onClick={() => {
                haptic();
                onChange(n);
              }}
              className="p-1 transition-transform active:scale-85"
            >
              {/* Re-keying the icon (not the button, which keeps focus) replays the bounce. */}
              <span
                key={filled ? value : "off"}
                className={cn("block", filled && "animate-star")}
                style={filled ? { animationDelay: `${(n - 1) * 35}ms` } : undefined}
              >
                <Star
                  size={size}
                  strokeWidth={filled ? 0 : 1.5}
                  className={cn("transition-colors duration-200", filled ? "fill-star text-star" : "text-ink-3")}
                  aria-hidden
                />
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 h-5 text-subhead font-medium text-ink-2" aria-live="polite">
        {value != null && (
          <span key={value} className="block animate-fade-up">
            {dict.tip.ratingLabels[value - 1]}
          </span>
        )}
      </div>
    </div>
  );
}
