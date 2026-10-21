"use client";

import {
  ChartColumn,
  House,
  MessageSquare,
  QrCode,
  Settings,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICONS = {
  home: House,
  card: QrCode,
  reviews: Star,
  profile: UserRound,
  overview: ChartColumn,
  staff: Users,
  feedback: MessageSquare,
  cards: QrCode,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type TabItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

function isActive(pathname: string, item: TabItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** iOS tab bar: translucent material, filled icon + tinted label on the active tab. */
export function TabBar({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-canvas/85 shadow-bar backdrop-blur-xl backdrop-saturate-150 print:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-brand" : "text-ink-3",
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop sidebar sharing the same items as the mobile tab bar. */
export function SideBar({ items, header, footer }: { items: TabItem[]; header: React.ReactNode; footer?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col px-3 py-5 lg:flex print:hidden">
      <div className="px-3 pb-6">{header}</div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-[10px] px-3 text-subhead font-medium transition-colors",
                  active ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:bg-fill",
                )}
              >
                <Icon size={19} className={active ? "text-brand" : ""} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-auto px-3">{footer}</div>}
    </aside>
  );
}
