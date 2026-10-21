import type { Metadata } from "next";
import { CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { KpiTile, percentDelta, ratingDelta } from "@/components/dashboard/kpi-tile";
import { LeaderRow } from "@/components/dashboard/leader-row";
import { RangeControl } from "@/components/dashboard/range-control";
import { ReviewItem } from "@/components/dashboard/review-item";
import { TipsChart } from "@/components/dashboard/tips-chart";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { getOverview, parseRange } from "@/lib/services/venue";
import { formatMoney, formatNumber, formatRating } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage(props: PageProps<"/dashboard">) {
  const session = await requireMember();
  const range = parseRange((await props.searchParams).range);
  const [{ t, locale }, data, venue] = await Promise.all([
    getI18n(),
    getOverview(session.venueId, range),
    repo().getVenue(session.venueId),
  ]);
  const { summary, deltas } = data;
  const vs = t("dash.vsPrevious", { change: "", days: range }).trim();

  return (
    <>
      <PageHeader eyebrow={venue?.name} title={t("dash.nav.overview")} />
      <div className="space-y-5 px-5 lg:px-0">
        <RangeControl value={range} />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label={t("dash.kpiVolume")} value={formatMoney(summary.volumeCents, locale)} delta={percentDelta(deltas.volume, locale)} deltaLabel={vs} />
          <KpiTile label={t("dash.kpiCount")} value={formatNumber(summary.count, locale)} delta={percentDelta(deltas.count, locale)} deltaLabel={vs} />
          <KpiTile
            label={t("dash.kpiRating")}
            value={
              <span className="inline-flex items-center gap-1.5">
                <Star size={22} className="fill-star" strokeWidth={0} aria-hidden />
                {formatRating(summary.avgRating, locale)}
              </span>
            }
            delta={ratingDelta(deltas.rating, locale)}
            deltaLabel={vs}
          />
          <KpiTile label={t("dash.kpiGoogle")} value={formatNumber(summary.googleClicks, locale)} delta={percentDelta(deltas.google, locale)} deltaLabel={vs} />
        </section>
        <p className="-mt-2 px-1 text-footnote text-ink-3">{vs}</p>

        <section className="rounded-card bg-surface p-4 shadow-card lg:p-5">
          <h2 className="text-headline">{t("dash.chartTitle")}</h2>
          <TipsChart series={data.series} title={t("dash.chartTitle")} />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-1.5">
            <div className="flex items-baseline justify-between px-4">
              <h2 className="text-footnote text-ink-2">{t("dash.needsAttention")}</h2>
              <Link href="/dashboard/feedback?filter=negative" className="text-footnote font-medium text-brand">
                {t("dash.seeAll")}
              </Link>
            </div>
            <div className="overflow-hidden rounded-card bg-surface shadow-card">
              {data.needsAttention.length ? (
                data.needsAttention.map((r) => (
                  <ReviewItem
                    key={r.id}
                    review={r}
                    locale={locale}
                    labels={{ privateMessage: t("dash.feedback.privateMessage"), googleTapped: t("dash.feedback.googleTapped") }}
                  />
                ))
              ) : (
                <p className="flex items-center gap-2 px-4 py-4 text-subhead text-ink-2">
                  <CheckCircle2 size={18} className="text-positive" aria-hidden />
                  {t("dash.needsAttentionEmpty")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-1.5">
            <div className="flex items-baseline justify-between px-4">
              <h2 className="text-footnote text-ink-2">{t("dash.topStaff")}</h2>
              <Link href="/dashboard/staff" className="text-footnote font-medium text-brand">
                {t("dash.seeAll")}
              </Link>
            </div>
            <div className="overflow-hidden rounded-card bg-surface shadow-card">
              {data.top.map((row, i) => (
                <LeaderRow
                  key={row.staff.id}
                  rank={i + 1}
                  staff={row.staff}
                  volumeCents={row.volumeCents}
                  avgRating={row.avgRating}
                  subtitle={`${formatNumber(row.count, locale)} ${t("dash.staff.tips").toLowerCase()}`}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
