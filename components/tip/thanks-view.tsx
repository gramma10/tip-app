"use client";

import { LockKeyhole, Star, X } from "lucide-react";
import { animate, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { googleClickAction, saveReviewAction } from "@/app/t/[code]/actions";
import { LanguageToggle } from "@/components/language-toggle";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { postTipPrompts } from "@/lib/review-prompts";
import type { ThanksContext } from "@/lib/services/tips";
import { cn, formatMoney, googleReviewUrl } from "@/lib/utils";
import { StarRating } from "./star-rating";

export function ThanksView({ code, token, ctx }: { code: string; token: string; ctx: ThanksContext }) {
  const { tip, staff, venue } = ctx;
  const { t } = useI18n();
  const [rating, setRating] = useState(ctx.review?.rating ?? null);
  const comment = ctx.review?.comment ?? null;

  if (tip.status === "pending") return <Pending />;
  if (tip.status === "failed" || tip.status === "refunded") {
    return (
      <StatusScreen
        icon={<X size={30} aria-hidden />}
        tone="negative"
        title={t("thanks.failedTitle")}
        hint={t("thanks.failedHint")}
        action={
          <Link href={`/t/${code}`} className={buttonClasses("primary", "lg", "mt-8 w-full max-w-xs")}>
            {t("thanks.tryAgain")}
          </Link>
        }
      />
    );
  }

  const prompts = postTipPrompts(rating);

  return (
    <div className="min-h-dvh bg-grouped">
      <div className="mx-auto flex max-w-lg justify-end px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <LanguageToggle />
      </div>

      <main className="mx-auto max-w-lg px-5 pb-safe">
        <section className="flex flex-col items-center pt-4 text-center">
          <SuccessMark color={staff.color} />
          <h1 className="mt-6 text-large-title">{t("thanks.title")}</h1>
          <div className="mt-3 flex items-center gap-2.5 rounded-full bg-surface py-1.5 pr-4 pl-1.5 shadow-card">
            <Avatar name={staff.displayName} color={staff.color} photoUrl={staff.photoUrl} size={30} />
            <p className="text-left text-subhead font-medium">
              <ReceivedLine name={staff.displayName} cents={tip.amountCents} />
            </p>
          </div>
        </section>

        <div className="mt-10 space-y-4">
          {rating == null && (
            <Card>
              <h2 className="text-center text-headline">{t("tip.howWasService")}</h2>
              <div className="mt-3">
                <StarRating
                  value={rating}
                  onChange={(r) => {
                    setRating(r);
                    void saveReviewAction({ tipId: tip.id, token, rating: r, comment });
                  }}
                />
              </div>
            </Card>
          )}

          {/* The rating and comment are already in the manager's feedback inbox; this confirms it. */}
          {prompts.privateFeedbackConfirmation && <PrivateFeedbackCard />}

          {prompts.googleReview && venue.googlePlaceId && (
            <GoogleCard tipId={tip.id} token={token} placeId={venue.googlePlaceId} venueName={venue.name} comment={comment} />
          )}
        </div>

        <p className="mt-8 pb-6 text-center text-footnote text-ink-3">{t("thanks.closeHint")}</p>
      </main>
    </div>
  );
}

function ReceivedLine({ name, cents }: { name: string; cents: number }) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const text = (c: number) => t("thanks.received", { name, amount: formatMoney(c, locale) });

  useEffect(() => {
    if (reduce || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, cents, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = text(Math.round(v / 10) * 10);
      },
      onComplete: () => {
        node.textContent = text(cents);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents, reduce]);

  return <span ref={ref}>{text(cents)}</span>;
}

/** Check mark that draws itself, with a small burst in the staff member's colour. */
function SuccessMark({ color }: { color: string }) {
  const reduce = useReducedMotion();
  // Deterministic jitter so server and client render identical markup.
  const jitter = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const particles = Array.from({ length: 14 }, (_, i) => ({
    angle: (i / 14) * Math.PI * 2 + jitter(i, 1) * 0.4,
    distance: 62 + jitter(i, 2) * 34,
    size: Math.round(5 + jitter(i, 3) * 5),
    tint: i % 3 === 0 ? "var(--star)" : i % 3 === 1 ? color : "var(--positive)",
  }));
  return (
    <div className="relative flex size-[96px] items-center justify-center">
      {!reduce &&
        particles.map((p, i) => (
          <m.span
            key={i}
            className="absolute rounded-full"
            style={{ width: p.size, height: p.size, background: p.tint }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: Math.cos(p.angle) * p.distance,
              y: Math.sin(p.angle) * p.distance,
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.6],
            }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden
          />
        ))}
      <m.div
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="flex size-[96px] items-center justify-center rounded-full bg-positive text-white shadow-[0_12px_32px_color-mix(in_srgb,var(--positive)_40%,transparent)]"
      >
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" aria-hidden>
          <m.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          />
        </svg>
      </m.div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.35 }}
      className={cn("rounded-card bg-surface p-5 shadow-card", className)}
    >
      {children}
    </m.section>
  );
}

function GoogleCard({
  tipId,
  token,
  placeId,
  venueName,
  comment,
}: {
  tipId: string;
  token: string;
  placeId: string;
  venueName: string;
  comment: string | null;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[#fff4e0] text-star dark:bg-star/15">
          <Star size={22} className="fill-star" strokeWidth={0} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-headline">{t("thanks.googleTitle")}</h2>
          <p className="mt-1 text-subhead text-ink-2">
            {comment ? t("thanks.googleHint", { venue: venueName }) : t("thanks.googleHintNoComment", { venue: venueName })}
          </p>
        </div>
      </div>
      {comment && (
        <blockquote className="mt-4 rounded-[14px] bg-fill px-4 py-3 text-callout text-ink">“{comment}”</blockquote>
      )}
      <a
        href={googleReviewUrl(placeId)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (comment && navigator.clipboard) {
            navigator.clipboard.writeText(comment).then(
              () => toast.success(t("thanks.commentCopied")),
              () => undefined,
            );
          }
          void googleClickAction({ tipId, token });
        }}
        className={buttonClasses("primary", "lg", "mt-4 w-full")}
      >
        <GoogleG />
        {t("thanks.googleCta")}
      </a>
    </Card>
  );
}

function PrivateFeedbackCard() {
  const { t } = useI18n();
  return (
    <Card>
      <p className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-brand-soft text-brand">
          <LockKeyhole size={20} aria-hidden />
        </span>
        <span className="pt-2.5 text-headline">{t("thanks.privateFeedbackSent")}</span>
      </p>
    </Card>
  );
}

function Pending() {
  const { t } = useI18n();
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      if (++tries > 20) return clearInterval(id);
      router.refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <StatusScreen
      icon={
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <m.span
              key={i}
              className="size-2.5 rounded-full bg-current"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      }
      tone="neutral"
      title={t("thanks.pendingTitle")}
      hint={t("thanks.pendingHint")}
    />
  );
}

function StatusScreen({
  icon,
  tone,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  tone: "neutral" | "negative";
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span
        className={cn(
          "flex size-20 items-center justify-center rounded-full",
          tone === "negative" ? "bg-negative-soft text-negative" : "bg-fill text-ink-2",
        )}
      >
        {icon}
      </span>
      <h1 className="mt-5 text-title-2">{title}</h1>
      <p className="mt-2 max-w-xs text-subhead text-ink-2">{hint}</p>
      {action}
    </main>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
