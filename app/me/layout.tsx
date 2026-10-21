import { TabBar } from "@/components/tab-bar";
import { requireStaff } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export default async function StaffLayout({ children }: LayoutProps<"/me">) {
  await requireStaff();
  const { t } = await getI18n();
  return (
    <div className="min-h-dvh bg-grouped">
      <div className="mx-auto max-w-lg pb-28">{children}</div>
      <TabBar
        items={[
          { href: "/me", label: t("me.tabs.home"), icon: "home", exact: true },
          { href: "/me/card", label: t("me.tabs.card"), icon: "card" },
          { href: "/me/reviews", label: t("me.tabs.reviews"), icon: "reviews" },
          { href: "/me/profile", label: t("me.tabs.profile"), icon: "profile" },
        ]}
      />
    </div>
  );
}
