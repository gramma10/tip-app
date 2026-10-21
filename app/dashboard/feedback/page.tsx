import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { ReviewItem } from "@/components/dashboard/review-item";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getFeedback, type FeedbackFilter } from "@/lib/services/venue";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Feedback" };

const FILTERS: FeedbackFilter[] = ["all", "negative", "messages", "positive"];

export default async function FeedbackPage(props: PageProps<"/dashboard/feedback">) {
  const session = await requireMember();
  const raw = (await props.searchParams).filter;
  const filter: FeedbackFilter = FILTERS.includes(raw as FeedbackFilter) ? (raw as FeedbackFilter) : "all";
  const [{ t, locale }, items] = await Promise.all([getI18n(), getFeedback(session.venueId, filter)]);

  return (
    <>
      <PageHeader title={t("dash.feedback.title")} />
      <div className="space-y-4 px-5 lg:px-0">
        {/* Airbnb-style filter pills; horizontally scrollable on small screens. */}
        <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0" aria-label={t("dash.feedback.title")}>
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/dashboard/feedback" : `/dashboard/feedback?filter=${f}`}
              aria-current={f === filter ? "page" : undefined}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-subhead leading-9 font-medium transition-colors",
                f === filter ? "bg-primary text-primary-fg" : "bg-surface text-ink shadow-card",
              )}
            >
              {t(`dash.feedback.${f}`)}
            </Link>
          ))}
        </nav>

        {items.length ? (
          <div className="overflow-hidden rounded-card bg-surface shadow-card">
            {items.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                locale={locale}
                labels={{ privateMessage: t("dash.feedback.privateMessage"), googleTapped: t("dash.feedback.googleTapped") }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<MessageSquare size={26} aria-hidden />} title={t("dash.feedback.empty")} />
        )}
      </div>
    </>
  );
}
