import "server-only";
import type { PaymentProvider } from "./provider";

/**
 * Simulated rail for local development and sales demos: no money moves.
 * The tip page "confirms" by calling the confirmTip server action.
 */
export const demoProvider: PaymentProvider = {
  id: "demo",
  async createPayment(input) {
    return { providerRef: `demo_${input.tipId}`, clientSecret: null };
  },
  async getPaymentStatus() {
    return "succeeded";
  },
  async createOnboardingLink(staff, urls) {
    return { url: `${urls.returnUrl}${urls.returnUrl.includes("?") ? "&" : "?"}demo=1`, accountId: `acct_demo_${staff.id}` };
  },
  async getPayoutsEnabled() {
    return true;
  },
};
