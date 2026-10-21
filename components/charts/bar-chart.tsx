"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BarDatum = { key: string; label: string; value: number; detail?: string };

/**
 * Single-series column chart (one hue, no legend: the card title names it).
 * Columns cap at 24px, 4px rounded tops, square baseline, hairline grid, hover tooltip,
 * and a visually hidden table for screen readers.
 */
export function BarChart({
  data,
  formatValue,
  formatTick,
  height = 200,
  title,
  className,
}: {
  data: BarDatum[];
  formatValue: (v: number) => string;
  formatTick: (v: number) => string;
  height?: number;
  title: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const axisW = 44;
  const bottom = 22;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, Math.max(2, band - 2)); // 2px surface gap between neighbours
  const topPad = 10; // room for the top tick label
  const y = (v: number) => plotH - (v / top) * (plotH - topPad);
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));

  const hovered = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className={cn("relative select-none", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={title} aria-describedby={tableId}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={axisW} x2={width} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={axisW - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                {formatTick(tick)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = axisW + band * i + band / 2;
            const h = plotH - y(d.value);
            const x = cx - barW / 2;
            const r = Math.min(4, barW / 2, h);
            const active = hover === i;
            return (
              <g key={d.key}>
                {h > 0 && (
                  <path
                    d={`M${x},${plotH} V${plotH - h + r} Q${x},${plotH - h} ${x + r},${plotH - h} H${x + barW - r} Q${x + barW},${plotH - h} ${x + barW},${plotH - h + r} V${plotH} Z`}
                    fill="var(--brand)"
                    opacity={hover == null || active ? 1 : 0.45}
                    className="transition-opacity duration-150"
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={cx} y={height - 4} textAnchor="middle" className="fill-ink-3 text-[11px]">
                    {d.label}
                  </text>
                )}
                {/* Hit target spans the full band and height, much larger than the mark. */}
                <rect
                  x={axisW + band * i}
                  y={0}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onPointerDown={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {hovered && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[12px] bg-surface-raised px-3 py-2 text-footnote shadow-float"
          style={{ left: Math.min(Math.max(axisW + band * hover + band / 2, 70), width - 70) }}
        >
          <div className="text-ink-2">{hovered.label}</div>
          <div className="text-subhead font-semibold">{formatValue(hovered.value)}</div>
          {hovered.detail && <div className="text-ink-2">{hovered.detail}</div>}
        </div>
      )}

      <table id={tableId} className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 3–5 round tick values from 0 to just above max. */
function niceTicks(max: number) {
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.0001 || ticks.length < 2; v += step) ticks.push(v);
  if (ticks[ticks.length - 1]! < max) ticks.push(ticks[ticks.length - 1]! + step);
  return ticks;
}
