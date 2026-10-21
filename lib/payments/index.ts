import "server-only";
import { isStripeConfigured, isSupabaseConfigured } from "../env";
import type { PaymentProviderId } from "../types";
import { demoProvider } from "./demo";
import type { PaymentProvider } from "./provider";
import { stripeProvider } from "./stripe";

/** Real payments need real connected accounts, so Stripe is only used with the Supabase backend. */
export const isLivePayments = isStripeConfigured && isSupabaseConfigured;

export function paymentProvider(): PaymentProvider {
  return isLivePayments ? stripeProvider : demoProvider;
}

export function providerFor(id: PaymentProviderId): PaymentProvider {
  return id === "stripe" ? stripeProvider : demoProvider;
}
