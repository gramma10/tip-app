import { BRAND } from "@/lib/env";
import { cn } from "@/lib/utils";

/** App-icon squircle with a four-point spark: the small "treat" (κέρασμα) a tip stands for. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3D8BFF" />
          <stop offset="1" stopColor="#0047D6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-g)" />
      <path
        d="M16 6.5c.7 4.6 2.9 6.8 7.5 7.5-4.6.7-6.8 2.9-7.5 7.5-.7-4.6-2.9-6.8-7.5-7.5 4.6-.7 6.8-2.9 7.5-7.5Z"
        fill="#fff"
        transform="translate(0 2)"
      />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={28} />
      <span className="text-headline tracking-tight">{BRAND}</span>
    </span>
  );
}
