import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** iOS inset-grouped list section. */
export function ListGroup({
  header,
  footer,
  children,
  className,
}: {
  header?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-1.5", className)}>
      {header && <h2 className="px-4 text-footnote text-ink-2">{header}</h2>}
      <div className="overflow-hidden rounded-card bg-surface shadow-card">{children}</div>
      {footer && <div className="px-4 text-footnote text-ink-2">{footer}</div>}
    </section>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  href,
  chevron,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  chevron?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body">{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-subhead text-ink-2">{subtitle}</span>}
        </span>
        {trailing && <span className="shrink-0 text-body text-ink-2">{trailing}</span>}
        {(chevron ?? Boolean(href)) && <ChevronRight size={18} className="shrink-0 text-ink-3" aria-hidden />}
      </span>
    </>
  );
  const classes = cn("group/row flex min-h-11 items-center gap-3 pl-4 pr-4", className);
  return href ? (
    <Link href={href} className={cn(classes, "transition-colors active:bg-fill")}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
