import { QrCode } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-[20px] bg-fill text-ink-2">
        <QrCode size={30} aria-hidden />
      </span>
      <h1 className="mt-5 text-title-2">{t("common.notFoundTitle")}</h1>
      <p className="mt-2 max-w-xs text-subhead text-ink-2">{t("common.notFoundHint")}</p>
      <LinkButton href="/" variant="secondary" className="mt-6">
        {t("common.goHome")}
      </LinkButton>
    </main>
  );
}
