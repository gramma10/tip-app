import "server-only";
import { isSupabaseConfigured } from "../env";
import { demoRepo } from "./demo-repo";
import type { Repo } from "./repo";
import { supabaseRepo } from "./supabase-repo";

export function repo(): Repo {
  return isSupabaseConfigured ? supabaseRepo : demoRepo;
}
