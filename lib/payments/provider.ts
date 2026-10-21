import type { PaymentProviderId, Staff } from "../types";

export type PaymentStatus = "pending" | "succeeded" | "failed";

export type CreatePaymentInput = {
  tipId: string;
  totalCents: number;
  applicationFeeCents: number;
  /** Connected account that receives the tip (staff or venue). */
  destinationAccountId: string;
  description: string;
  metadata: Record<string, string>;
};

export type CreatePaymentResult = {
  providerRef: string;
  /** Present for providers confirmed in the browser (Stripe). */
  clientSecret: string | null;
};

/**
 * Everything the app needs from a payment rail. Stripe ships first; a
 * Viva.com/IRIS implementation can plug in here without touching the UI.
 */
export interface PaymentProvider {
  id: PaymentProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(providerRef: string): Promise<PaymentStatus>;
  /** Returns a hosted onboarding URL for a staff member's payout account. */
  createOnboardingLink(
    staff: Staff,
    urls: { returnUrl: string; refreshUrl: string },
  ): Promise<{ url: string; accountId: string }>;
  getPayoutsEnabled(accountId: string): Promise<boolean>;
}
