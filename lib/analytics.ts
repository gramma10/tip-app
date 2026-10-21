import type { Review, Staff, Tip } from "./types";

export const VENUE_TIME_ZONE = "Europe/Athens";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: VENUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD in the venue's time zone, so late-night tips count for the right service day. */
export function dayKey(date: Date | string) {
  return dayKeyFormat.format(typeof date === "string" ? new Date(date) : date);
}

export type Summary = {
  volumeCents: number;
  count: number;
  avgTipCents: number;
  avgRating: number | null;
  ratingCount: number;
  googleClicks: number;
};

export function summarize(tips: Tip[], reviews: Review[]): Summary {
  const paid = tips.filter((t) => t.status === "succeeded");
  const volumeCents = paid.reduce((s, t) => s + t.amountCents, 0);
  const rated = reviews.filter((r) => r.published && r.rating != null);
  const ratingSum = rated.reduce((s, r) => s + r.rating!, 0);
  return {
    volumeCents,
    count: paid.length,
    avgTipCents: paid.length ? Math.round(volumeCents / paid.length) : 0,
    avgRating: rated.length ? ratingSum / rated.length : null,
    ratingCount: rated.length,
    googleClicks: reviews.filter((r) => r.googleClicked).length,
  };
}

/** Relative change, or null when there is no baseline to compare with. */
export function change(current: number, previous: number) {
  if (!previous) return null;
  return (current - previous) / previous;
}

export type DayPoint = { day: string; cents: number; count: number };

export function dailySeries(tips: Tip[], days: number, end = new Date()): DayPoint[] {
  const byDay = new Map<string, DayPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400_000);
    const key = dayKey(d);
    byDay.set(key, { day: key, cents: 0, count: 0 });
  }
  for (const t of tips) {
    if (t.status !== "succeeded") continue;
    const point = byDay.get(dayKey(t.createdAt));
    if (point) {
      point.cents += t.amountCents;
      point.count += 1;
    }
  }
  return [...byDay.values()];
}

export type LeaderRow = {
  staff: Staff;
  volumeCents: number;
  count: number;
  avgRating: number | null;
  ratingCount: number;
};

export function leaderboard(staff: Staff[], tips: Tip[], reviews: Review[]): LeaderRow[] {
  return staff
    .map((s) => {
      const sum = summarize(
        tips.filter((t) => t.staffId === s.id),
        reviews.filter((r) => r.staffId === s.id),
      );
      return {
        staff: s,
        volumeCents: sum.volumeCents,
        count: sum.count,
        avgRating: sum.avgRating,
        ratingCount: sum.ratingCount,
      };
    })
    .sort((a, b) => b.volumeCents - a.volumeCents || (b.avgRating ?? 0) - (a.avgRating ?? 0));
}

export function ratingStats(reviews: Review[]) {
  const rated = reviews.filter((r) => r.published && r.rating != null);
  return {
    avg: rated.length ? rated.reduce((s, r) => s + r.rating!, 0) / rated.length : null,
    count: rated.length,
  };
}

const offsetFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: VENUE_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Milliseconds the venue's wall clock is ahead of UTC at a given instant (DST-aware). */
function zoneOffsetMs(at: Date) {
  const parts = offsetFormat.formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** Start of the current week (Monday 00:00) in the venue's time zone. */
export function startOfWeek(now = new Date()) {
  const [y, m, d] = dayKey(now).split("-").map(Number) as [number, number, number];
  const midnight = new Date(Date.UTC(y, m - 1, d));
  const weekday = (midnight.getUTCDay() + 6) % 7; // Monday = 0
  midnight.setUTCDate(midnight.getUTCDate() - weekday);
  return new Date(midnight.getTime() - zoneOffsetMs(midnight));
}
