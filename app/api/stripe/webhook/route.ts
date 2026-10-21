import type Stripe from "stripe";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { stripe } from "@/lib/payments/stripe";
import { markTipFailed, markTipSucceeded } from "@/lib/services/tips";

/**
 * Stripe → app. Handlers are idempotent because Stripe retries and may
 * deliver events out of order. Configure in the Stripe dashboard with:
 * payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled,
 * charge.refunded, account.updated (Connect).
 */
export async function POST(request: Request) {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return new Response("Stripe is not configured", { status: 501 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret);
  } catch (err) {
    console.warn("Stripe webhook signature check failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const tip = await repo().getTipByProviderRef(event.data.object.id);
      if (tip) await markTipSucceeded(tip);
      break;
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      // payment_failed is retryable from the same intent; only canceled is final.
      if (event.type === "payment_intent.canceled") {
        const tip = await repo().getTipByProviderRef(event.data.object.id);
        if (tip) await markTipFailed(tip);
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      const tip = intentId ? await repo().getTipByProviderRef(intentId) : null;
      if (tip && charge.refunded) await repo().updateTip(tip.id, { status: "refunded" });
      break;
    }
    case "account.updated": {
      const account = event.data.object;
      const staff = await repo().getStaffByStripeAccount(account.id);
      const enabled = Boolean(account.payouts_enabled);
      if (staff && staff.payoutsEnabled !== enabled) await repo().updateStaff(staff.id, { payoutsEnabled: enabled });
      break;
    }
  }

  return Response.json({ received: true });
}
