"use client";

import { Check, Copy, Plus, Share } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";

export function InviteButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setRole("");
      setLink(null);
    }
  }

  return (
    <>
      <Button size="sm" variant="brand" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden />
        {t("dash.staff.invite")}
      </Button>
      <Sheet
        open={open}
        onOpenChange={reset}
        title={link ? t("dash.staff.inviteReady") : t("dash.staff.inviteTitle")}
        description={link ? t("dash.staff.inviteHint", { name }) : undefined}
      >
        {link ? (
          <div className="space-y-3 pt-2 pb-2">
            <p className="flex items-center gap-2 rounded-[14px] bg-fill px-4 py-3 text-subhead break-all">
              <Check size={18} className="shrink-0 text-positive" aria-hidden />
              {link}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  toast.success(t("common.linkCopied"));
                }}
              >
                <Copy size={18} aria-hidden />
                {t("common.copyLink")}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigator.share?.({ url: link, title: t("dash.staff.inviteReady") }).catch(() => undefined)}
              >
                <Share size={18} aria-hidden />
                {t("common.share")}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-3 pt-2 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await inviteStaff({ name, role });
                if (res.ok) setLink(res.url);
                else toast.error(t("common.genericError"));
              });
            }}
          >
            <div className="overflow-hidden rounded-[14px] bg-fill">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={40}
                placeholder={t("dash.staff.name")}
                aria-label={t("dash.staff.name")}
                className="h-12 w-full bg-transparent px-4 text-body shadow-[inset_0_-0.5px_0_var(--line)] placeholder:text-ink-3 focus:outline-none"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={30}
                placeholder={t("dash.staff.rolePlaceholder")}
                aria-label={t("dash.staff.role")}
                className="h-12 w-full bg-transparent px-4 text-body placeholder:text-ink-3 focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={pending || !name.trim()}>
              {t("dash.staff.createInvite")}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
