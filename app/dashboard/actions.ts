"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { generateCode } from "@/lib/utils";

const STAFF_COLORS = ["#B83280", "#2B6CB0", "#0F766E", "#6B46C1", "#B7791F", "#C05621", "#2F855A", "#9B2C2C", "#2C7A7B", "#553C9A"];

/** Every mutation re-derives the venue from the session; ids from the client are only trusted after this check. */
async function ownedStaff(staffId: string) {
  const session = await requireMember();
  const staff = await repo().getStaff(staffId);
  if (!staff || staff.venueId !== session.venueId) throw new Error("Not found");
  return { session, staff };
}

async function ownedCard(cardId: string) {
  const session = await requireMember();
  const card = await repo().getCard(cardId);
  if (!card || card.venueId !== session.venueId) throw new Error("Not found");
  return { session, card };
}

export async function inviteStaff(input: { name: string; role: string }) {
  const session = await requireMember();
  const parsed = z
    .object({ name: z.string().trim().min(1).max(40), role: z.string().trim().max(30) })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const existing = await repo().listStaff(session.venueId);
  const token = crypto.randomUUID().replace(/-/g, "");
  const staff = await repo().createStaff({
    venueId: session.venueId,
    displayName: parsed.data.name,
    roleLabel: parsed.data.role,
    color: STAFF_COLORS[existing.length % STAFF_COLORS.length]!,
    inviteToken: token,
  });
  // Every new person gets their own card straight away.
  await repo().createCard({
    venueId: session.venueId,
    code: generateCode(),
    label: parsed.data.name,
    kind: "staff",
    assignedStaffId: staff.id,
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true as const, url: `${env.appUrl}/join/${token}` };
}

export async function setStaffActive(staffId: string, active: boolean) {
  const { staff } = await ownedStaff(staffId);
  await repo().updateStaff(staff.id, { active });
  if (!active) {
    // Free their personal cards so they can be handed to someone else.
    const cards = await repo().listCards(staff.venueId);
    for (const c of cards.filter((c) => c.assignedStaffId === staff.id)) {
      await repo().updateCard(c.id, { assignedStaffId: null });
    }
  }
  revalidatePath("/dashboard", "layout");
}

export async function createCard(input: { label: string; kind: "staff" | "venue"; staffId: string | null }) {
  const session = await requireMember();
  const parsed = z
    .object({ label: z.string().trim().min(1).max(60), kind: z.enum(["staff", "venue"]), staffId: z.string().nullable() })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const };
  let assigned: string | null = null;
  if (parsed.data.kind === "staff" && parsed.data.staffId) {
    assigned = (await ownedStaff(parsed.data.staffId)).staff.id;
  }
  await repo().createCard({
    venueId: session.venueId,
    code: generateCode(),
    label: parsed.data.label,
    kind: parsed.data.kind,
    assignedStaffId: assigned,
  });
  revalidatePath("/dashboard/cards");
  return { ok: true as const };
}

export async function assignCard(cardId: string, staffId: string | null) {
  const { card } = await ownedCard(cardId);
  if (card.kind !== "staff") return;
  const target = staffId ? (await ownedStaff(staffId)).staff.id : null;
  await repo().updateCard(card.id, { assignedStaffId: target });
  revalidatePath("/dashboard", "layout");
}

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  city: z.string().trim().max(60),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  googlePlaceId: z.string().trim().max(200),
  presets: z.array(z.number().min(1).max(150)).length(3),
});

export async function updateSettings(input: z.input<typeof settingsSchema>) {
  const session = await requireMember();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const d = parsed.data;
  await repo().updateVenue(session.venueId, {
    name: d.name,
    city: d.city || null,
    accentColor: d.accentColor,
    googlePlaceId: d.googlePlaceId || null,
    tipPresets: [...new Set(d.presets.map((p) => Math.round(p * 100)))].sort((a, b) => a - b),
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true as const };
}
