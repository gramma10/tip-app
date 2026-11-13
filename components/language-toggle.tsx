"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className, tone = "default" }: { className?: string; tone?: "default" | "onColor" }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "el" ? "en" : "el";
  return (
    <button
      onClick={() =>
        start(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      disabled={pending}
      aria-label={next === "el" ? "Ελληνικά" : "English"}
      className={cn(
        "h-8 rounded-full px-3 text-footnote font-semibold transition hover:-translate-y-0.5 active:scale-95",
        tone === "onColor" ? "bg-white/18 text-white backdrop-blur-md" : "glass-button text-ink",
        className,
      )}
    >
      {next === "el" ? "ΕΛ" : "EN"}
    </button>
  );
}
