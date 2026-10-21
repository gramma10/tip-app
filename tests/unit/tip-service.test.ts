import { beforeEach, describe, expect, it } from "vitest";
import { repo } from "@/lib/data";
import { createDemoDb } from "@/lib/data/demo-seed";
import {
  getThanksContext,
  getTipPageContext,
  recordGoogleClick,
  saveReview,
  startTip,
  syncTipStatus,
  TipError,
} from "@/lib/services/tips";

// Runs against the in-memory demo store (no Supabase/Stripe env in tests).
beforeEach(() => {
  (globalThis as { __kerasmaDemoDb?: unknown }).__kerasmaDemoDb = createDemoDb();
});

const base = { amountCents: 300, coverFees: true, rating: 5, comment: "Lovely" };

describe("tip page context", () => {
  it("resolves a personal card to its person", async () => {
    const ctx = await getTipPageContext("maria");
    expect(ctx?.state).toBe("ready");
    if (ctx?.state === "ready") expect(ctx.staff?.displayName).toBe("Maria");
  });

  it("lets guests pick from the team on a table card, excluding people who can't be paid", async () => {
    const ctx = await getTipPageContext("table-7");
    expect(ctx?.state).toBe("ready");
    if (ctx?.state === "ready") {
      expect(ctx.staff).toBeNull();
      const names = ctx.team.map((s) => s.displayName);
      expect(names).toContain("Nikos");
      expect(names).not.toContain("Dimitris"); // payouts not set up
    }
  });

  it("reports unassigned cards and not-ready staff", async () => {
    expect((await getTipPageContext("spare-1"))?.state).toBe("inactive");
    expect((await getTipPageContext("dimitris"))?.state).toBe("not-ready");
    expect(await getTipPageContext("does-not-exist")).toBeNull();
  });
});

describe("tip lifecycle", () => {
  it("creates a pending tip with an unpublished review, then publishes both on payment", async () => {
    const started = await startTip({ code: "maria", staffId: "s_maria", ...base });
    expect(started.provider).toBe("demo");

    const pending = await repo().getTip(started.tipId);
    expect(pending?.status).toBe("pending");
    expect((await repo().getReviewByTip(started.tipId))?.published).toBe(false);

    expect(await syncTipStatus(started.tipId, started.token)).toBe("succeeded");
    expect((await repo().getReviewByTip(started.tipId))?.published).toBe(true);

    const thanks = await getThanksContext(started.tipId, started.token);
    expect(thanks?.tip.amountCents).toBe(300);
    expect(thanks?.review?.rating).toBe(5);
  });

  it("never lets a personal card pay someone else", async () => {
    await expect(startTip({ code: "maria", staffId: "s_nikos", ...base })).rejects.toBeInstanceOf(TipError);
  });

  it("rejects staff who can't receive payouts yet", async () => {
    await expect(startTip({ code: "dimitris", staffId: "s_dimitris", ...base })).rejects.toMatchObject({ code: "not_ready" });
  });

  it("requires the tip token for follow-up actions", async () => {
    const { tipId, token } = await startTip({ code: "bar", staffId: "s_eleni", ...base, rating: null, comment: null });
    await syncTipStatus(tipId, token);
    expect(await saveReview(tipId, "forged-token-value", 5, "Great")).toBe(false);
    expect(await recordGoogleClick(tipId, "forged-token-value")).toBe(false);

    expect(await saveReview(tipId, token, 5, "Great")).toBe(true);
    expect(await recordGoogleClick(tipId, token)).toBe(true);
    const review = await repo().getReviewByTip(tipId);
    expect(review).toMatchObject({ rating: 5, comment: "Great", googleClicked: true, published: true });
  });
});
