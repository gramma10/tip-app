import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { paymentProvider } from "@/lib/payments";

/** Starts (or resumes) hosted payout onboarding for the signed-in staff member. */
export async function GET() {
  const session = await requireStaff();
  const staff = await repo().getStaff(session.staffId);
  if (!staff) redirect("/me");

  const provider = paymentProvider();
  const { url, accountId } = await provider.createOnboardingLink(staff, {
    returnUrl: `${env.appUrl}/api/stripe/onboarding/return`,
    refreshUrl: `${env.appUrl}/api/stripe/onboarding`,
  });
  if (accountId !== staff.stripeAccountId) await repo().updateStaff(staff.id, { stripeAccountId: accountId });
  redirect(url);
}
