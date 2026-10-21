import "server-only";
import Stripe from "stripe";
import { BRAND, env } from "../env";
import type { PaymentProvider, PaymentStatus } from "./provider";

let client: Stripe | null = null;

export function stripe() {
  if (!env.stripeSecretKey) throw new Error("Stripe is not configured");
  client ??= new Stripe(env.stripeSecretKey, {
    appInfo: { name: BRAND, url: env.appUrl },
  });
  return client;
}

function toStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  if (status === "succeeded") return "succeeded";
  if (status === "canceled") return "failed";
  // requires_payment_method after a failed attempt is still retryable, so treat as pending.
  return "pending";
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async createPayment(input) {
    // Destination charge: the platform is the merchant of record and pays processing out of
    // the application fee; the rest is transferred to the staff (or venue) connected account.
    const intent = await stripe().paymentIntents.create(
      {
        amount: input.totalCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        application_fee_amount: input.applicationFeeCents,
        transfer_data: { destination: input.destinationAccountId },
        description: input.description,
        statement_descriptor_suffix: "TIP",
        metadata: { ...input.metadata, tipId: input.tipId },
      },
      { idempotencyKey: `tip-${input.tipId}` },
    );
    return { providerRef: intent.id, clientSecret: intent.client_secret };
  },

  async getPaymentStatus(providerRef) {
    const intent = await stripe().paymentIntents.retrieve(providerRef);
    return toStatus(intent.status);
  },

  async createOnboardingLink(staff, urls) {
    let accountId = staff.stripeAccountId;
    if (!accountId) {
      // Express-style account: Stripe hosts onboarding and the payout dashboard,
      // collects KYC, and handles requirements. Only transfers are needed for destination charges.
      const account = await stripe().accounts.create({
        country: "GR",
        business_type: "individual",
        capabilities: { transfers: { requested: true } },
        controller: {
          fees: { payer: "application" },
          losses: { payments: "application" },
          stripe_dashboard: { type: "express" },
        },
        business_profile: {
          mcc: "7299",
          product_description: "Gratuities received from hospitality guests",
        },
        settings: { payouts: { schedule: { interval: "weekly", weekly_anchor: "monday" } } },
        metadata: { staffId: staff.id, venueId: staff.venueId },
      });
      accountId = account.id;
    }
    const link = await stripe().accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: urls.returnUrl,
      refresh_url: urls.refreshUrl,
    });
    return { url: link.url, accountId };
  },

  async getPayoutsEnabled(accountId) {
    const account = await stripe().accounts.retrieve(accountId);
    return Boolean(account.payouts_enabled);
  },
};
