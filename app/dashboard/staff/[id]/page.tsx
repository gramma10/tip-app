import type { Metadata } from "next";
import { ChevronLeft, QrCode, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { RangeControl } from "@/components/dashboard/range-control";
import { TipsChart } from "@/components/dashboard/tips-chart";
import { RatingSummary } from "@/components/rating-summary";
import { Avatar } from "@/components/ui/avatar";
import { ListGroup, ListRow } from "@/components/ui/list";
import { Stars } from "@/components/ui/stars";
import { requireMember } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getStaffDetail, parseRange } from "@/lib/services/venue";
import { formatMoney, formatNumber, formatRating, formatRelativeTime } from "@/lib/utils";
import { setStaffActive } from "../../actions";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffDetailPage(props: PageProps<"/dashboard/staff/[id]">) {
  const session = await requireMember();
  const [{ id }, search] = await Promise.all([props.params, props.searchParams]);
  const range = parseRange(search.range);
  const [{ t, locale }, detail] = await Promise.all([getI18n(), getStaffDetail(session.venueId, id, range)]);
  if (!detail) notFound();
  const { staff, summary } = detail;

  return (
    <>
      <div className="px-3 pt-[max(env(safe-area-inset-top),12px)] lg:px-0">
        <Link href="/dashboard/staff" className="inline-flex h-10 items-center gap-0.5 pr-3 text-body text-brand">
          <ChevronLeft size={22} aria-hidden />
          {t("dash.staff.title")}
        </Link>
      </div>

      <div className="space-y-5 px-5 lg:px-0">
        <section className="flex items-center gap-4 pt-2">
          <Avatar name={staff.displayName} color={staff.color} photoUrl={staff.photoUrl} size={72} />
          <div className="min-w-0">
            <h1 className="truncate text-title-1">{staff.displayName}</h1>
            <p className="text-subhead text-ink-2">{staff.roleLabel}</p>
          </div>
        </section>

        <RangeControl value={range} />

        <section className="grid grid-cols-3 gap-3">
          <KpiTile label={t("dash.kpiVolume")} value={formatMoney(summary.volumeCents, locale, { compact: true })} />
          <KpiTile label={t("dash.staff.tips")} value={formatNumber(summary.count, locale)} />
          <KpiTile
            label={t("dash.staff.rating")}
            value={
              <span className="inline-flex items-center gap-1">
                <Star size={20} className="fill-star" strokeWidth={0} aria-hidden />
                {formatRating(summary.avgRating, locale)}
              </span>
            }
          />
        </section>

        <section className="rounded-card bg-surface p-4 shadow-card">
          <h2 className="text-headline">{t("dash.chartTitle")}</h2>
          <TipsChart series={detail.series} title={t("dash.chartTitle")} />
        </section>

        <RatingSummary
          distribution={detail.distribution}
          locale={locale}
          countLabel={t("common.reviewsCount", { count: detail.allTime.count })}
        />

        <ListGroup header={t("dash.staff.cards")}>
          {detail.cards.length ? (
            detail.cards.map((c) => (
              <ListRow
                key={c.id}
                href="/dashboard/cards"
                leading={<QrCode size={20} className="text-ink-2" aria-hidden />}
                title={c.label}
                trailing={<span className="font-mono text-footnote">/t/{c.code}</span>}
              />
            ))
          ) : (
            <ListRow title={<span className="text-ink-2">{t("dash.staff.noCards")}</span>} href="/dashboard/cards" />
          )}
        </ListGroup>

        {detail.recentReviews.length > 0 && (
          <ListGroup header={t("dash.staff.recentReviews")}>
            {detail.recentReviews.map((r) => (
              <div key={r.id} className="group/row px-4">
                <div className="py-3 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
                  <div className="flex items-center justify-between">
                    {r.rating != null ? <Stars value={r.rating} size={13} /> : <span />}
                    <span className="text-footnote text-ink-3">{formatRelativeTime(r.createdAt, locale)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-body">{r.comment}</p>}
                </div>
              </div>
            ))}
          </ListGroup>
        )}

        <form action={setStaffActive.bind(null, staff.id, !staff.active)}>
          <button
            type="submit"
            className={`h-12 w-full rounded-card bg-surface text-body shadow-card ${staff.active ? "text-negative" : "text-brand"}`}
          >
            {staff.active ? t("dash.staff.remove") : t("dash.staff.restore")}
          </button>
        </form>
      </div>
    </>
  );
}
