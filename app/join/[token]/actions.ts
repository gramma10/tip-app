"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";

export async function acceptInvite(token: string) {
  const staff = await repo().getStaffByInvite(token);
  if (!staff || !staff.active) redirect(`/join/${token}`);

  if (!isSupabaseConfigured) {
    const userId = `u_${staff.id}`;
    await repo().updateStaff(staff.id, { userId, inviteToken: null });
    (await cookies()).set(DEMO_SESSION_COOKIE, userId, { path: "/", httpOnly: true, sameSite: "lax" });
    redirect("/me");
  }

  const session = await getSession();
  if (!session) redirect(`/login?next=/join/${token}`);
  // An account that already belongs to a venue can't silently become someone's staff profile.
  if (session.kind !== "new") redirect(session.kind === "staff" ? "/me" : "/dashboard");
  await repo().updateStaff(staff.id, { userId: session.userId, inviteToken: null });
  redirect("/me");
}
