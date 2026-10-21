import type { Metadata } from "next";
import { Star } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { RatingSummary } from "@/components/rating-summary";
import { ListGroup } from "@/components/ui/list";
import { Stars } from "@/components/ui/stars";
import { requireStaff } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getStaffReviews } from "@/lib/services/staff";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

export default async function StaffReviewsPage() {
  const session = await requireStaff();
  const [{ reviews, distribution }, { t, locale }] = await Promise.all([getStaffReviews(session.staffId), getI18n()]);
  const withComments = reviews.filter((r) => r.comment).slice(0, 50);

  return (
    <>
      <PageHeader title={t("me.tabs.reviews")} />
      <div className="space-y-6 px-5">
        {reviews.length ? (
          <>
            <RatingSummary
              distribution={distribution}
              locale={locale}
              countLabel={t("common.reviewsCount", { count: reviews.length })}
            />
            {withComments.length > 0 && (
              <ListGroup>
                {withComments.map((r) => (
                  <div key={r.id} className="group/row px-4">
                    <div className="py-3.5 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
                      <div className="flex items-center justify-between">
                        <Stars value={r.rating ?? 0} size={13} />
                        <span className="text-footnote text-ink-3">{formatRelativeTime(r.createdAt, locale)}</span>
                      </div>
                      <p className="mt-1.5 text-body">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </ListGroup>
            )}
          </>
        ) : (
          <EmptyState icon={<Star size={26} aria-hidden />} title={t("me.noReviews")} hint={t("me.noReviewsHint")} />
        )}
      </div>
    </>
  );
}
