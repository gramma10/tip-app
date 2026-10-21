import type { Metadata } from "next";
import { Link2Off } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { MagicLinkForm } from "@/app/login/magic-link-form";
import { acceptInvite } from "./actions";

export const metadata: Metadata = { title: "Join your team", robots: { index: false } };

export default async function JoinPage(props: PageProps<"/join/[token]">) {
  const { token } = await props.params;
  const { t } = await getI18n();
  const staff = await repo().getStaffByInvite(token);
  const venue = staff ? await repo().getVenue(staff.venueId) : null;

  if (!staff || !venue || !staff.active) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-fill text-ink-2">
          <Link2Off size={28} aria-hidden />
        </span>
        <h1 className="mt-5 text-title-2">{t("join.invalidTitle")}</h1>
        <p className="mt-2 text-subhead text-ink-2">{t("join.invalidHint")}</p>
      </main>
    );
  }

  const session = isSupabaseConfigured ? await getSession() : null;
  const canAccept = !isSupabaseConfigured || session?.kind === "new";

  return (
    <div className="min-h-dvh bg-grouped">
      <header className="mx-auto max-w-md px-5 pt-[max(env(safe-area-inset-top),16px)]">
        <BrandLockup />
      </header>
      <main className="mx-auto flex max-w-md flex-col items-center px-5 pt-14 pb-safe text-center">
        <Avatar name={staff.displayName} color={staff.color} size={96} />
        <h1 className="mt-6 text-title-1">{t("join.title", { venue: venue.name })}</h1>
        <p className="mt-2 text-body text-ink-2">
          {t("join.subtitle", { name: staff.displayName, role: staff.roleLabel || "staff" })}
        </p>
        <div className="mt-10 w-full">
          {canAccept ? (
            <form action={acceptInvite.bind(null, token)}>
              <Button type="submit" variant="brand" size="lg" className="w-full">
                {t("join.accept")}
              </Button>
            </form>
          ) : (
            <MagicLinkForm next={`/join/${token}`} />
          )}
        </div>
      </main>
    </div>
  );
}
