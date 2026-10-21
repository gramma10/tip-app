import type { Metadata } from "next";
import { Printer } from "lucide-react";
import { CardsManager } from "@/components/dashboard/cards-manager";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { requireMember } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { qrSvg, tipUrl } from "@/lib/qr";
import { getCards } from "@/lib/services/venue";

export const metadata: Metadata = { title: "QR cards" };

export default async function CardsPage() {
  const session = await requireMember();
  const [{ t }, { cards, staff }] = await Promise.all([getI18n(), getCards(session.venueId)]);
  const withQr = await Promise.all(
    cards.map(async (c) => ({ ...c, url: tipUrl(c.code), svg: await qrSvg(tipUrl(c.code)) })),
  );

  return (
    <>
      <PageHeader
        title={t("dash.cards.title")}
        actions={
          <LinkButton href="/dashboard/cards/print" variant="secondary" size="sm">
            <Printer size={15} aria-hidden />
            {t("dash.cards.printAll")}
          </LinkButton>
        }
      />
      <div className="px-5 lg:px-0">
        <CardsManager
          cards={withQr}
          staff={staff.map((s) => ({ id: s.id, displayName: s.displayName, color: s.color, photoUrl: s.photoUrl, roleLabel: s.roleLabel }))}
        />
      </div>
    </>
  );
}
