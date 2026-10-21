import { describe, expect, it } from "vitest";
import { change, dailySeries, dayKey, leaderboard, startOfWeek, summarize } from "@/lib/analytics";
import type { Review, Staff, Tip } from "@/lib/types";

const tip = (over: Partial<Tip>): Tip => ({
  id: Math.random().toString(36),
  venueId: "v",
  staffId: "s1",
  cardId: null,
  amountCents: 200,
  feeCoverCents: 0,
  platformFeeCents: 36,
  currency: "eur",
  provider: "demo",
  providerRef: null,
  status: "succeeded",
  createdAt: "2026-10-10T12:00:00Z",
  paidAt: null,
  ...over,
});

const review = (over: Partial<Review>): Review => ({
  id: Math.random().toString(36),
  tipId: "t",
  venueId: "v",
  staffId: "s1",
  rating: 5,
  comment: null,
  published: true,
  googleClicked: false,
  managerMessage: null,
  createdAt: "2026-10-10T12:00:00Z",
  ...over,
});

describe("summarize", () => {
  it("counts only paid tips and published ratings", () => {
    const s = summarize(
      [tip({ amountCents: 300 }), tip({ amountCents: 500 }), tip({ status: "pending", amountCents: 9999 })],
      [review({ rating: 5 }), review({ rating: 3, googleClicked: true }), review({ rating: 1, published: false })],
    );
    expect(s).toEqual({ volumeCents: 800, count: 2, avgTipCents: 400, avgRating: 4, ratingCount: 2, googleClicks: 1 });
  });
});

describe("change", () => {
  it("is null without a baseline", () => {
    expect(change(10, 0)).toBeNull();
    expect(change(15, 10)).toBeCloseTo(0.5);
  });
});

describe("dayKey / dailySeries", () => {
  it("buckets late-night tips into the Athens service day", () => {
    // 22:30 UTC on 10 Oct is 01:30 on 11 Oct in Athens (UTC+3 in summer time).
    expect(dayKey("2026-10-10T22:30:00Z")).toBe("2026-10-11");
  });

  it("returns one point per day, oldest first, including empty days", () => {
    const end = new Date("2026-10-12T10:00:00Z");
    const series = dailySeries([tip({ createdAt: "2026-10-12T09:00:00Z", amountCents: 500 })], 3, end);
    expect(series.map((p) => p.day)).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
    expect(series.at(-1)).toEqual({ day: "2026-10-12", cents: 500, count: 1 });
  });
});

describe("startOfWeek", () => {
  it("is Monday 00:00 in Athens", () => {
    // Thursday 15 Oct 2026 → Monday 12 Oct 00:00 Athens = 11 Oct 21:00 UTC (EEST, UTC+3).
    expect(startOfWeek(new Date("2026-10-15T12:00:00Z")).toISOString()).toBe("2026-10-11T21:00:00.000Z");
  });
});

describe("leaderboard", () => {
  it("ranks by tip volume", () => {
    const staff = [{ id: "s1", displayName: "A" }, { id: "s2", displayName: "B" }] as Staff[];
    const rows = leaderboard(staff, [tip({ staffId: "s1", amountCents: 100 }), tip({ staffId: "s2", amountCents: 900 })], []);
    expect(rows.map((r) => r.staff.id)).toEqual(["s2", "s1"]);
  });
});
