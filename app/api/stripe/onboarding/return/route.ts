import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { paymentProvider } from "@/lib/payments";

/** Stripe sends the user back here; re-read the account so the UI is right without waiting for the webhook. */
export async function GET() {
  const session = await requireStaff();
  const staff = await repo().getStaff(session.staffId);
  if (staff?.stripeAccountId) {
    const enabled = await paymentProvider().getPayoutsEnabled(staff.stripeAccountId);
    if (enabled !== staff.payoutsEnabled) await repo().updateStaff(staff.id, { payoutsEnabled: enabled });
  }
  redirect("/me/profile");
}
