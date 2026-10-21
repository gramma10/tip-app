import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import type { Card, Member, Review, Staff, Tip, Venue } from "../types";
import type { Repo } from "./repo";

/* Row shapes (snake_case) <-> domain types (camelCase). */

type Row = Record<string, unknown>;

const toVenue = (r: Row): Venue => ({
  id: r.id as string,
  name: r.name as string,
  city: (r.city as string) ?? null,
  accentColor: r.accent_color as string,
  googlePlaceId: (r.google_place_id as string) ?? null,
  tipPresets: (r.tip_presets as number[]) ?? [200, 300, 500],
  mode: r.mode as Venue["mode"],
  payeeMode: r.payee_mode as Venue["payeeMode"],
  stripeAccountId: (r.stripe_account_id as string) ?? null,
  currency: "eur",
  createdAt: r.created_at as string,
});

const toStaff = (r: Row): Staff => ({
  id: r.id as string,
  venueId: r.venue_id as string,
  userId: (r.user_id as string) ?? null,
  displayName: r.display_name as string,
  roleLabel: r.role_label as string,
  photoUrl: (r.photo_url as string) ?? null,
  color: r.color as string,
  stripeAccountId: (r.stripe_account_id as string) ?? null,
  payoutsEnabled: r.payouts_enabled as boolean,
  active: r.active as boolean,
  inviteToken: (r.invite_token as string) ?? null,
  createdAt: r.created_at as string,
});

const toCard = (r: Row): Card => ({
  id: r.id as string,
  venueId: r.venue_id as string,
  code: r.code as string,
  label: r.label as string,
  kind: r.kind as Card["kind"],
  assignedStaffId: (r.assigned_staff_id as string) ?? null,
  createdAt: r.created_at as string,
});

const toTip = (r: Row): Tip => ({
  id: r.id as string,
  venueId: r.venue_id as string,
  staffId: r.staff_id as string,
  cardId: (r.card_id as string) ?? null,
  amountCents: r.amount_cents as number,
  feeCoverCents: r.fee_cover_cents as number,
  platformFeeCents: r.platform_fee_cents as number,
  currency: "eur",
  provider: r.provider as Tip["provider"],
  providerRef: (r.provider_ref as string) ?? null,
  status: r.status as Tip["status"],
  createdAt: r.created_at as string,
  paidAt: (r.paid_at as string) ?? null,
});

const toReview = (r: Row): Review => ({
  id: r.id as string,
  tipId: r.tip_id as string,
  venueId: r.venue_id as string,
  staffId: r.staff_id as string,
  rating: (r.rating as number) ?? null,
  comment: (r.comment as string) ?? null,
  published: r.published as boolean,
  googleClicked: r.google_clicked as boolean,
  managerMessage: (r.manager_message as string) ?? null,
  createdAt: r.created_at as string,
});

const snake = (o: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]),
  );

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const sb = () => supabaseAdmin();

async function one<T>(table: string, column: string, value: string, map: (r: Row) => T) {
  const data = check(await sb().from(table).select("*").eq(column, value).maybeSingle());
  return data ? map(data as Row) : null;
}

async function update<T>(table: string, id: string, patch: Record<string, unknown>, map: (r: Row) => T) {
  return map(check(await sb().from(table).update(snake(patch)).eq("id", id).select().single()) as Row);
}

async function insert<T>(table: string, values: Record<string, unknown>, map: (r: Row) => T) {
  return map(check(await sb().from(table).insert(snake(values)).select().single()) as Row);
}

export const supabaseRepo: Repo = {
  getVenue: (id) => one("venues", "id", id, toVenue),
  async createVenue(input, ownerUserId) {
    const venue = await insert("venues", { name: input.name, city: input.city }, toVenue);
    check(await sb().from("venue_members").insert({ user_id: ownerUserId, venue_id: venue.id, role: "owner" }));
    return venue;
  },
  updateVenue: (id, patch) => update("venues", id, patch, toVenue),

  async getMembership(userId) {
    const data = check(
      await sb().from("venue_members").select("*").eq("user_id", userId).limit(1).maybeSingle(),
    ) as Row | null;
    return data
      ? ({ userId: data.user_id, venueId: data.venue_id, role: data.role } as Member)
      : null;
  },

  getStaff: (id) => one("staff", "id", id, toStaff),
  getStaffByUser: (userId) => one("staff", "user_id", userId, toStaff),
  getStaffByInvite: (token) => one("staff", "invite_token", token, toStaff),
  getStaffByStripeAccount: (acct) => one("staff", "stripe_account_id", acct, toStaff),
  async listStaff(venueId) {
    const rows = check(
      await sb().from("staff").select("*").eq("venue_id", venueId).order("created_at"),
    ) as Row[];
    return rows.map(toStaff);
  },
  createStaff: (input) => insert("staff", input, toStaff),
  updateStaff: (id, patch) => update("staff", id, patch, toStaff),

  getCard: (id) => one("cards", "id", id, toCard),
  getCardByCode: (code) => one("cards", "code", code.toLowerCase(), toCard),
  async listCards(venueId) {
    const rows = check(
      await sb().from("cards").select("*").eq("venue_id", venueId).order("created_at"),
    ) as Row[];
    return rows.map(toCard);
  },
  createCard: (input) => insert("cards", input, toCard),
  updateCard: (id, patch) => update("cards", id, patch, toCard),

  createTip: (input) => insert("tips", { ...input, status: "pending" }, toTip),
  getTip: (id) => one("tips", "id", id, toTip),
  getTipByProviderRef: (ref) => one("tips", "provider_ref", ref, toTip),
  updateTip: (id, patch) => update("tips", id, patch, toTip),
  async listTips(f) {
    let q = sb().from("tips").select("*").order("created_at", { ascending: true });
    if (f.venueId) q = q.eq("venue_id", f.venueId);
    if (f.staffId) q = q.eq("staff_id", f.staffId);
    if (f.status) q = q.eq("status", f.status);
    if (f.since) q = q.gte("created_at", f.since.toISOString());
    return (check(await q.limit(10_000)) as Row[]).map(toTip);
  },

  createReview: (input) => insert("reviews", input, toReview),
  getReviewByTip: (tipId) => one("reviews", "tip_id", tipId, toReview),
  updateReview: (id, patch) => update("reviews", id, patch, toReview),
  async listReviews(f) {
    let q = sb().from("reviews").select("*").order("created_at", { ascending: true });
    if (f.venueId) q = q.eq("venue_id", f.venueId);
    if (f.staffId) q = q.eq("staff_id", f.staffId);
    if (f.publishedOnly) q = q.eq("published", true);
    if (f.since) q = q.gte("created_at", f.since.toISOString());
    return (check(await q.limit(10_000)) as Row[]).map(toReview);
  },
};
