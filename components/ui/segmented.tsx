"use client";

import * as m from "motion/react-m";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** iOS segmented control with a sliding thumb. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-[10px] bg-fill p-[2px]", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative h-8 flex-1 rounded-[8px] px-3 text-footnote font-semibold transition-colors",
              active ? "text-ink" : "text-ink-2",
            )}
          >
            {active && (
              <m.span
                layoutId={`seg-${id}`}
                className="glass-thumb absolute inset-0 rounded-[8px]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
