"use client";

import { cn } from "@/lib/utils";

/** iOS toggle. Uses a real checkbox for keyboard and screen-reader support. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-[31px] w-[51px] shrink-0", className)}>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="peer absolute inset-0 z-10 cursor-pointer appearance-none rounded-full"
      />
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-200",
          checked ? "bg-positive" : "bg-fill-strong",
          "peer-focus-visible:outline-3 peer-focus-visible:outline-brand/60 peer-focus-visible:outline-offset-2",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]",
          "transition-transform duration-300 ease-spring",
          checked && "translate-x-5",
        )}
        aria-hidden
      />
    </span>
  );
}
