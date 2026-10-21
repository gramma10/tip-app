import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

let admin: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS, so only call it after authorising the request. */
export function supabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    throw new Error("Supabase is not configured");
  }
  admin ??= createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
