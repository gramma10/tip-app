"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

/** iOS-style bottom sheet with a grabber. Becomes a centred dialog-width sheet on desktop. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col",
            "rounded-t-sheet bg-surface outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-[5px] w-9 shrink-0 rounded-full bg-fill-strong" aria-hidden />
          <div className="px-5 pt-4 pb-2">
            <Drawer.Title className="text-title-3">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-1 text-subhead text-ink-2">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="overflow-y-auto px-5 pb-safe">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
