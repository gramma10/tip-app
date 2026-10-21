import "server-only";
import { dailySeries, ratingStats, startOfWeek } from "../analytics";
import { repo } from "../data";
import type { Review, Tip } from "../types";

/** What the staff member actually receives for a tip (full tip when the guest covered fees). */
export function payeeNet(t: Tip) {
  return t.amountCents + t.feeCoverCents - t.platformFeeCents;
}

export type StaffReview = Pick<Review, "id" | "rating" | "comment" | "createdAt">;

export async function getStaffHome(staffId: string) {
  const staff = await repo().getStaff(staffId);
  if (!staff) return null;
  const since = new Date(Date.now() - 35 * 86400_000);
  const [venue, tips, reviews, cards] = await Promise.all([
    repo().getVenue(staff.venueId),
    repo().listTips({ staffId, status: "succeeded", since }),
    repo().listReviews({ staffId, publishedOnly: true }),
    repo().listCards(staff.venueId),
  ]);
  if (!venue) return null;

  const weekStart = startOfWeek().toISOString();
  const week = tips.filter((t) => t.createdAt >= weekStart);
  const weekNet = week.reduce((s, t) => s + payeeNet(t), 0);
  const recent = [...tips].reverse().slice(0, 25);
  const reviewByTip = new Map(reviews.map((r) => [r.tipId, r]));
  const series = dailySeries(tips, 7).map((p) => p.cents);

  return {
    staff,
    venue,
    card: cards.find((c) => c.kind === "staff" && c.assignedStaffId === staffId) ?? null,
    week: {
      netCents: weekNet,
      count: week.length,
      avgCents: week.length ? Math.round(week.reduce((s, t) => s + t.amountCents, 0) / week.length) : 0,
    },
    rating: ratingStats(reviews),
    series,
    recent: recent.map((t) => {
      const r = reviewByTip.get(t.id);
      return {
        id: t.id,
        netCents: payeeNet(t),
        createdAt: t.createdAt,
        rating: r?.rating ?? null,
        comment: r?.comment ?? null,
      };
    }),
    latestTip: tips.length ? { id: tips[tips.length - 1]!.id, amountCents: payeeNet(tips[tips.length - 1]!) } : null,
  };
}

export async function getStaffReviews(staffId: string): Promise<{ reviews: StaffReview[]; distribution: number[] }> {
  const reviews = (await repo().listReviews({ staffId, publishedOnly: true })).filter((r) => r.rating != null);
  const distribution = [1, 2, 3, 4, 5].map((n) => reviews.filter((r) => r.rating === n).length);
  return {
    // Private manager messages are deliberately never exposed to staff.
    reviews: [...reviews].reverse().map(({ id, rating, comment, createdAt }) => ({ id, rating, comment, createdAt })),
    distribution,
  };
}
