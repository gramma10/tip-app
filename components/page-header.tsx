import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** iOS large-title header. */
export function PageHeader({
  title,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-4 px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-subhead font-medium text-ink-2">{eyebrow}</p>}
        <h1 className="truncate text-large-title">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-fill text-ink-2">{icon}</span>
      <h2 className="mt-4 text-headline">{title}</h2>
      {hint && <p className="mt-1 max-w-xs text-subhead text-ink-2">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
