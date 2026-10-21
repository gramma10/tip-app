import Image from "next/image";
import { cn, initials, shade } from "@/lib/utils";

/**
 * Photo when available, otherwise an Apple Contacts–style monogram on the
 * person's colour so every face on a leaderboard is distinct.
 */
export function Avatar({
  name,
  color,
  photoUrl,
  size = 44,
  ring = false,
  className,
}: {
  name: string;
  color: string;
  photoUrl?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        ring && "ring-4 ring-white/90 dark:ring-white/15",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.01em",
        background: `linear-gradient(160deg, ${shade(color, 0.25)} 0%, ${color} 55%, ${shade(color, -0.2)} 100%)`,
      }}
      aria-hidden={!photoUrl}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized={photoUrl.startsWith("data:")}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
