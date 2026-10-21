import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star row. Partial stars aren't shown; ratings are rounded to the nearest whole star. */
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          className={i <= filled ? "fill-star" : "fill-fill-strong"}
          aria-hidden
        />
      ))}
    </span>
  );
}
