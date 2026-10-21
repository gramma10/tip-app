"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/utils";

/**
 * Keeps the staff screen live. With Supabase it listens to Realtime inserts on
 * the user's own tips (RLS-scoped); in demo mode it polls. Announces new tips.
 */
export function LiveRefresh({
  staffId,
  latestTip,
}: {
  staffId: string;
  latestTip: { id: string; amountCents: number } | null;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const seen = useRef(latestTip?.id ?? null);

  useEffect(() => {
    if (latestTip && seen.current && latestTip.id !== seen.current) {
      toast.success(t("me.newTip", { amount: formatMoney(latestTip.amountCents, locale) }));
      if ("vibrate" in navigator) navigator.vibrate?.([12, 60, 12]);
    }
    seen.current = latestTip?.id ?? seen.current;
  }, [latestTip, t, locale]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const id = setInterval(() => router.refresh(), 8000);
      return () => clearInterval(id);
    }
    let cleanup = () => {};
    void import("@/lib/supabase/client").then(({ supabaseBrowser }) => {
      const supabase = supabaseBrowser();
      const channel = supabase
        .channel(`tips-${staffId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "tips", filter: `staff_id=eq.${staffId}` },
          () => router.refresh(),
        )
        .subscribe();
      cleanup = () => void supabase.removeChannel(channel);
    });
    return () => cleanup();
  }, [router, staffId]);

  return null;
}
