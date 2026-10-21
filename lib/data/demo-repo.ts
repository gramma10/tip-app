import "server-only";
import type { Card, Review, Staff, Tip, Venue } from "../types";
import { createDemoDb, type DemoDb } from "./demo-seed";
import type { Repo } from "./repo";

const globalForDemo = globalThis as unknown as { __kerasmaDemoDb?: DemoDb };

function db(): DemoDb {
  globalForDemo.__kerasmaDemoDb ??= createDemoDb();
  return globalForDemo.__kerasmaDemoDb;
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function mustFind<T extends { id: string }>(rows: T[], rowId: string, what: string): T {
  const row = rows.find((r) => r.id === rowId);
  if (!row) throw new Error(`${what} ${rowId} not found`);
  return row;
}

/** Returns copies so callers can't mutate the store by accident. */
const clone = <T>(v: T): T => structuredClone(v);

export const demoRepo: Repo = {
  async getVenue(venueId) {
    const v = db().venues.find((x) => x.id === venueId);
    return v ? clone(v) : null;
  },
  async createVenue(input, ownerUserId) {
    const v: Venue = {
      id: id("v"),
      name: input.name,
      city: input.city,
      accentColor: "#0A66FF",
      googlePlaceId: null,
      tipPresets: [200, 300, 500],
      mode: "individual",
      payeeMode: "staff",
      stripeAccountId: null,
      currency: "eur",
      createdAt: now(),
    };
    db().venues.push(v);
    db().members.push({ userId: ownerUserId, venueId: v.id, role: "owner" });
    return clone(v);
  },
  async updateVenue(venueId, patch) {
    const v = mustFind(db().venues, venueId, "Venue");
    Object.assign(v, patch);
    return clone(v);
  },

  async getMembership(userId) {
    const m = db().members.find((x) => x.userId === userId);
    return m ? clone(m) : null;
  },

  async getStaff(staffId) {
    const s = db().staff.find((x) => x.id === staffId);
    return s ? clone(s) : null;
  },
  async getStaffByUser(userId) {
    const s = db().staff.find((x) => x.userId === userId);
    return s ? clone(s) : null;
  },
  async getStaffByInvite(token) {
    const s = db().staff.find((x) => x.inviteToken === token);
    return s ? clone(s) : null;
  },
  async getStaffByStripeAccount(accountId) {
    const s = db().staff.find((x) => x.stripeAccountId === accountId);
    return s ? clone(s) : null;
  },
  async listStaff(venueId) {
    return clone(db().staff.filter((s) => s.venueId === venueId));
  },
  async createStaff(input) {
    const s: Staff = {
      ...input,
      id: id("s"),
      userId: null,
      photoUrl: null,
      stripeAccountId: null,
      payoutsEnabled: false,
      active: true,
      createdAt: now(),
    };
    db().staff.push(s);
    return clone(s);
  },
  async updateStaff(staffId, patch) {
    const s = mustFind(db().staff, staffId, "Staff");
    Object.assign(s, patch);
    return clone(s);
  },

  async getCard(cardId) {
    const c = db().cards.find((x) => x.id === cardId);
    return c ? clone(c) : null;
  },
  async getCardByCode(code) {
    const c = db().cards.find((x) => x.code === code.toLowerCase());
    return c ? clone(c) : null;
  },
  async listCards(venueId) {
    return clone(db().cards.filter((c) => c.venueId === venueId));
  },
  async createCard(input) {
    const c: Card = { ...input, id: id("c"), createdAt: now() };
    db().cards.push(c);
    return clone(c);
  },
  async updateCard(cardId, patch) {
    const c = mustFind(db().cards, cardId, "Card");
    Object.assign(c, patch);
    return clone(c);
  },

  async createTip(input) {
    const t: Tip = { ...input, id: id("t"), status: "pending", createdAt: now(), paidAt: null };
    db().tips.push(t);
    return clone(t);
  },
  async getTip(tipId) {
    const t = db().tips.find((x) => x.id === tipId);
    return t ? clone(t) : null;
  },
  async getTipByProviderRef(ref) {
    const t = db().tips.find((x) => x.providerRef === ref);
    return t ? clone(t) : null;
  },
  async updateTip(tipId, patch) {
    const t = mustFind(db().tips, tipId, "Tip");
    Object.assign(t, patch);
    return clone(t);
  },
  async listTips(f) {
    const since = f.since?.toISOString();
    return clone(
      db().tips.filter(
        (t) =>
          (!f.venueId || t.venueId === f.venueId) &&
          (!f.staffId || t.staffId === f.staffId) &&
          (!f.status || t.status === f.status) &&
          (!since || t.createdAt >= since),
      ),
    );
  },

  async createReview(input) {
    const r: Review = {
      ...input,
      id: id("r"),
      published: false,
      googleClicked: false,
      managerMessage: null,
      createdAt: now(),
    };
    db().reviews.push(r);
    return clone(r);
  },
  async getReviewByTip(tipId) {
    const r = db().reviews.find((x) => x.tipId === tipId);
    return r ? clone(r) : null;
  },
  async updateReview(reviewId, patch) {
    const r = mustFind(db().reviews, reviewId, "Review");
    Object.assign(r, patch);
    return clone(r);
  },
  async listReviews(f) {
    const since = f.since?.toISOString();
    return clone(
      db().reviews.filter(
        (r) =>
          (!f.venueId || r.venueId === f.venueId) &&
          (!f.staffId || r.staffId === f.staffId) &&
          (!f.publishedOnly || r.published) &&
          (!since || r.createdAt >= since),
      ),
    );
  },
};
