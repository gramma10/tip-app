import type { Card, Member, Review, Staff, Tip, TipStatus, Venue } from "../types";

export type TipFilter = {
  venueId?: string;
  staffId?: string;
  since?: Date;
  status?: TipStatus;
};

export type ReviewFilter = {
  venueId?: string;
  staffId?: string;
  since?: Date;
  publishedOnly?: boolean;
};

export type NewTip = Omit<Tip, "id" | "createdAt" | "paidAt" | "status">;
export type NewReview = Pick<Review, "tipId" | "venueId" | "staffId" | "rating" | "comment">;
export type NewStaff = Pick<Staff, "venueId" | "displayName" | "roleLabel" | "color" | "inviteToken">;
export type NewCard = Pick<Card, "venueId" | "code" | "label" | "kind" | "assignedStaffId">;

export type VenuePatch = Partial<
  Pick<Venue, "name" | "city" | "accentColor" | "googlePlaceId" | "tipPresets" | "stripeAccountId">
>;
export type StaffPatch = Partial<
  Pick<
    Staff,
    | "displayName"
    | "roleLabel"
    | "photoUrl"
    | "color"
    | "stripeAccountId"
    | "payoutsEnabled"
    | "active"
    | "userId"
    | "inviteToken"
  >
>;
export type CardPatch = Partial<Pick<Card, "label" | "assignedStaffId">>;
export type TipPatch = Partial<Pick<Tip, "status" | "providerRef" | "paidAt">>;
export type ReviewPatch = Partial<
  Pick<Review, "rating" | "comment" | "published" | "googleClicked" | "managerMessage">
>;

/**
 * Thin data access. Authorization happens in the service layer (lib/services),
 * which always scopes calls by the signed-in user's venue or staff id.
 */
export interface Repo {
  getVenue(id: string): Promise<Venue | null>;
  /** Creates a venue and makes the user its owner. */
  createVenue(input: { name: string; city: string | null }, ownerUserId: string): Promise<Venue>;
  updateVenue(id: string, patch: VenuePatch): Promise<Venue>;

  getMembership(userId: string): Promise<Member | null>;

  getStaff(id: string): Promise<Staff | null>;
  getStaffByUser(userId: string): Promise<Staff | null>;
  getStaffByInvite(token: string): Promise<Staff | null>;
  getStaffByStripeAccount(accountId: string): Promise<Staff | null>;
  listStaff(venueId: string): Promise<Staff[]>;
  createStaff(input: NewStaff): Promise<Staff>;
  updateStaff(id: string, patch: StaffPatch): Promise<Staff>;

  getCard(id: string): Promise<Card | null>;
  getCardByCode(code: string): Promise<Card | null>;
  listCards(venueId: string): Promise<Card[]>;
  createCard(input: NewCard): Promise<Card>;
  updateCard(id: string, patch: CardPatch): Promise<Card>;

  createTip(input: NewTip): Promise<Tip>;
  getTip(id: string): Promise<Tip | null>;
  getTipByProviderRef(ref: string): Promise<Tip | null>;
  updateTip(id: string, patch: TipPatch): Promise<Tip>;
  listTips(filter: TipFilter): Promise<Tip[]>;

  createReview(input: NewReview): Promise<Review>;
  getReviewByTip(tipId: string): Promise<Review | null>;
  updateReview(id: string, patch: ReviewPatch): Promise<Review>;
  listReviews(filter: ReviewFilter): Promise<Review[]>;
}
