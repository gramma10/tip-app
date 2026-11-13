import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { BrandLockup } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { MotionProvider } from "@/components/motion-provider";
import { SideBar, TabBar, type TabItem } from "@/components/tab-bar";
import { TabSlide } from "@/components/tab-slide";
import { requireMember } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireMember();
  const [{ t }, venue] = await Promise.all([getI18n(), repo().getVenue(session.venueId)]);

  const items: TabItem[] = [
    { href: "/dashboard", label: t("dash.nav.overview"), icon: "overview", exact: true },
    { href: "/dashboard/staff", label: t("dash.nav.staff"), icon: "staff" },
    { href: "/dashboard/feedback", label: t("dash.nav.feedback"), icon: "feedback" },
    { href: "/dashboard/cards", label: t("dash.nav.cards"), icon: "cards" },
    { href: "/dashboard/settings", label: t("dash.nav.settings"), icon: "settings" },
  ];

  return (
    <div className="min-h-dvh bg-grouped lg:flex">
      <SideBar
        items={items}
        header={
          <div>
            <BrandLockup />
            <p className="mt-4 truncate text-footnote text-ink-2">{venue?.name}</p>
          </div>
        }
        footer={
          <div className="flex items-center justify-between">
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-2 text-subhead font-medium text-ink-2 hover:text-ink">
                <LogOut size={17} aria-hidden />
                {t("common.signOut")}
              </button>
            </form>
            <LanguageToggle />
          </div>
        }
      />
      <div className="min-w-0 flex-1 overflow-x-clip pb-28 lg:pb-12">
        <div className="mx-auto max-w-5xl lg:px-6 lg:pt-4">
          <MotionProvider>
            <TabSlide hrefs={items.map((item) => item.href)}>{children}</TabSlide>
          </MotionProvider>
        </div>
      </div>
      <TabBar items={items} className="lg:hidden" />
    </div>
  );
}
