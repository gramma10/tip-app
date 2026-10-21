"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { MAX_TIP_CENTS, MIN_TIP_CENTS } from "@/lib/fees";
import { rateLimit } from "@/lib/rate-limit";
import {
  recordGoogleClick,
  saveReview,
  startTip,
  syncTipStatus,
  TipError,
  type StartTipResult,
} from "@/lib/services/tips";
import type { TipStatus } from "@/lib/types";

async function clientKey(scope: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

const startSchema = z.object({
  code: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64),
  amountCents: z.number().int().min(MIN_TIP_CENTS).max(MAX_TIP_CENTS),
  coverFees: z.boolean(),
  rating: z.number().int().min(1).max(5).nullable(),
  comment: z.string().trim().max(500).nullable(),
});

export type StartTipResponse =
  | ({ ok: true } & StartTipResult)
  | { ok: false; error: "invalid" | "not_ready" | "rate_limited" | "payment" | "not_found" };

export async function startTipAction(input: z.input<typeof startSchema>): Promise<StartTipResponse> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!rateLimit(await clientKey("tip"), 12, 60_000)) return { ok: false, error: "rate_limited" };
  try {
    const result = await startTip({ ...parsed.data, comment: parsed.data.comment || null });
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof TipError) return { ok: false, error: err.code };
    console.error(err);
    return { ok: false, error: "payment" };
  }
}

const tokenSchema = z.object({ tipId: z.string().min(1).max(64), token: z.string().min(10).max(128) });

export async function confirmTipAction(input: z.input<typeof tokenSchema>): Promise<TipStatus | null> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) return null;
  return syncTipStatus(parsed.data.tipId, parsed.data.token);
}

const reviewSchema = tokenSchema.extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).nullable(),
});

export async function saveReviewAction(input: z.input<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return false;
  const { tipId, token, rating, comment } = parsed.data;
  return saveReview(tipId, token, rating, comment || null);
}

export async function googleClickAction(input: z.input<typeof tokenSchema>) {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) return false;
  return recordGoogleClick(parsed.data.tipId, parsed.data.token);
}
