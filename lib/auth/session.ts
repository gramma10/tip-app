import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { repo } from "../data";
import { DEMO_OWNER_USER_ID } from "../data/demo-seed";
import { isSupabaseConfigured } from "../env";
import { supabaseServer } from "../supabase/server";
import type { MemberRole } from "../types";

export const DEMO_SESSION_COOKIE = "kerasma_demo_user";

export type Session =
  | { kind: "member"; userId: string; email: string | null; venueId: string; role: MemberRole }
  | { kind: "staff"; userId: string; email: string | null; venueId: string; staffId: string }
  /** Signed in, but not yet part of a venue (new owner before onboarding). */
  | { kind: "new"; userId: string; email: string | null };

async function currentUser(): Promise<{ id: string; email: string | null } | null> {
  if (!isSupabaseConfigured) {
    const id = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
    return id ? { id, email: null } : null;
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const user = await currentUser();
  if (!user) return null;

  const membership = await repo().getMembership(user.id);
  if (membership) {
    return {
      kind: "member",
      userId: user.id,
      email: user.email,
      venueId: membership.venueId,
      role: membership.role,
    };
  }
  const staff = await repo().getStaffByUser(user.id);
  if (staff && staff.active) {
    return { kind: "staff", userId: user.id, email: user.email, venueId: staff.venueId, staffId: staff.id };
  }
  return { kind: "new", userId: user.id, email: user.email };
});

export async function requireMember() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.kind === "staff") redirect("/me");
  if (session.kind === "new") redirect("/onboarding");
  return session;
}

export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login?next=/me");
  if (session.kind === "member") redirect("/dashboard");
  if (session.kind === "new") redirect("/login");
  return session;
}

export { DEMO_OWNER_USER_ID };
