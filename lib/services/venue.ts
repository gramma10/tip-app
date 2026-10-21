import "server-only";
import { change, dailySeries, leaderboard, ratingStats, summarize } from "../analytics";
import { repo } from "../data";
import type { Review, Staff } from "../types";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: unknown): Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export type StaffStatus = "active" | "invited" | "setup" | "inactive";

export function staffStatus(s: Staff): StaffStatus {
  if (!s.active) return "inactive";
  if (!s.userId) return "invited";
  if (!s.payoutsEnabled) return "setup";
  return "active";
}

export async function getOverview(venueId: string, days: Range) {
  const now = Date.now();
  const start = new Date(now - days * 86400_000);
  const prevStart = new Date(now - 2 * days * 86400_000);

  const [staff, tips, reviews] = await Promise.all([
    repo().listStaff(venueId),
    repo().listTips({ venueId, status: "succeeded", since: prevStart }),
    repo().listReviews({ venueId, publishedOnly: true, since: prevStart }),
  ]);
  const startIso = start.toISOString();
  const cur = { tips: tips.filter((t) => t.createdAt >= startIso), reviews: reviews.filter((r) => r.createdAt >= startIso) };
  const prev = { tips: tips.filter((t) => t.createdAt < startIso), reviews: reviews.filter((r) => r.createdAt < startIso) };

  const now_ = summarize(cur.tips, cur.reviews);
  const before = summarize(prev.tips, prev.reviews);
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return {
    summary: now_,
    deltas: {
      volume: change(now_.volumeCents, before.volumeCents),
      count: change(now_.count, before.count),
      rating: now_.avgRating != null && before.avgRating != null ? now_.avgRating - before.avgRating : null,
      google: change(now_.googleClicks, before.googleClicks),
    },
    series: dailySeries(cur.tips, days),
    needsAttention: cur.reviews
      .filter((r) => r.rating != null && r.rating <= 3)
      .reverse()
      .slice(0, 5)
      .map((r) => withStaff(r, staffById)),
    top: leaderboard(
      staff.filter((s) => s.active),
      cur.tips,
      cur.reviews,
    ).slice(0, 3),
  };
}

function withStaff(r: Review, staffById: Map<string, Staff>) {
  const s = staffById.get(r.staffId);
  return { ...r, staffName: s?.displayName ?? "", staffColor: s?.color ?? "#8e8e93", staffPhoto: s?.photoUrl ?? null };
}

export async function getStaffList(venueId: string, days: Range) {
  const since = new Date(Date.now() - days * 86400_000);
  const [staff, tips, reviews] = await Promise.all([
    repo().listStaff(venueId),
    repo().listTips({ venueId, status: "succeeded", since }),
    repo().listReviews({ venueId, publishedOnly: true, since }),
  ]);
  return leaderboard(staff, tips, reviews).map((row) => ({ ...row, status: staffStatus(row.staff) }));
}

export async function getStaffDetail(venueId: string, staffId: string, days: Range) {
  const staff = await repo().getStaff(staffId);
  if (!staff || staff.venueId !== venueId) return null;
  const since = new Date(Date.now() - days * 86400_000);
  const [tips, reviews, allReviews, cards] = await Promise.all([
    repo().listTips({ staffId, status: "succeeded", since }),
    repo().listReviews({ staffId, publishedOnly: true, since }),
    repo().listReviews({ staffId, publishedOnly: true }),
    repo().listCards(venueId),
  ]);
  return {
    staff,
    status: staffStatus(staff),
    summary: summarize(tips, reviews),
    allTime: ratingStats(allReviews),
    distribution: [1, 2, 3, 4, 5].map((n) => allReviews.filter((r) => r.rating === n).length),
    series: dailySeries(tips, days),
    cards: cards.filter((c) => c.assignedStaffId === staffId),
    recentReviews: allReviews.filter((r) => r.rating != null || r.comment).reverse().slice(0, 20),
  };
}

export type FeedbackFilter = "all" | "positive" | "negative" | "messages";

export async function getFeedback(venueId: string, filter: FeedbackFilter) {
  const since = new Date(Date.now() - 90 * 86400_000);
  const [staff, reviews] = await Promise.all([
    repo().listStaff(venueId),
    repo().listReviews({ venueId, publishedOnly: true, since }),
  ]);
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const meaningful = reviews.filter((r) => r.comment || r.managerMessage || r.rating != null);
  const filtered = meaningful.filter((r) => {
    if (filter === "positive") return (r.rating ?? 0) >= 4;
    if (filter === "negative") return r.rating != null && r.rating <= 3;
    if (filter === "messages") return Boolean(r.managerMessage);
    return Boolean(r.comment || r.managerMessage);
  });
  return filtered.reverse().slice(0, 100).map((r) => withStaff(r, staffById));
}

export async function getCards(venueId: string) {
  const [cards, staff] = await Promise.all([repo().listCards(venueId), repo().listStaff(venueId)]);
  return { cards, staff: staff.filter((s) => s.active) };
}
