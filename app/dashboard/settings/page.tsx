import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { LanguageToggle } from "@/components/language-toggle";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/list";
import { requireMember } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireMember();
  const [{ t, locale }, venue] = await Promise.all([getI18n(), repo().getVenue(session.venueId)]);
  if (!venue) return null;
  const pct = new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE", { style: "percent", maximumFractionDigits: 1 }).format(env.takeRate);

  return (
    <>
      <PageHeader title={t("dash.settings.title")} />
      <div className="space-y-7 px-5 lg:max-w-2xl lg:px-0">
        <SettingsForm
          initial={{
            name: venue.name,
            city: venue.city ?? "",
            accentColor: venue.accentColor,
            googlePlaceId: venue.googlePlaceId ?? "",
            presets: venue.tipPresets.slice(0, 3).map((c) => c / 100),
          }}
        />

        <ListGroup header={t("dash.settings.payouts")} footer={t("dash.settings.fee", { pct })}>
          <ListRow title={venue.payeeMode === "staff" ? t("dash.settings.payeeStaff") : t("dash.settings.payeeVenue")} />
        </ListGroup>

        <ListGroup className="lg:hidden">
          <ListRow title={t("common.language")} trailing={<LanguageToggle />} />
        </ListGroup>
        <form action={signOut} className="lg:hidden">
          <button type="submit" className={buttonClasses("danger", "lg", "w-full")}>
            <LogOut size={18} aria-hidden />
            {t("common.signOut")}
          </button>
        </form>
      </div>
    </>
  );
}
