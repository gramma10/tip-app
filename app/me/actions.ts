"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

const photoSchema = z.object({
  // The browser has already resized to 384px JPEG, so this stays small.
  dataUrl: z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/).max(300_000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function updatePhoto(input: z.input<typeof photoSchema>) {
  const session = await requireStaff();
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  let photoUrl = parsed.data.dataUrl;
  if (isSupabaseConfigured) {
    const bytes = Buffer.from(parsed.data.dataUrl.split(",")[1]!, "base64");
    const path = `${session.staffId}/${Date.now()}.jpg`;
    const storage = supabaseAdmin().storage.from("staff-photos");
    const { error } = await storage.upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (error) return { ok: false as const };
    photoUrl = storage.getPublicUrl(path).data.publicUrl;
  }

  await repo().updateStaff(session.staffId, { photoUrl, color: parsed.data.color });
  revalidatePath("/me", "layout");
  return { ok: true as const };
}
