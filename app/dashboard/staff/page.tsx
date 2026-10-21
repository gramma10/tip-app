import type { Metadata } from "next";
import { Users } from "lucide-react";
import { InviteButton } from "@/components/dashboard/invite-button";
import { LeaderRow } from "@/components/dashboard/leader-row";
import { RangeControl } from "@/components/dashboard/range-control";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getStaffList, parseRange, type StaffStatus } from "@/lib/services/venue";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Staff" };

const STATUS_KEY = {
  active: "dash.staff.statusActive",
  invited: "dash.staff.statusInvited",
  setup: "dash.staff.statusSetup",
  inactive: "dash.staff.statusInactive",
} as const satisfies Record<StaffStatus, string>;

export default async function StaffPage(props: PageProps<"/dashboard/staff">) {
  const session = await requireMember();
  const range = parseRange((await props.searchParams).range);
  const [{ t, locale }, rows] = await Promise.all([getI18n(), getStaffList(session.venueId, range)]);
  const active = rows.filter((r) => r.status !== "inactive");
  const removed = rows.filter((r) => r.status === "inactive");

  return (
    <>
      <PageHeader title={t("dash.staff.title")} actions={<InviteButton />} />
      <div className="space-y-5 px-5 lg:px-0">
        <RangeControl value={range} />
        {active.length ? (
          <div className="overflow-hidden rounded-card bg-surface shadow-card">
            {active.map((row, i) => (
              <LeaderRow
                key={row.staff.id}
                rank={i + 1}
                staff={row.staff}
                volumeCents={row.volumeCents}
                avgRating={row.avgRating}
                subtitle={
                  row.status === "active"
                    ? `${row.staff.roleLabel ? `${row.staff.roleLabel}, ` : ""}${formatNumber(row.count, locale)} ${t("dash.staff.tips").toLowerCase()}`
                    : t(STATUS_KEY[row.status])
                }
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Users size={26} aria-hidden />} title={t("dash.staff.empty")} hint={t("dash.staff.emptyHint")} action={<InviteButton />} />
        )}

        {removed.length > 0 && (
          <section className="space-y-1.5">
            <h2 className="px-4 text-footnote text-ink-2">{t("dash.staff.statusInactive")}</h2>
            <div className="overflow-hidden rounded-card bg-surface shadow-card">
              {removed.map((row, i) => (
                <LeaderRow
                  key={row.staff.id}
                  rank={i + 1}
                  staff={row.staff}
                  volumeCents={row.volumeCents}
                  avgRating={row.avgRating}
                  subtitle={row.staff.roleLabel}
                  locale={locale}
                  muted
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
