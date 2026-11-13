import { TabBar, type TabItem } from "@/components/tab-bar";
import { TabSlide } from "@/components/tab-slide";
import { requireStaff } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export default async function StaffLayout({ children }: LayoutProps<"/me">) {
  await requireStaff();
  const { t } = await getI18n();
  const items: TabItem[] = [
    { href: "/me", label: t("me.tabs.home"), icon: "home", exact: true },
    { href: "/me/card", label: t("me.tabs.card"), icon: "card" },
    { href: "/me/reviews", label: t("me.tabs.reviews"), icon: "reviews" },
    { href: "/me/profile", label: t("me.tabs.profile"), icon: "profile" },
  ];
  return (
    <div className="min-h-dvh overflow-x-clip bg-grouped">
      <div className="mx-auto max-w-lg pb-28">
        <TabSlide hrefs={items.map((item) => item.href)}>{children}</TabSlide>
      </div>
      <TabBar items={items} />
    </div>
  );
}
