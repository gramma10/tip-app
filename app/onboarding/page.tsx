import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Set up your venue" };

async function createVenueAction(form: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.kind !== "new") redirect("/login");
  const input = z
    .object({ name: z.string().trim().min(1).max(80), city: z.string().trim().max(60) })
    .safeParse({ name: form.get("name"), city: form.get("city") ?? "" });
  if (!input.success) return;
  await repo().createVenue({ name: input.data.name, city: input.data.city || null }, session.userId);
  redirect("/dashboard");
}

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.kind === "member") redirect("/dashboard");
  if (session.kind === "staff") redirect("/me");
  const { t } = await getI18n();

  return (
    <div className="min-h-dvh bg-grouped">
      <header className="mx-auto max-w-md px-5 pt-[max(env(safe-area-inset-top),16px)]">
        <BrandLockup />
      </header>
      <main className="mx-auto max-w-md px-5 pt-12 pb-safe">
        <h1 className="text-large-title">{t("dash.settings.venue")}</h1>
        <form action={createVenueAction} className="mt-8 space-y-3">
          <div className="overflow-hidden rounded-card bg-surface shadow-card">
            <input
              name="name"
              required
              maxLength={80}
              placeholder={t("dash.settings.name")}
              className="h-14 w-full bg-transparent px-4 text-body shadow-[inset_0_-0.5px_0_var(--line)] placeholder:text-ink-3 focus:outline-none"
            />
            <input
              name="city"
              maxLength={60}
              placeholder={t("dash.settings.city")}
              className="h-14 w-full bg-transparent px-4 text-body placeholder:text-ink-3 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="brand" size="lg" className="w-full">
            {t("common.continue")}
          </Button>
        </form>
      </main>
    </div>
  );
}
