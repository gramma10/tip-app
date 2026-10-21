"use client";

import { Check, ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const ACCENTS = ["#0A66FF", "#0F766E", "#B83280", "#6B46C1", "#C05621", "#1D1D1F"];

type Values = { name: string; city: string; accentColor: string; googlePlaceId: string; presets: number[] };

const field = "h-7 w-full bg-transparent text-body placeholder:text-ink-3 focus:outline-none";

export function SettingsForm({ initial }: { initial: Values }) {
  const { t } = useI18n();
  const [v, setV] = useState<Values>(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateSettings(v);
          if (res.ok) toast.success(t("dash.settings.saved"));
          else toast.error(t("common.genericError"));
        });
      }}
    >
      <section className="space-y-1.5">
        <h2 className="px-4 text-footnote text-ink-2">{t("dash.settings.venue")}</h2>
        {/* Airbnb-style stacked labels: they fit long Greek labels and keep the value prominent. */}
        <div className="overflow-hidden rounded-card bg-surface shadow-card">
          <label className="block px-4 pt-2.5 pb-2 shadow-[inset_0_-0.5px_0_var(--line)] focus-within:bg-fill/40">
            <span className="block text-caption text-ink-2">{t("dash.settings.name")}</span>
            <input value={v.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} className={field} />
          </label>
          <label className="block px-4 pt-2.5 pb-2 focus-within:bg-fill/40">
            <span className="block text-caption text-ink-2">{t("dash.settings.city")}</span>
            <input value={v.city} onChange={(e) => set("city", e.target.value)} maxLength={60} className={field} />
          </label>
        </div>
      </section>

      <section className="space-y-1.5">
        <h2 className="px-4 text-footnote text-ink-2">{t("dash.settings.accent")}</h2>
        <div role="radiogroup" aria-label={t("dash.settings.accent")} className="flex gap-3 rounded-card bg-surface p-4 shadow-card">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={v.accentColor.toLowerCase() === c.toLowerCase()}
              aria-label={c}
              onClick={() => set("accentColor", c)}
              className="flex size-9 items-center justify-center rounded-full text-white transition active:scale-90"
              style={{ background: c }}
            >
              {v.accentColor.toLowerCase() === c.toLowerCase() && <Check size={18} strokeWidth={3} aria-hidden />}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h2 className="px-4 text-footnote text-ink-2">{t("dash.settings.presets")}</h2>
        <div className="grid grid-cols-3 gap-3">
          {v.presets.map((p, i) => (
            <label key={i} className="flex h-14 items-center rounded-card bg-surface px-4 shadow-card">
              <span className="text-body text-ink-2">€</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={150}
                step={0.5}
                value={p}
                onChange={(e) => set("presets", v.presets.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                aria-label={`${t("dash.settings.presets")} ${i + 1}`}
                className="w-full bg-transparent pl-1 text-headline focus:outline-none"
              />
            </label>
          ))}
        </div>
        <p className="px-4 text-footnote text-ink-2">{t("dash.settings.presetsHint")}</p>
      </section>

      <section className="space-y-1.5">
        <h2 className="px-4 text-footnote text-ink-2">{t("dash.settings.google")}</h2>
        <label className="block rounded-card bg-surface px-4 pt-2.5 pb-2 shadow-card">
          <span className="block text-caption text-ink-2">{t("dash.settings.placeId")}</span>
          <input
            value={v.googlePlaceId}
            onChange={(e) => set("googlePlaceId", e.target.value)}
            placeholder="ChIJ…"
            className={cn(field, "font-mono text-subhead")}
          />
        </label>
        <p className="px-4 text-footnote text-ink-2">
          {t("dash.settings.placeIdHint")}{" "}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-brand"
          >
            {t("dash.settings.placeIdFind")}
            <ExternalLink size={12} aria-hidden />
          </a>
        </p>
      </section>

      {dirty && (
        <div className="sticky bottom-24 z-10 lg:bottom-6">
          <Button type="submit" variant="brand" size="lg" className="w-full shadow-float" disabled={pending}>
            {t("common.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
