import type { Metadata } from "next";
import { AlertCircle, ChevronRight, HandCoins, QrCode, Star } from "lucide-react";
import Link from "next/link";
import { LiveRefresh } from "@/components/live-refresh";
import { EmptyState, PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/list";
import { Stars } from "@/components/ui/stars";
import { VENUE_TIME_ZONE } from "@/lib/analytics";
import { requireStaff } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getStaffHome } from "@/lib/services/staff";
import { formatMoney, formatRating, formatRelativeTime, shade } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

function greetingKey() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: VENUE_TIME_ZONE }).format(new Date()),
  );
  if (hour >= 5 && hour < 12) return "me.greetingMorning" as const;
  if (hour >= 12 && hour < 18) return "me.greetingAfternoon" as const;
  return "me.greetingEvening" as const;
}

export default async function StaffHome() {
  const session = await requireStaff();
  const [home, { t, locale }] = await Promise.all([getStaffHome(session.staffId), getI18n()]);
  if (!home) return null;
  const { staff, venue, week, rating, series, recent } = home;
  const max = Math.max(1, ...series);

  return (
    <>
      <LiveRefresh staffId={staff.id} latestTip={home.latestTip} />
      <PageHeader eyebrow={t(greetingKey())} title={staff.displayName} />

      <div className="space-y-6 px-5">
        {!staff.payoutsEnabled && (
          <Link
            href="/me/profile"
            className="flex items-center gap-3 rounded-card bg-negative-soft px-4 py-3 text-subhead font-medium text-negative"
          >
            <AlertCircle size={20} aria-hidden />
            <span className="flex-1">{t("me.pausedBanner")}</span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}

        {/* Wallet card: the week's take-home, in the person's own colour. */}
        <section
          className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-float"
          style={{ background: `linear-gradient(145deg, ${shade(staff.color, 0.15)} 0%, ${staff.color} 45%, ${shade(staff.color, -0.4)} 100%)` }}
        >
          <div
            className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-white/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center justify-between text-footnote font-semibold text-white/80">
            <span>{t("me.thisWeek")}</span>
            <span className="truncate pl-4">{venue.name}</span>
          </div>
          <p className="relative mt-2 text-[44px] leading-[48px] font-bold tracking-[-0.03em]">
            {formatMoney(week.netCents, locale)}
          </p>
          <p className="relative mt-1 text-footnote text-white/75">{t("me.payoutNote")}</p>
          <div className="relative mt-5 flex h-12 items-end gap-1.5" aria-hidden>
            {series.map((v, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-[4px] bg-white"
                style={{ height: `${Math.max(6, (v / max) * 100)}%`, opacity: i === series.length - 1 ? 1 : 0.45 }}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 overflow-hidden rounded-card bg-surface shadow-card">
          <Stat label={t("me.tipsCount")} value={String(week.count)} />
          <Stat
            label={t("me.rating")}
            value={
              <span className="inline-flex items-center gap-1">
                <Star size={16} className="fill-star" strokeWidth={0} aria-hidden />
                {formatRating(rating.avg, locale)}
              </span>
            }
            divider
          />
          <Stat label={t("me.avgTip")} value={formatMoney(week.avgCents, locale)} divider />
        </section>

        {recent.length ? (
          <ListGroup header={t("me.recent")}>
            {recent.map((tip) => (
              <div key={tip.id} className="group/row flex gap-3 pl-4">
                <span className="mt-3 flex size-9 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive">
                  <HandCoins size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 py-3 pr-4 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-headline">+{formatMoney(tip.netCents, locale)}</span>
                    <span className="shrink-0 text-footnote text-ink-3">{formatRelativeTime(tip.createdAt, locale)}</span>
                  </div>
                  {tip.rating != null && <Stars value={tip.rating} size={13} className="mt-1" />}
                  {tip.comment && <p className="mt-1 text-subhead text-ink-2">{tip.comment}</p>}
                </div>
              </div>
            ))}
          </ListGroup>
        ) : (
          <EmptyState
            icon={<HandCoins size={26} aria-hidden />}
            title={t("me.noTips")}
            hint={t("me.noTipsHint")}
            action={
              <LinkButton href="/me/card" variant="brand">
                <QrCode size={18} aria-hidden />
                {t("me.showMyCard")}
              </LinkButton>
            }
          />
        )}
      </div>
    </>
  );
}

function Stat({ label, value, divider }: { label: string; value: React.ReactNode; divider?: boolean }) {
  return (
    <div className={divider ? "px-4 py-3.5 shadow-[inset_0.5px_0_0_var(--line)]" : "px-4 py-3.5"}>
      <div className="text-footnote text-ink-2">{label}</div>
      <div className="mt-0.5 text-title-3">{value}</div>
    </div>
  );
}
