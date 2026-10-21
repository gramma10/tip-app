import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleSlash, Clock } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { TipFlow } from "@/components/tip/tip-flow";
import { StaffIdentity, TipHeader } from "@/components/tip/tip-header";
import { env } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { isLivePayments } from "@/lib/payments";
import { feeConfig, getTipPageContext } from "@/lib/services/tips";

export async function generateMetadata(props: PageProps<"/t/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const ctx = await getTipPageContext(code);
  if (!ctx) return {};
  const who = ctx.state !== "inactive" && ctx.staff ? ctx.staff.displayName : ctx.venue.name;
  return { title: who, robots: { index: false } };
}

export default async function TipPage(props: PageProps<"/t/[code]">) {
  const { code } = await props.params;
  const [ctx, { t, locale }] = await Promise.all([getTipPageContext(code), getI18n()]);
  if (!ctx) notFound();

  if (ctx.state === "ready") {
    return (
      <TipFlow
        code={ctx.card.code}
        venue={ctx.venue}
        staff={ctx.staff}
        team={ctx.team}
        feeConfig={feeConfig}
        publishableKey={isLivePayments ? (env.stripePublishableKey ?? null) : null}
      />
    );
  }

  const staff = ctx.state === "not-ready" ? ctx.staff : null;
  return (
    <div className="min-h-dvh bg-canvas">
      <TipHeader
        color={staff?.color ?? ctx.venue.accentColor}
        venueName={ctx.venue.name}
        topRight={<LanguageToggle tone="onColor" />}
      >
        {staff ? (
          <StaffIdentity
            staff={staff}
            locale={locale}
            newHereLabel={t("common.newHere")}
            reviewsLabel={t("common.reviewsCount", { count: staff.ratingCount })}
          />
        ) : (
          <h1 className="py-6 text-large-title">{ctx.venue.name}</h1>
        )}
      </TipHeader>
      <main className="relative mx-auto -mt-7 max-w-lg rounded-t-sheet bg-canvas px-6 pt-10 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-fill text-ink-2">
          {staff ? <Clock size={26} aria-hidden /> : <CircleSlash size={26} aria-hidden />}
        </span>
        <h2 className="mt-4 text-title-3">{staff ? t("tip.notReadyTitle") : t("tip.inactiveTitle")}</h2>
        <p className="mx-auto mt-2 max-w-xs text-subhead text-ink-2">
          {staff ? t("tip.notReadyHint") : t("tip.inactiveHint")}
        </p>
      </main>
    </div>
  );
}
