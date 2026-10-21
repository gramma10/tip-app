"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function RangeControl({ value, className }: { value: 7 | 30 | 90; className?: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  return (
    <Segmented
      label="Range"
      value={String(value) as "7" | "30" | "90"}
      className={cn("w-full sm:w-72", pending && "opacity-70", className)}
      options={(["7", "30", "90"] as const).map((v) => ({ value: v, label: dict.dash.ranges[v] }))}
      onChange={(v) => {
        const next = new URLSearchParams(params);
        next.set("range", v);
        start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
      }}
    />
  );
}
