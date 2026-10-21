import "server-only";
import { ratingStats } from "../analytics";
import { repo } from "../data";
import { env } from "../env";
import { computeTipBreakdown, DEFAULT_FEES, type FeeConfig } from "../fees";
import { paymentProvider, providerFor } from "../payments";
import { signTipToken, verifyTipToken } from "../tokens";
import type { Card, PaymentProviderId, Review, Staff, Tip, TipStatus, Venue } from "../types";

export const feeConfig: FeeConfig = { ...DEFAULT_FEES, takeRate: env.takeRate };

export type PublicStaff = {
  id: string;
  displayName: string;
  roleLabel: string;
  photoUrl: string | null;
  color: string;
  avgRating: number | null;
  ratingCount: number;
};

export type PublicVenue = Pick<Venue, "id" | "name" | "city" | "accentColor" | "tipPresets" | "googlePlaceId">;

export type TipPageContext =
  | { state: "inactive"; venue: PublicVenue }
  | { state: "not-ready"; venue: PublicVenue; staff: PublicStaff }
  | { state: "ready"; venue: PublicVenue; card: Pick<Card, "code" | "kind">; staff: PublicStaff | null; team: PublicStaff[] };

function canReceive(staff: Staff, venue: Venue) {
  if (!staff.active) return false;
  if (venue.payeeMode === "venue") return Boolean(venue.stripeAccountId) || paymentProvider().id === "demo";
  return staff.payoutsEnabled && Boolean(staff.stripeAccountId);
}

function destinationFor(staff: Staff, venue: Venue) {
  return venue.payeeMode === "venue" ? venue.stripeAccountId : staff.stripeAccountId;
}

const publicVenue = (v: Venue): PublicVenue => ({
  id: v.id,
  name: v.name,
  city: v.city,
  accentColor: v.accentColor,
  tipPresets: v.tipPresets,
  googlePlaceId: v.googlePlaceId,
});

async function toPublicStaff(s: Staff): Promise<PublicStaff> {
  const stats = ratingStats(await repo().listReviews({ staffId: s.id, publishedOnly: true }));
  return {
    id: s.id,
    displayName: s.displayName,
    roleLabel: s.roleLabel,
    photoUrl: s.photoUrl,
    color: s.color,
    avgRating: stats.avg,
    ratingCount: stats.count,
  };
}

export async function getTipPageContext(code: string): Promise<TipPageContext | null> {
  const card = await repo().getCardByCode(code);
  if (!card) return null;
  const venue = await repo().getVenue(card.venueId);
  if (!venue) return null;

  if (card.kind === "staff") {
    const staff = card.assignedStaffId ? await repo().getStaff(card.assignedStaffId) : null;
    if (!staff || !staff.active) return { state: "inactive", venue: publicVenue(venue) };
    const pub = await toPublicStaff(staff);
    if (!canReceive(staff, venue)) return { state: "not-ready", venue: publicVenue(venue), staff: pub };
    return { state: "ready", venue: publicVenue(venue), card: { code: card.code, kind: card.kind }, staff: pub, team: [] };
  }

  const team = (await repo().listStaff(venue.id)).filter((s) => canReceive(s, venue));
  if (!team.length) return { state: "inactive", venue: publicVenue(venue) };
  return {
    state: "ready",
    venue: publicVenue(venue),
    card: { code: card.code, kind: card.kind },
    staff: null,
    team: await Promise.all(team.map(toPublicStaff)),
  };
}

export class TipError extends Error {
  constructor(public code: "not_found" | "not_ready" | "invalid" | "payment") {
    super(code);
  }
}

export type StartTipInput = {
  code: string;
  staffId: string;
  amountCents: number;
  coverFees: boolean;
  rating: number | null;
  comment: string | null;
};

export type StartTipResult = {
  tipId: string;
  token: string;
  provider: PaymentProviderId;
  clientSecret: string | null;
  totalCents: number;
};

export async function startTip(input: StartTipInput): Promise<StartTipResult> {
  const card = await repo().getCardByCode(input.code);
  if (!card) throw new TipError("not_found");
  const venue = await repo().getVenue(card.venueId);
  const staff = await repo().getStaff(input.staffId);
  if (!venue || !staff || staff.venueId !== venue.id) throw new TipError("not_found");
  // A personal card only ever pays the person it's assigned to.
  if (card.kind === "staff" && card.assignedStaffId !== staff.id) throw new TipError("invalid");
  if (!canReceive(staff, venue)) throw new TipError("not_ready");

  const fees = computeTipBreakdown(input.amountCents, input.coverFees, feeConfig);
  const provider = paymentProvider();

  const tip = await repo().createTip({
    venueId: venue.id,
    staffId: staff.id,
    cardId: card.id,
    amountCents: fees.tipCents,
    feeCoverCents: fees.feeCoverCents,
    platformFeeCents: fees.applicationFeeCents,
    currency: "eur",
    provider: provider.id,
    providerRef: null,
  });

  if (input.rating != null || input.comment) {
    await repo().createReview({
      tipId: tip.id,
      venueId: venue.id,
      staffId: staff.id,
      rating: input.rating,
      comment: input.comment,
    });
  }

  try {
    const payment = await provider.createPayment({
      tipId: tip.id,
      totalCents: fees.totalCents,
      applicationFeeCents: fees.applicationFeeCents,
      destinationAccountId: destinationFor(staff, venue) ?? "",
      description: `Tip for ${staff.displayName} at ${venue.name}`,
      metadata: { venueId: venue.id, staffId: staff.id, cardId: card.id },
    });
    await repo().updateTip(tip.id, { providerRef: payment.providerRef });
    return {
      tipId: tip.id,
      token: signTipToken(tip.id),
      provider: provider.id,
      clientSecret: payment.clientSecret,
      totalCents: fees.totalCents,
    };
  } catch (err) {
    await repo().updateTip(tip.id, { status: "failed" });
    console.error("createPayment failed", err);
    throw new TipError("payment");
  }
}

/** Idempotent: safe to call from the webhook, the thanks page and the client confirm. */
export async function markTipSucceeded(tip: Tip) {
  if (tip.status === "succeeded") return tip;
  const updated = await repo().updateTip(tip.id, { status: "succeeded", paidAt: new Date().toISOString() });
  const review = await repo().getReviewByTip(tip.id);
  if (review && !review.published) await repo().updateReview(review.id, { published: true });
  return updated;
}

export async function markTipFailed(tip: Tip) {
  if (tip.status !== "pending") return tip;
  return repo().updateTip(tip.id, { status: "failed" });
}

async function authorizedTip(tipId: string, token: string) {
  if (!verifyTipToken(tipId, token)) return null;
  return repo().getTip(tipId);
}

/** Syncs with the payment provider and returns the latest status. */
export async function syncTipStatus(tipId: string, token: string): Promise<TipStatus | null> {
  const tip = await authorizedTip(tipId, token);
  if (!tip) return null;
  if (tip.status !== "pending" || !tip.providerRef) return tip.status;
  const status = await providerFor(tip.provider).getPaymentStatus(tip.providerRef);
  if (status === "succeeded") return (await markTipSucceeded(tip)).status;
  if (status === "failed") return (await markTipFailed(tip)).status;
  return "pending";
}

export type ThanksContext = {
  tip: Pick<Tip, "id" | "amountCents" | "status">;
  staff: PublicStaff;
  venue: PublicVenue;
  review: Pick<Review, "rating" | "comment"> | null;
};

export async function getThanksContext(tipId: string, token: string): Promise<ThanksContext | null> {
  const status = await syncTipStatus(tipId, token);
  if (!status) return null;
  const tip = (await repo().getTip(tipId))!;
  const [staff, venue, review] = await Promise.all([
    repo().getStaff(tip.staffId),
    repo().getVenue(tip.venueId),
    repo().getReviewByTip(tip.id),
  ]);
  if (!staff || !venue) return null;
  return {
    tip: { id: tip.id, amountCents: tip.amountCents, status: tip.status },
    staff: await toPublicStaff(staff),
    venue: publicVenue(venue),
    review: review ? { rating: review.rating, comment: review.comment } : null,
  };
}

export async function saveReview(tipId: string, token: string, rating: number, comment: string | null) {
  const tip = await authorizedTip(tipId, token);
  if (!tip) return false;
  const existing = await repo().getReviewByTip(tipId);
  const published = tip.status === "succeeded";
  if (existing) {
    await repo().updateReview(existing.id, { rating, comment: comment ?? existing.comment, published });
  } else {
    const r = await repo().createReview({ tipId, venueId: tip.venueId, staffId: tip.staffId, rating, comment });
    if (published) await repo().updateReview(r.id, { published: true });
  }
  return true;
}

export async function recordGoogleClick(tipId: string, token: string) {
  const tip = await authorizedTip(tipId, token);
  if (!tip) return false;
  const review =
    (await repo().getReviewByTip(tipId)) ??
    (await repo().createReview({ tipId, venueId: tip.venueId, staffId: tip.staffId, rating: null, comment: null }));
  await repo().updateReview(review.id, { googleClicked: true, published: tip.status === "succeeded" });
  return true;
}
