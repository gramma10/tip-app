export type Locale = "el" | "en";

export type VenueMode = "individual" | "pool";
/** Who receives the money: each staff member's own payout account, or the venue's account. */
export type PayeeMode = "staff" | "venue";

export type Venue = {
  id: string;
  name: string;
  city: string | null;
  accentColor: string;
  googlePlaceId: string | null;
  /** Preset tip amounts in cents, shown as chips on the tip page. */
  tipPresets: number[];
  mode: VenueMode;
  payeeMode: PayeeMode;
  stripeAccountId: string | null;
  currency: "eur";
  createdAt: string;
};

export type Staff = {
  id: string;
  venueId: string;
  userId: string | null;
  displayName: string;
  roleLabel: string;
  photoUrl: string | null;
  /** Dominant colour of the photo (or a picked colour) used for the tip page header. */
  color: string;
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  active: boolean;
  inviteToken: string | null;
  createdAt: string;
};

/** "staff" cards point at one person; "venue" cards (tables, bar) let the guest pick who served them. */
export type CardKind = "staff" | "venue";

export type Card = {
  id: string;
  venueId: string;
  code: string;
  label: string;
  kind: CardKind;
  assignedStaffId: string | null;
  createdAt: string;
};

export type TipStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PaymentProviderId = "stripe" | "demo";

export type Tip = {
  id: string;
  venueId: string;
  staffId: string;
  cardId: string | null;
  /** The tip itself, excluding any fee cover. */
  amountCents: number;
  /** Optional amount the guest added to cover processing so staff get the full tip. */
  feeCoverCents: number;
  /** What the platform keeps (processing + take rate). */
  platformFeeCents: number;
  currency: "eur";
  provider: PaymentProviderId;
  providerRef: string | null;
  status: TipStatus;
  createdAt: string;
  paidAt: string | null;
};

export type Review = {
  id: string;
  tipId: string;
  venueId: string;
  staffId: string;
  rating: number | null;
  comment: string | null;
  /** Only reviews attached to a paid tip are published to dashboards. */
  published: boolean;
  googleClicked: boolean;
  managerMessage: string | null;
  createdAt: string;
};

export type MemberRole = "owner" | "manager";

export type Member = {
  userId: string;
  venueId: string;
  role: MemberRole;
};
