"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { startTipAction, confirmTipAction } from "@/app/t/[code]/actions";
import { LanguageToggle } from "@/components/language-toggle";
import { Switch } from "@/components/ui/switch";
import { computeTipBreakdown, COVER_FEES_BY_DEFAULT, type FeeConfig } from "@/lib/fees";
import { useI18n } from "@/lib/i18n/client";
import type { PublicStaff, PublicVenue } from "@/lib/services/tips";
import { formatMoney } from "@/lib/utils";
import { AmountPicker } from "./amount-picker";
import { DemoPay } from "./demo-pay";
import type { CreatedTip, PayHandlers } from "./pay-types";
import { StaffPicker } from "./staff-picker";
import { StarRating } from "./star-rating";
import { StaffIdentity, TipHeader } from "./tip-header";

// Stripe.js only loads when live payments are on, keeping the demo page tiny.
const StripePay = dynamic(() => import("./stripe-pay"), {
  ssr: false,
  loading: () => <div className="h-[112px] animate-pulse rounded-[16px] bg-fill" />,
});

export function TipFlow({
  code,
  venue,
  staff: fixedStaff,
  team,
  feeConfig,
  publishableKey,
}: {
  code: string;
  venue: PublicVenue;
  staff: PublicStaff | null;
  team: PublicStaff[];
  feeConfig: FeeConfig;
  /** Present when live Stripe payments are enabled. */
  publishableKey: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [picked, setPicked] = useState<PublicStaff | null>(null);
  const staff = fixedStaff ?? picked;
  const [amount, setAmount] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [coverFees, setCoverFees] = useState(COVER_FEES_BY_DEFAULT);

  const breakdown = amount != null ? computeTipBreakdown(amount, coverFees, feeConfig) : null;
  const coverAmount = amount != null ? computeTipBreakdown(amount, true, feeConfig).feeCoverCents : 0;

  async function createTip(): Promise<CreatedTip | null> {
    if (!staff || amount == null) return null;
    const res = await startTipAction({
      code,
      staffId: staff.id,
      amountCents: amount,
      coverFees,
      rating,
      comment: comment.trim() || null,
    });
    if (!res.ok) {
      toast.error(res.error === "rate_limited" ? t("tip.tooManyAttempts") : t("tip.paymentFailed"));
      return null;
    }
    if (res.provider === "demo") await confirmTipAction({ tipId: res.tipId, token: res.token });
    const thanksUrl = `${window.location.origin}/t/${code}/thanks?tip=${encodeURIComponent(res.tipId)}&k=${encodeURIComponent(res.token)}`;
    return { tipId: res.tipId, token: res.token, clientSecret: res.clientSecret, thanksUrl };
  }

  const handlers: PayHandlers = {
    totalCents: breakdown?.totalCents ?? null,
    disabled: !staff || amount == null,
    createTip,
    onPaid: (tip) => router.push(new URL(tip.thanksUrl).pathname + new URL(tip.thanksUrl).search),
    onError: (message) => toast.error(message),
  };

  const headerColor = staff?.color ?? venue.accentColor;
  const reviewsLabel = (s: PublicStaff) =>
    s.ratingCount === 1 ? t("common.reviewsOne") : t("common.reviewsCount", { count: s.ratingCount });

  return (
    <div className="min-h-dvh bg-canvas">
      <TipHeader
        color={headerColor}
        venueName={staff ? venue.name : (venue.city ?? venue.name)}
        topRight={<LanguageToggle tone="onColor" />}
      >
        <div key={staff?.id ?? "venue"} className="flex animate-fade-up flex-col items-center">
            {staff ? (
              <StaffIdentity
                staff={staff}
                locale={locale}
                newHereLabel={t("common.newHere")}
                reviewsLabel={reviewsLabel(staff)}
                trailing={
                  !fixedStaff && (
                    <button
                      onClick={() => setPicked(null)}
                      className="rounded-full bg-white px-2.5 py-1 text-black transition active:scale-95"
                    >
                      {t("common.back")}
                    </button>
                  )
                }
              />
            ) : (
              <h1 className="py-6 text-large-title">{venue.name}</h1>
            )}
        </div>
      </TipHeader>

      <main className="relative mx-auto -mt-7 max-w-lg rounded-t-sheet bg-canvas px-5 pt-7 pb-52">
        {!staff ? (
          <StaffPicker team={team} onPick={setPicked} />
        ) : (
          <>
            <section aria-label={t("tip.leaveTip")}>
              <h2 className="text-center text-subhead font-semibold text-ink-2">{t("tip.leaveTip")}</h2>
              <AmountPicker presets={venue.tipPresets} value={amount} onChange={setAmount} />
            </section>

            <section className="mt-10" aria-label={t("tip.howWasService")}>
              <h2 className="mb-3 text-center text-headline">{t("tip.howWasService")}</h2>
              <StarRating value={rating} onChange={setRating} />
              {rating != null && (
                <div className="animate-fade-up">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder={rating >= 4 ? t("tip.commentPlaceholderHigh") : t("tip.commentPlaceholderLow")}
                      className="mt-4 block w-full resize-none rounded-[16px] bg-fill px-4 py-3 text-body placeholder:text-ink-3 focus:ring-2 focus:ring-brand/35 focus:outline-none focus:ring-inset"
                    />
                </div>
              )}
            </section>

            {amount != null && (
                <label className="mt-8 flex animate-fade-up cursor-pointer items-center gap-4 rounded-card bg-surface p-4 shadow-card">
                  <span className="min-w-0 flex-1">
                    <span className="block text-callout font-semibold">
                      {t("tip.coverFees", { fee: formatMoney(coverAmount, locale) })}
                    </span>
                    <span className="mt-0.5 block text-footnote text-ink-2">
                      {t("tip.coverFeesHint", { name: staff.displayName, amount: formatMoney(amount, locale) })}
                    </span>
                  </span>
                  <Switch checked={coverFees} onCheckedChange={setCoverFees} label={t("tip.coverFees", { fee: formatMoney(coverAmount, locale) })} />
                </label>
              )}

            <p className="mt-8 text-center text-footnote text-ink-3">
              {publishableKey ? t("tip.secure") : t("tip.demoNotice")}
            </p>
          </>
        )}
      </main>

      {staff && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-canvas/85 pb-safe shadow-bar backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto max-w-lg px-5 pt-3">
            {publishableKey ? <StripePay {...handlers} publishableKey={publishableKey} /> : <DemoPay {...handlers} />}
          </div>
        </div>
      )}
    </div>
  );
}
