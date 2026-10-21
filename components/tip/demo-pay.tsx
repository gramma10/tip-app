"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/utils";
import type { PayHandlers } from "./pay-types";

/** Stand-in for Apple Pay / Google Pay while Stripe isn't configured. Shaped like the real button. */
export function DemoPay({ totalCents, disabled, createTip, onPaid }: PayHandlers) {
  const { t, locale } = useI18n();
  const [paying, setPaying] = useState(false);

  if (disabled || totalCents == null) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("tip.chooseAmount")}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full !bg-black !text-white disabled:!opacity-100 dark:!bg-white dark:!text-black"
      disabled={paying}
      aria-busy={paying}
      onClick={async () => {
        setPaying(true);
        const tip = await createTip();
        if (tip) onPaid(tip);
        else setPaying(false);
      }}
    >
      {paying ? (
        <span className="animate-pulse">{t("tip.processing")}</span>
      ) : (
        <>
          <Wallet size={20} aria-hidden />
          {t("tip.pay", { amount: formatMoney(totalCents, locale) })}
        </>
      )}
    </Button>
  );
}
