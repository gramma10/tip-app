import type { Card, Member, Review, Staff, Tip, Venue } from "../types";
import { computeTipBreakdown } from "../fees";

export type DemoDb = {
  venues: Venue[];
  members: Member[];
  staff: Staff[];
  cards: Card[];
  tips: Tip[];
  reviews: Review[];
};

export const DEMO_VENUE_ID = "v_thalassa";
export const DEMO_OWNER_USER_ID = "u_owner";

/** Deterministic PRNG so the demo looks the same on every restart. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    if ((r -= w) <= 0) return item;
  }
  return items[items.length - 1]![0];
}

const COMMENTS: Record<"high" | "mid" | "low", string[]> = {
  high: [
    "Super friendly and fast, thank you!",
    "Our room was spotless every single day",
    "Πολύ ευγενική εξυπηρέτηση!",
    "Τέλεια ατμόσφαιρα και πάντα με χαμόγελο",
    "Remembered our order from yesterday",
    "Great tips for dinner in town, booked everything for us",
    "Άψογοι, θα ξαναέρθουμε σίγουρα",
    "Lovely service at sunset",
    "Made our kids feel so welcome",
    "The cocktails were perfect",
    "Γρήγοροι και πολύ φιλικοί",
    "Early check-in sorted in two minutes, thank you",
  ],
  mid: [
    "Good service, a bit slow at check-in",
    "Nice, drinks came quickly",
    "Καλή εξυπηρέτηση, λίγη αναμονή",
    "Friendly, but the room was ready a little late",
  ],
  low: [
    "We waited 20 minutes at the pool bar",
    "Our order came wrong twice",
    "Αργή εξυπηρέτηση σήμερα",
    "Towels were not changed when we asked",
    "Η παραγγελία ήρθε κρύα",
  ],
};

const MANAGER_MESSAGES = [
  "The sunbed area wasn't cleaned when we arrived.",
  "We asked twice for extra pillows and they never came.",
  "Δεν μας ενημέρωσαν ότι η κουζίνα είχε κλείσει.",
];

const STAFF_SPEC = [
  { id: "s_maria", name: "Maria", role: "Housekeeping", color: "#B83280", weight: 1.3, quality: 0.99 },
  { id: "s_nikos", name: "Nikos", role: "Pool Bar", color: "#2B6CB0", weight: 1.1, quality: 0.9 },
  { id: "s_eleni", name: "Eleni", role: "Reception", color: "#0F766E", weight: 1.0, quality: 0.82 },
  { id: "s_giorgos", name: "Giorgos", role: "Restaurant", color: "#6B46C1", weight: 0.8, quality: 0.6 },
  { id: "s_sofia", name: "Sofia", role: "Concierge", color: "#B7791F", weight: 0.6, quality: 0.76 },
] as const;

const HOURS: readonly (readonly [number, number])[] = [
  [10, 2], [11, 4], [12, 6], [13, 8], [14, 8], [15, 6], [16, 4], [17, 4],
  [18, 6], [19, 8], [20, 9], [21, 8], [22, 6], [23, 3],
];

const AMOUNTS: readonly (readonly [number, number])[] = [
  [100, 6], [150, 5], [200, 14], [250, 4], [300, 10], [500, 9], [1000, 3], [2000, 1],
];

export function createDemoDb(now = new Date()): DemoDb {
  const rand = mulberry32(20260616);
  const iso = (d: Date) => d.toISOString();
  const createdAt = iso(new Date(now.getTime() - 200 * 86400_000));

  const venue: Venue = {
    id: DEMO_VENUE_ID,
    name: "Thalassa Beach Hotel",
    city: "Naxos",
    accentColor: "#0A66FF",
    googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    tipPresets: [200, 300, 500],
    mode: "individual",
    payeeMode: "staff",
    stripeAccountId: null,
    currency: "eur",
    createdAt,
  };

  const staff: Staff[] = [
    ...STAFF_SPEC.map((s) => ({
      id: s.id,
      venueId: venue.id,
      userId: `u_${s.id.slice(2)}`,
      displayName: s.name,
      roleLabel: s.role,
      photoUrl: null,
      color: s.color,
      stripeAccountId: `acct_demo_${s.id.slice(2)}`,
      payoutsEnabled: true,
      active: true,
      inviteToken: null,
      createdAt,
    })),
    {
      id: "s_dimitris",
      venueId: venue.id,
      userId: "u_dimitris",
      displayName: "Dimitris",
      roleLabel: "Pool Bar",
      photoUrl: null,
      color: "#C05621",
      stripeAccountId: null,
      payoutsEnabled: false,
      active: true,
      inviteToken: null,
      createdAt,
    },
    {
      id: "s_katerina",
      venueId: venue.id,
      userId: null,
      displayName: "Katerina",
      roleLabel: "Housekeeping",
      photoUrl: null,
      color: "#2F855A",
      stripeAccountId: null,
      payoutsEnabled: false,
      active: true,
      inviteToken: "demo-invite-katerina",
      createdAt,
    },
  ];

  const card = (id: string, code: string, label: string, kind: Card["kind"], staffId: string | null): Card => ({
    id,
    venueId: venue.id,
    code,
    label,
    kind,
    assignedStaffId: staffId,
    createdAt,
  });

  const cards: Card[] = [
    ...STAFF_SPEC.map((s) => card(`c_${s.id.slice(2)}`, s.id.slice(2), `${s.name}'s card`, "staff", s.id)),
    card("c_dimitris", "dimitris", "Dimitris's card", "staff", "s_dimitris"),
    card("c_bar", "bar", "Pool bar", "venue", null),
    card("c_room204", "room-204", "Room 204", "venue", null),
    card("c_table7", "table-7", "Table 7", "venue", null),
    card("c_spare", "spare-1", "Spare card", "staff", null),
  ];

  const tips: Tip[] = [];
  const reviews: Review[] = [];
  const days = 120;

  for (let d = days; d >= 0; d--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - d);
    const weekday = day.getDay();
    const weekend = weekday === 0 || weekday === 5 || weekday === 6;
    // Gentle growth towards today, so trends read as "up".
    const growth = 0.75 + 0.35 * (1 - d / days);
    const base = (weekend ? 30 : 19) * growth;

    for (const s of STAFF_SPEC) {
      const count = Math.round((base * s.weight) / 4.8 + (rand() - 0.5) * 3);
      for (let i = 0; i < Math.max(0, count); i++) {
        const at = new Date(day);
        at.setHours(pick(rand, HOURS), Math.floor(rand() * 60), Math.floor(rand() * 60));
        if (at > now) continue;

        const amount = pick(rand, AMOUNTS);
        const cover = rand() < 0.7;
        const fees = computeTipBreakdown(amount, cover);
        const tipId = `t_${tips.length + 1}`;
        tips.push({
          id: tipId,
          venueId: venue.id,
          staffId: s.id,
          cardId: rand() < 0.85 ? `c_${s.id.slice(2)}` : "c_bar",
          amountCents: amount,
          feeCoverCents: fees.feeCoverCents,
          platformFeeCents: fees.applicationFeeCents,
          currency: "eur",
          provider: "demo",
          providerRef: `demo_${tipId}`,
          status: "succeeded",
          createdAt: iso(at),
          paidAt: iso(at),
        });

        if (rand() < 0.68) {
          const r = rand();
          // Higher quality shifts mass towards 5★; the remainder falls to 3★ and below.
          const rating =
            r < s.quality * s.quality * 0.85
              ? 5
              : r < s.quality
                ? 4
                : r < s.quality + (1 - s.quality) * 0.6
                  ? 3
                  : r < s.quality + (1 - s.quality) * 0.9
                    ? 2
                    : 1;
          const bucket = rating >= 5 ? "high" : rating === 4 ? (rand() < 0.5 ? "high" : "mid") : "low";
          const comment = rand() < (rating <= 3 ? 0.8 : 0.35) ? COMMENTS[bucket][Math.floor(rand() * COMMENTS[bucket].length)]! : null;
          reviews.push({
            id: `r_${reviews.length + 1}`,
            tipId,
            venueId: venue.id,
            staffId: s.id,
            rating,
            comment,
            published: true,
            googleClicked: rand() < (rating >= 5 ? 0.42 : rating === 4 ? 0.2 : 0.04),
            managerMessage:
              rating <= 3 && rand() < 0.35
                ? MANAGER_MESSAGES[Math.floor(rand() * MANAGER_MESSAGES.length)]!
                : null,
            createdAt: iso(at),
          });
        }
      }
    }
  }

  tips.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  reviews.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    venues: [venue],
    members: [{ userId: DEMO_OWNER_USER_ID, venueId: venue.id, role: "owner" }],
    staff,
    cards,
    tips,
    reviews,
  };
}
