import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { Avatar } from "@/components/ui/avatar";
import { ListGroup } from "@/components/ui/list";
import { getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DEMO_OWNER_USER_ID, DEMO_VENUE_ID } from "@/lib/data/demo-seed";
import { isSupabaseConfigured } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { ChevronRight, Store } from "lucide-react";
import { demoSignIn } from "./actions";
import { MagicLinkForm } from "./magic-link-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? search.next : undefined;
  const session = await getSession();
  if (session?.kind === "member") redirect("/dashboard");
  if (session?.kind === "staff") redirect("/me");
  if (session?.kind === "new") redirect("/onboarding");

  const { t } = await getI18n();
  const demoStaff = isSupabaseConfigured
    ? []
    : (await repo().listStaff(DEMO_VENUE_ID)).filter((s) => s.userId && ["s_maria", "s_nikos", "s_dimitris"].includes(s.id));

  return (
    <div className="min-h-dvh bg-grouped">
      <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)]">
        <BrandLockup />
        <LanguageToggle />
      </header>
      <main className="mx-auto max-w-md px-5 pt-12 pb-safe">
        <h1 className="text-large-title">{isSupabaseConfigured ? t("login.title") : t("login.demoTitle")}</h1>
        <p className="mt-2 text-body text-ink-2">{isSupabaseConfigured ? t("login.subtitle") : t("login.demoHint")}</p>

        {isSupabaseConfigured && (
          <div className="mt-8">
            <MagicLinkForm next={next} />
          </div>
        )}

        {!isSupabaseConfigured && (
          <ListGroup footer={t("login.supabaseMissing")} className="mt-8">
            <form action={demoSignIn.bind(null, DEMO_OWNER_USER_ID)} className="group/row">
              <DemoRow
                leading={
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
                    <Store size={20} aria-hidden />
                  </span>
                }
                title={t("login.demoOwner")}
              />
            </form>
            {demoStaff.map((s) => (
              <form key={s.id} action={demoSignIn.bind(null, s.userId!)} className="group/row">
                <DemoRow
                  leading={<Avatar name={s.displayName} color={s.color} size={40} />}
                  title={t("login.demoStaff", { name: s.displayName })}
                  subtitle={s.roleLabel}
                />
              </form>
            ))}
          </ListGroup>
        )}
      </main>
    </div>
  );
}

function DemoRow({ leading, title, subtitle }: { leading: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <button
      type="submit"
      className="flex w-full items-center gap-3 pl-4 text-left transition-colors active:bg-fill"
    >
      {leading}
      <span className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
        <span className="min-w-0 flex-1">
          <span className="block text-body">{title}</span>
          {subtitle && <span className="block text-subhead text-ink-2">{subtitle}</span>}
        </span>
        <ChevronRight size={18} className="text-ink-3" aria-hidden />
      </span>
    </button>
  );
}
