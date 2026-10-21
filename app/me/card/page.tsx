import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { requireStaff } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { qrSvg, tipUrl } from "@/lib/qr";
import { getStaffHome } from "@/lib/services/staff";
import { shade } from "@/lib/utils";
import { ShareLink } from "./share-link";

export const metadata: Metadata = { title: "My card" };

/** Apple Wallet–style pass the waiter can hold up to a guest's camera. */
export default async function MyCardPage() {
  const session = await requireStaff();
  const [home, { t }] = await Promise.all([getStaffHome(session.staffId), getI18n()]);
  if (!home) return null;
  const { staff, venue, card } = home;

  if (!card) {
    return (
      <>
        <PageHeader title={t("me.tabs.card")} />
        <EmptyState icon={<QrCode size={26} aria-hidden />} title={t("dash.staff.noCards")} hint={t("join.invalidHint")} />
      </>
    );
  }

  const url = tipUrl(card.code);
  const svg = await qrSvg(url);

  return (
    <>
      <PageHeader title={t("me.tabs.card")} />
      <div className="px-5">
        <article
          className="relative mx-auto max-w-sm overflow-hidden rounded-[28px] p-6 text-white shadow-float"
          style={{ background: `linear-gradient(160deg, ${shade(staff.color, 0.12)} 0%, ${staff.color} 40%, ${shade(staff.color, -0.45)} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-footnote font-semibold text-white/85">{venue.name}</span>
            <QrCode size={18} className="text-white/70" aria-hidden />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Avatar name={staff.displayName} color={shade(staff.color, -0.15)} photoUrl={staff.photoUrl} size={52} ring />
            <div className="min-w-0">
              <h2 className="truncate text-title-2">{staff.displayName}</h2>
              <p className="text-subhead text-white/75">{staff.roleLabel}</p>
            </div>
          </div>
          <div className="mt-6 rounded-[20px] bg-white p-5">
            <div
              className="mx-auto aspect-square w-full max-w-[240px] [&_svg]:h-full [&_svg]:w-full"
              role="img"
              aria-label={t("me.cardTitle", { name: staff.displayName })}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-4 text-center text-headline text-black">{t("me.cardTitle", { name: staff.displayName })}</p>
            <p className="mt-0.5 text-center text-footnote text-black/55">{t("me.cardHint")}</p>
          </div>
        </article>
        <ShareLink url={url} title={t("me.cardTitle", { name: staff.displayName })} />
      </div>
    </>
  );
}
