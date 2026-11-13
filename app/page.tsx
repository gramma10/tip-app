import { headers } from "next/headers";
import { BedDouble, Check, ConciergeBell, Martini, Sparkles, Star } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { RotatingWords } from "@/components/rotating-words";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses, LinkButton } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { qrSvg } from "@/lib/qr";
import { formatMoney } from "@/lib/utils";

const DEMO_CODE = "maria";
const WHERE_ICONS = [BedDouble, ConciergeBell, Martini, Sparkles];

/** The address this page was reached on, so the hero QR works on any deployment without configuration. */
async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return env.appUrl.replace(/\/$/, "");
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function LandingPage() {
  const { t, dict, locale } = await getI18n();
  const demoQr = await qrSvg(`${await requestOrigin()}/t/${DEMO_CODE}`, { dark: "#1d1d1f", light: "#ffffff" });

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-3 z-30 px-3">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-3 pl-5">
          <BrandLockup />
          <nav className="flex items-center gap-2">
            <LinkButton href={`/t/${DEMO_CODE}`} variant="plain" size="sm" className="hidden sm:inline-flex">
              {t("landing.nav.demo")}
            </LinkButton>
            <LinkButton href="/login" variant="glass" size="sm">
              {t("landing.nav.signIn")}
            </LinkButton>
            <LanguageToggle />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: the product itself, live, in a phone, plus a QR so a visitor can try it on their own. */}
        <section className="relative -mt-[68px] overflow-hidden pt-[68px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 55% at 78% 40%, color-mix(in srgb, #B83280 22%, transparent), transparent 70%), radial-gradient(50% 50% at 12% 8%, var(--brand-soft), transparent 70%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-footnote font-semibold text-brand">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                {t("landing.eyebrow")}
              </p>
              <h1 className="mt-5 max-w-xl text-[38px] leading-[1.06] font-bold tracking-[-0.035em] sm:text-[52px] lg:text-[60px]">
                <span className="block text-balance">{t("landing.heroTitle")}</span>
                <span className="block text-ink-2">{t("landing.heroRotateLead")}</span>
                <RotatingWords words={dict.landing.heroRotate} />
              </h1>
              <p className="mt-6 max-w-lg text-[19px] leading-[1.45] text-ink-2">{t("landing.heroSub")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton href={`/t/${DEMO_CODE}`} size="lg">
                  {t("landing.ctaGuest")}
                </LinkButton>
                <LinkButton href="/login" variant="glass" size="lg">
                  {t("landing.ctaOwner")}
                </LinkButton>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-subhead text-ink-2">
                {dict.landing.proof.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check size={16} className="text-positive" strokeWidth={3} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Only useful on a screen someone else is looking at: a laptop or tablet on the stand. */}
              <div className="mt-10 hidden max-w-md items-center gap-5 glass rounded-[24px] p-4 md:flex">
                <div
                  className="size-[116px] shrink-0 rounded-[14px] bg-white p-2.5 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: demoQr }}
                />
                <div>
                  <p className="text-headline">{t("landing.scanTitle")}</p>
                  <p className="mt-1 text-subhead text-ink-2">{t("landing.scanHint")}</p>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
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
              <div
                aria-hidden
                className="animate-pop-in absolute top-16 -right-2 hidden items-center gap-3 glass rounded-[18px] px-4 py-3 [animation-delay:600ms] sm:flex lg:right-0"
              >
                <Avatar name="Maria" color="#B83280" size={36} />
                <span>
                  <span className="block text-subhead font-semibold">+{formatMoney(500, locale)}</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} size={11} className="fill-star" strokeWidth={0} />
                    ))}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(45% 60% at 85% 30%, color-mix(in srgb, #B83280 16%, transparent), transparent 70%), radial-gradient(40% 55% at 10% 70%, var(--brand-soft), transparent 70%)" }} />
          <div className="relative mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-[32px] leading-tight font-bold tracking-[-0.025em] text-balance sm:text-[40px]">
            {t("landing.whereTitle")}
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.landing.where.map((place, i) => {
              const Icon = WHERE_ICONS[i % WHERE_ICONS.length]!;
              return (
                <li key={place.title} className="glass-card group rounded-[24px] p-6">
                  <span className="flex size-11 items-center justify-center rounded-[14px] bg-brand-soft text-brand transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-title-3">{place.title}</h3>
                  <p className="mt-2 text-callout text-ink-2">{place.body}</p>
                </li>
              );
            })}
          </ul>
          </div>
        </section>

        {/* A real sequence, so the steps are numbered. */}
        <section className="relative bg-grouped py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(45% 70% at 15% 20%, var(--brand-soft), transparent 70%), radial-gradient(40% 60% at 90% 80%, color-mix(in srgb, #B83280 14%, transparent), transparent 70%)" }} />
          <div className="relative mx-auto max-w-6xl px-5">
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]">{t("landing.howTitle")}</h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {dict.landing.steps.map((step, i) => (
                <li key={step.title} className="glass-card group rounded-[24px] p-6">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-subhead font-bold text-primary-fg transition-transform duration-500 ease-spring group-hover:scale-125">
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
          <article className="glass-card rounded-[28px] p-8">
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

          <article className="glass-card rounded-[28px] p-8">
            <h2 className="text-title-1">{t("landing.staffTitle")}</h2>
            <p className="mt-3 text-callout text-ink-2">{t("landing.staffBody")}</p>
            <div
              className="mt-8 rounded-[24px] p-5 text-white shadow-float"
              style={{ background: "linear-gradient(145deg, #c94f95 0%, #B83280 45%, #6e1e4d 100%)" }}
              aria-hidden
            >
              <div className="flex justify-between text-footnote font-semibold text-white/80">
                <span>{t("me.thisWeek")}</span>
                <span>Thalassa Beach Hotel</span>
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

        {/* The offer. Always dark, in both colour schemes, so it reads as the one thing to act on. */}
        <section className="px-5 pb-20">
          <div
            className="mx-auto grid max-w-6xl gap-10 rounded-[32px] p-8 text-white shadow-float sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
            style={{ background: "linear-gradient(140deg, #0047D6 0%, #0A2A6B 55%, #1d1d1f 100%)" }}
          >
            <div>
              <h2 className="text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[46px]">
                {t("landing.pilotTitle")}
              </h2>
              <p className="mt-4 max-w-md text-[18px] leading-[1.45] text-white/75">{t("landing.pilotBody")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {env.pilotUrl ? (
                  <a
                    href={env.pilotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses("primary", "lg", "bg-white text-[#1d1d1f]")}
                  >
                    {t("landing.pilotCta")}
                  </a>
                ) : (
                  <LinkButton href="/login" size="lg" className="bg-white text-[#1d1d1f]">
                    {t("landing.ctaOwner")}
                  </LinkButton>
                )}
                <span className="text-subhead text-white/60">{t("landing.pilotNote")}</span>
              </div>
            </div>
            <ul className="space-y-3">
              {dict.landing.pilotPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-[18px] bg-white/10 px-4 py-3.5 text-headline">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[#0047D6]">
                    <Check size={13} strokeWidth={3.5} aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-grouped py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]">{t("landing.pricingTitle")}</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="glass-card rounded-[24px] p-7">
                <h3 className="text-title-3">{t("landing.pricingFree")}</h3>
                <p className="mt-1 text-[34px] font-bold tracking-tight">€0</p>
                <p className="mt-3 text-callout text-ink-2">{t("landing.pricingFreeBody")}</p>
              </div>
              <div className="rounded-[24px] bg-primary p-7 text-primary-fg shadow-float transition-transform duration-500 ease-spring hover:-translate-y-1.5 hover:scale-[1.015]">
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
