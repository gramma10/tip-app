import { Star } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/utils";

const DEMO_CODE = "maria";

export default async function LandingPage() {
  const { t, dict, locale } = await getI18n();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <BrandLockup />
          <nav className="flex items-center gap-2">
            <LinkButton href={`/t/${DEMO_CODE}`} variant="plain" size="sm" className="hidden sm:inline-flex">
              {t("landing.nav.demo")}
            </LinkButton>
            <LinkButton href="/login" variant="secondary" size="sm">
              {t("landing.nav.signIn")}
            </LinkButton>
            <LanguageToggle />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: the product itself, live, in a phone. */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div>
            <h1 className="max-w-xl text-[40px] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-[56px] lg:text-[64px]">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-6 max-w-lg text-[19px] leading-[1.45] text-ink-2">{t("landing.heroSub")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={`/t/${DEMO_CODE}`} size="lg">
                {t("landing.ctaGuest")}
              </LinkButton>
              <LinkButton href="/login" variant="secondary" size="lg">
                {t("landing.ctaOwner")}
              </LinkButton>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative h-[620px] w-[300px] rounded-[54px] bg-[#1d1d1f] p-[11px] shadow-float ring-1 ring-black/10 dark:ring-white/10">
              <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-canvas">
                <iframe
                  src={`/t/${DEMO_CODE}`}
                  title={t("landing.ctaGuest")}
                  loading="lazy"
                  className="absolute top-0 left-0 h-[780px] w-[375px] origin-top-left scale-[0.7413] border-0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* A real sequence, so the steps are numbered. */}
        <section className="bg-grouped py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]">{t("landing.howTitle")}</h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {dict.landing.steps.map((step, i) => (
                <li key={step.title} className="rounded-[24px] bg-surface p-6 shadow-card">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-subhead font-bold text-primary-fg">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-title-3">{step.title}</h3>
                  <p className="mt-2 text-callout text-ink-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-2">
          <article className="rounded-[28px] bg-grouped p-8">
            <h2 className="text-title-1">{t("landing.ownersTitle")}</h2>
            <p className="mt-3 text-callout text-ink-2">{t("landing.ownersBody")}</p>
            <div className="mt-8 overflow-hidden rounded-card bg-surface shadow-card" aria-hidden>
              {[
                { name: "Maria", color: "#B83280", cents: 128_400, rating: "4.9" },
                { name: "Nikos", color: "#2B6CB0", cents: 104_250, rating: "4.7" },
                { name: "Eleni", color: "#0F766E", cents: 91_800, rating: "4.6" },
              ].map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3 shadow-[inset_0_-0.5px_0_var(--line)] last:shadow-none">
                  <span className="w-4 text-subhead font-semibold text-ink-3">{i + 1}</span>
                  <Avatar name={p.name} color={p.color} size={36} />
                  <span className="flex-1 text-headline">{p.name}</span>
                  <span className="text-right">
                    <span className="block text-subhead font-semibold">{formatMoney(p.cents, locale)}</span>
                    <span className="flex items-center justify-end gap-1 text-footnote text-ink-2">
                      <Star size={11} className="fill-star" strokeWidth={0} />
                      {p.rating}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] bg-grouped p-8">
            <h2 className="text-title-1">{t("landing.staffTitle")}</h2>
            <p className="mt-3 text-callout text-ink-2">{t("landing.staffBody")}</p>
            <div
              className="mt-8 rounded-[24px] p-5 text-white shadow-float"
              style={{ background: "linear-gradient(145deg, #c94f95 0%, #B83280 45%, #6e1e4d 100%)" }}
              aria-hidden
            >
              <div className="flex justify-between text-footnote font-semibold text-white/80">
                <span>{t("me.thisWeek")}</span>
                <span>Thalassa Beach Bar</span>
              </div>
              <p className="mt-2 text-[40px] leading-none font-bold tracking-[-0.03em]">{formatMoney(18_650, locale)}</p>
              <div className="mt-6 flex h-10 items-end gap-1.5">
                {[40, 55, 35, 70, 90, 100, 60].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-[4px] bg-white" style={{ height: `${h}%`, opacity: i === 6 ? 1 : 0.45 }} />
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="bg-grouped py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]">{t("landing.pricingTitle")}</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-surface p-7 shadow-card">
                <h3 className="text-title-3">{t("landing.pricingFree")}</h3>
                <p className="mt-1 text-[34px] font-bold tracking-tight">€0</p>
                <p className="mt-3 text-callout text-ink-2">{t("landing.pricingFreeBody")}</p>
              </div>
              <div className="rounded-[24px] bg-primary p-7 text-primary-fg shadow-float">
                <h3 className="text-title-3">{t("landing.pricingPro")}</h3>
                <p className="mt-1 text-[34px] font-bold tracking-tight">{t("landing.pricingProPrice")}</p>
                <p className="mt-3 text-callout opacity-70">{t("landing.pricingProBody")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 py-10 text-footnote text-ink-3">
        <BrandLockup className="opacity-70" />
        <span>{t("landing.footer")}</span>
      </footer>
    </div>
  );
}
