"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DEMO_OWNER_USER_ID, DEMO_VENUE_ID } from "@/lib/data/demo-seed";
import { env, isSupabaseConfigured } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

/** Only safe in-app paths may be used as post-login redirects. */
function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function demoSignIn(userId: string) {
  if (isSupabaseConfigured) return;
  const isOwner = userId === DEMO_OWNER_USER_ID;
  const staff = isOwner ? null : await repo().getStaffByUser(userId);
  if (!isOwner && (!staff || staff.venueId !== DEMO_VENUE_ID)) return;
  (await cookies()).set(DEMO_SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(isOwner ? "/dashboard" : "/me");
}

export type MagicLinkState = { status: "idle" | "sent" | "error"; email?: string };

export async function sendMagicLink(_prev: MagicLinkState, form: FormData): Promise<MagicLinkState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim());
  if (!email.success || !isSupabaseConfigured) return { status: "error" };
  const next = safeNext(form.get("next"), "/dashboard");
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("signInWithOtp", error.message);
    return { status: "error" };
  }
  return { status: "sent", email: email.data };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await (await supabaseServer()).auth.signOut();
  } else {
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  }
  redirect("/login");
}
