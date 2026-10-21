"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { sendMagicLink, type MagicLinkState } from "./actions";

export function MagicLinkForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="rounded-card bg-surface p-6 text-center shadow-card">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MailCheck size={26} aria-hidden />
        </span>
        <h2 className="mt-4 text-title-3">{t("login.sentTitle")}</h2>
        <p className="mt-1 text-subhead text-ink-2">{t("login.sentHint", { email: state.email ?? "" })}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="sr-only">{t("login.email")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t("login.email")}
          className="h-14 w-full rounded-[16px] bg-surface px-4 text-body shadow-card placeholder:text-ink-3 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/40"
        />
      </label>
      {state.status === "error" && <p className="px-1 text-footnote text-negative">{t("common.genericError")}</p>}
      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
        {t("login.send")}
      </Button>
    </form>
  );
}
