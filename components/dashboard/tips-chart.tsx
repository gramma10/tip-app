"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { useI18n } from "@/lib/i18n/client";
import { formatDay, formatMoney } from "@/lib/utils";

export function TipsChart({ series, title }: { series: { day: string; cents: number; count: number }[]; title: string }) {
  const { locale, t } = useI18n();
  return (
    <BarChart
      className="mt-4"
      title={title}
      data={series.map((p) => ({
        key: p.day,
        label: formatDay(`${p.day}T12:00:00Z`, locale),
        value: p.cents,
        detail: `${p.count} ${t("me.tipsCount").toLowerCase()}`,
      }))}
      formatValue={(v) => formatMoney(v, locale)}
      formatTick={(v) =>
        v >= 100_000 ? `€${Math.round(v / 100_000)}K` : formatMoney(v, locale, { compact: true })
      }
    />
  );
}
