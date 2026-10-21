import { LockKeyhole } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import type { Locale } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export type ReviewItemData = {
  id: string;
  rating: number | null;
  comment: string | null;
  managerMessage: string | null;
  googleClicked: boolean;
  createdAt: string;
  staffName: string;
  staffColor: string;
  staffPhoto: string | null;
};

export function ReviewItem({
  review,
  locale,
  labels,
}: {
  review: ReviewItemData;
  locale: Locale;
  labels: { privateMessage: string; googleTapped: string };
}) {
  return (
    <div className="group/row flex gap-3 pl-4">
      <Avatar name={review.staffName} color={review.staffColor} photoUrl={review.staffPhoto} size={36} className="mt-3.5" />
      <div className="min-w-0 flex-1 py-3.5 pr-4 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-subhead font-semibold">{review.staffName}</span>
          <span className="shrink-0 text-footnote text-ink-3">{formatRelativeTime(review.createdAt, locale)}</span>
        </div>
        {review.rating != null && <Stars value={review.rating} size={13} className="mt-1" />}
        {review.comment && <p className="mt-1 text-body">{review.comment}</p>}
        {review.managerMessage && (
          <div className="mt-2 rounded-[12px] bg-brand-soft px-3 py-2">
            <div className="flex items-center gap-1.5 text-footnote font-semibold text-brand">
              <LockKeyhole size={13} aria-hidden />
              {labels.privateMessage}
            </div>
            <p className="mt-0.5 text-subhead text-ink">{review.managerMessage}</p>
          </div>
        )}
        {review.googleClicked && <p className="mt-1.5 text-footnote text-ink-3">{labels.googleTapped}</p>}
      </div>
    </div>
  );
}
