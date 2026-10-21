import type { Metadata } from "next";
import { ChevronLeft, Nfc } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { requireMember } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { BRAND } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { qrSvg, tipUrl } from "@/lib/qr";
import { getCards } from "@/lib/services/venue";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Print cards" };

/** Bill-folder cards (85 × 120 mm): one per page section, cut along the hairline. */
export default async function PrintCardsPage() {
  const session = await requireMember();
  const [{ t }, { cards, staff }, venue] = await Promise.all([
    getI18n(),
    getCards(session.venueId),
    repo().getVenue(session.venueId),
  ]);
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const printable = await Promise.all(
    cards.map(async (c) => ({ ...c, svg: await qrSvg(tipUrl(c.code)), person: c.assignedStaffId ? staffById.get(c.assignedStaffId) : null })),
  );

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),12px)] lg:px-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/cards" className="inline-flex h-10 items-center gap-0.5 pr-3 text-body text-brand">
          <ChevronLeft size={22} aria-hidden />
          {t("dash.cards.title")}
        </Link>
        <PrintButton label={t("common.print")} />
      </div>
      <h1 className="mt-2 text-title-1 print:hidden">{t("dash.print.title")}</h1>
      <p className="mt-1 text-subhead text-ink-2 print:hidden">{t("dash.print.hint")}</p>

      <div className="mt-6 flex flex-wrap gap-4 print:mt-0 print:gap-0">
        {printable.map((c) => (
          <article
            key={c.id}
            className="flex h-[120mm] w-[85mm] break-inside-avoid flex-col items-center rounded-[6mm] bg-white px-[7mm] py-[7mm] text-center text-black shadow-card print:rounded-none print:shadow-none print:outline print:outline-[0.2mm] print:outline-black/15"
          >
            <p className="text-[10pt] font-semibold tracking-tight text-black/60">{venue?.name}</p>
            <p className="mt-[3mm] text-[17pt] leading-tight font-bold tracking-tight">
              {c.kind === "staff" && c.person ? c.person.displayName : c.label}
            </p>
            <div
              className="mt-[5mm] size-[52mm] [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: c.svg }}
              aria-hidden
            />
            <p className="mt-[5mm] text-[13pt] font-semibold">{t("dash.print.scanToTip")}</p>
            <p className="mt-[1mm] text-[8.5pt] leading-snug text-black/60">{t("dash.print.noApp")}</p>
            <div className="mt-auto flex w-full items-center justify-between text-[7.5pt] text-black/45">
              <span className="inline-flex items-center gap-[1.5mm]">
                <BrandMark size={12} />
                {BRAND}
              </span>
              <span className="inline-flex items-center gap-[1mm]">
                <Nfc size={11} aria-hidden />
                /t/{c.code}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
