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

/** Floating glass tab bar. The active pill slides between tabs instead of jumping. */
export function TabBar({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  const activeIndex = items.findIndex((item) => isActive(pathname, item));
  return (
    <nav
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 print:hidden",
        "pb-[max(env(safe-area-inset-bottom),12px)]",
        className,
      )}
    >
      <ul className="glass pointer-events-auto relative mx-auto flex max-w-md rounded-full p-1">
        {activeIndex >= 0 && (
          <li
            aria-hidden
            className="glass-thumb absolute inset-y-1 left-1 rounded-full transition-transform duration-500 ease-spring"
            style={{
              width: `calc((100% - 8px) / ${items.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {items.map((item, i) => {
          const active = i === activeIndex;
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href} className="relative min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium",
                  "transition-[color,transform] duration-300 ease-spring active:scale-90",
                  active ? "text-brand" : "text-ink-2",
                )}
              >
                <Icon size={23} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                <span className="max-w-full truncate px-1">{item.label}</span>
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
