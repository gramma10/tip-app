"use client";

import { Copy, Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function ShareLink({ url, title }: { url: string; title: string }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
      <Button
        variant="secondary"
        size="lg"
        onClick={async () => {
          if (navigator.share) {
            await navigator.share({ title, url }).catch(() => undefined);
          } else {
            await navigator.clipboard.writeText(url);
            toast.success(t("common.linkCopied"));
          }
        }}
      >
        <Share size={18} aria-hidden />
        {t("common.share")}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          toast.success(t("common.linkCopied"));
        }}
      >
        <Copy size={18} aria-hidden />
        {t("common.copyLink")}
      </Button>
    </div>
  );
}
