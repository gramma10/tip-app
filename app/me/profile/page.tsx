import type { Metadata } from "next";
import { BadgeCheck, Banknote, LogOut, Store } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { LanguageToggle } from "@/components/language-toggle";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/list";
import { requireStaff } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { isLivePayments } from "@/lib/payments";
import { PhotoPicker } from "./photo-picker";

export const metadata: Metadata = { title: "Profile" };

function IconTile({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`flex size-[30px] items-center justify-center rounded-[8px] text-white ${className}`}>{children}</span>;
}

export default async function StaffProfilePage() {
  const session = await requireStaff();
  const { t } = await getI18n();
  const staff = (await repo().getStaff(session.staffId))!;
  const venue = (await repo().getVenue(staff.venueId))!;

  return (
    <>
      <PageHeader title={t("me.tabs.profile")} />
      <div className="space-y-7 px-5">
        <section className="flex flex-col items-center text-center">
          <PhotoPicker name={staff.displayName} color={staff.color} photoUrl={staff.photoUrl} />
          <h2 className="mt-3 text-title-2">{staff.displayName}</h2>
          <p className="text-subhead text-ink-2">{staff.roleLabel}</p>
        </section>

        <ListGroup
          header={t("me.payouts")}
          footer={!isLivePayments ? t("me.payoutsDemo") : !staff.payoutsEnabled ? t("me.payoutsSetupHint") : undefined}
        >
          {staff.payoutsEnabled ? (
            <ListRow
              leading={<IconTile className="bg-positive"><BadgeCheck size={18} aria-hidden /></IconTile>}
              title={t("me.payoutsReady")}
              subtitle={t("me.payoutNote")}
            />
          ) : (
            <div className="p-4">
              <a href="/api/stripe/onboarding" className={buttonClasses("brand", "lg", "w-full")}>
                <Banknote size={20} aria-hidden />
                {t("me.payoutsSetup")}
              </a>
            </div>
          )}
        </ListGroup>

        <ListGroup>
          <ListRow
            leading={<IconTile className="bg-brand"><Store size={17} aria-hidden /></IconTile>}
            title={t("me.venue")}
            trailing={venue.name}
          />
          <ListRow
            leading={<IconTile className="bg-[#8e8e93]"><span className="text-footnote font-bold">Aa</span></IconTile>}
            title={t("common.language")}
            trailing={<LanguageToggle />}
          />
        </ListGroup>

        <form action={signOut}>
          <button type="submit" className={buttonClasses("danger", "lg", "w-full")}>
            <LogOut size={18} aria-hidden />
            {t("common.signOut")}
          </button>
        </form>
      </div>
    </>
  );
}
