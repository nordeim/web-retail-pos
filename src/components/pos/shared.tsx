"use client";

// ---------------------------------------------------------------------------
// Shared POS presentational pieces: the page heading, the stat card (with
// the reference's ghost duplicate icon), section cards, status pills, and
// the hand-rolled SVG charts (area / donut) — zero chart dependencies,
// deterministic, dark-canvas measured.
// ---------------------------------------------------------------------------

import * as React from "react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

// ---- page heading ------------------------------------------------------------

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {/* The reference H1 is 24px at EVERY viewport (measured live at 390
            and 1280 on 2026-10-26) — no sm:text-3xl step. */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

// ---- stat card -----------------------------------------------------------------

const STAT_COLORS = {
  success: { chip: "bg-emerald-500", text: "text-emerald-400" },
  primary: { chip: "bg-violet-500", text: "text-violet-400" },
  info: { chip: "bg-blue-500", text: "text-blue-400" },
  warning: { chip: "bg-orange-500", text: "text-orange-400" },
} as const;

export function StatCard({
  label,
  value,
  icon,
  color,
  ghost = true,
  testId,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: keyof typeof STAT_COLORS;
  /** The reference renders a big translucent duplicate icon behind the chip. */
  ghost?: boolean;
  testId?: string;
}) {
  const palette = STAT_COLORS[color];
  return (
    <div
      data-testid={testId}
      className="vx-card relative overflow-hidden p-5"
    >
      {ghost && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-2 -top-3 opacity-15",
            palette.text,
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg",
            palette.chip,
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

// ---- section card ----------------------------------------------------------------

/**
 * Two measured heading styles (V2 V1 — live computed styles, 2026-10-26):
 *  · `card`   — Dashboard/Ajustes: h3, title case (no transform),
 *               slate-700, 16px bold (rgb(51,65,85) on the dark canvas —
 *               the reference's own muted look, a disclosed parity choice).
 *  · `kicker` — Reportes: h2, CSS uppercase, white/60, 14px bold,
 *               letter-spacing 0.7px.
 * The DOM text stays title-case in BOTH — only the transform differs.
 */
type SectionCardVariant = "card" | "kicker";

const SECTION_TITLE_CLASS: Record<SectionCardVariant, string> = {
  // The literal reference-measured value (rgb(51,65,85)): Tailwind v4's oklch
  // slate-700 resolves 1 bit off (#314158) — parity here is exact.
  card: "text-base font-bold text-[#334155]",
  kicker: "text-sm font-bold uppercase tracking-[0.7px] text-white/60",
};

export function SectionCard({
  title,
  icon,
  children,
  className,
  testId,
  variant = "card",
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
  variant?: SectionCardVariant;
}) {
  return (
    <div data-testid={testId} className={cn("vx-card p-5", className)}>
      {title ? (
        <div className="mb-4 flex items-center gap-2">
          {icon}
          <h3 className={SECTION_TITLE_CLASS[variant]}>{title}</h3>
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---- pills ------------------------------------------------------------------------

export function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "neutral" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-emerald-400/90 text-emerald-950",
    neutral: "bg-slate-200/90 text-slate-800",
    warning: "bg-amber-400/90 text-amber-950",
    danger: "bg-red-500/90 text-red-950",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MethodPill({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#262a36] bg-[#12141f] px-2.5 py-1 text-xs font-medium text-slate-200">
      <BanknoteIcon className="h-3.5 w-3.5 text-emerald-400" />
      {method === "tarjeta" ? "Tarjeta" : "Efectivo"}
    </span>
  );
}

export function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

// ---- charts -------------------------------------------------------------------------

/** Money axis labels are integer dollars — the reference's `$0`-style Y
 *  axis (V2 V3/V4; the historical label rendered decimals like `$107.3`). */
export const moneyAxisLabel = (v: number): string => `$${Math.round(v)}`;

/** Thin a chart's X labels to at most `maxLabels` evenly stepped entries,
 *  ALWAYS keeping the first and the last (the reference's 30-day chart
 *  shows ~8 of 30 dates; the historical chart rendered all of them
 *  overlapping — V2 V3). Returns a boolean per index. */
export function thinLabels(count: number, maxLabels = 8): boolean[] {
  if (count <= maxLabels) return Array.from({ length: count }, () => true);
  const keep = new Set<number>();
  for (let i = 0; i < maxLabels; i += 1) {
    keep.add(Math.round((i * (count - 1)) / (maxLabels - 1)));
  }
  keep.add(0);
  keep.add(count - 1);
  return Array.from({ length: count }, (_, i) => keep.has(i));
}

/** The 7-day/daily sales area: violet stroke, dashed grid, flat when empty —
 *  exactly how the reference's zero data renders. */
export function SalesAreaChart({
  points,
  height = 260,
  formatY = moneyAxisLabel,
  maxLabels,
}: {
  points: { label: string; value: number }[];
  height?: number;
  formatY?: (v: number) => string;
  /** Thin the X labels when the window is dense (e.g. the 30/90-day
   *  reports); omit for short series where every label fits. */
  maxLabels?: number;
}) {
  const width = 640;
  const padLeft = 52;
  const padBottom = 28;
  const padTop = 12;
  const innerW = width - padLeft - 12;
  const innerH = height - padBottom - padTop;
  const max = Math.max(4, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const x = (i: number) => padLeft + i * stepX;
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const path =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ")
      : "";
  const area =
    points.length > 1
      ? `${path} L${x(points.length - 1)},${padTop + innerH} L${x(0)},${padTop + innerH} Z`
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const visible = maxLabels ? thinLabels(points.length, maxLabels) : points.map(() => true);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Gráfica de ventas"
    >
      {gridLines.map((g) => {
        const gy = padTop + innerH - g * innerH;
        const value = Math.round(max * g * 100) / 100;
        return (
          <g key={g}>
            <line
              x1={padLeft}
              x2={width - 8}
              y1={gy}
              y2={gy}
              stroke="#262a36"
              strokeDasharray="3 4"
            />
            <text x={padLeft - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {formatY(value)}
            </text>
          </g>
        );
      })}
      {area ? <path d={area} fill="rgba(139,92,246,0.12)" /> : null}
      {path ? <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="2" /> : null}
      {points.map((p, i) =>
        visible[i] ? (
          <text
            key={`${p.label}-${i}`}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

const DONUT_COLORS = ["#8b5cf6", "#7c3aed", "#a78bfa", "#c4b5fd", "#22c55e", "#e2e8f0", "#6366f1", "#f59e0b"];

/** One color per category NAME, shared by the arcs AND the legend swatches
 *  (V2 L5 — the legend used to index the unfiltered array while the arcs
 *  indexed the filtered one, so swatch and slice could disagree whenever a
 *  zero-count category preceded non-zero ones). */
function colorByName(data: { name: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  let next = 0;
  for (const d of data) {
    if (map.has(d.name)) continue;
    map.set(d.name, DONUT_COLORS[next % DONUT_COLORS.length]);
    next += 1;
  }
  return map;
}

/** The category donut + legend with counts. */
export function DonutChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const size = 190;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const visible = data.filter((d) => d.count > 0);
  const colors = colorByName(data);

  const fractions = visible.map((d) => (total > 0 ? d.count / total : 0));
  const starts: number[] = [];
  let running = 0;
  for (const fraction of fractions) {
    starts.push(running);
    running += fraction;
  }
  const arcs = visible.map((d, i) => {
    const fraction = fractions[i];
    return {
      ...d,
      color: colors.get(d.name) ?? DONUT_COLORS[i % DONUT_COLORS.length],
      dash: fraction * circumference,
      offset: starts[i] * circumference,
      gap: total > 0 && visible.length > 1 ? 2 : 0,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Productos por categoría"
        className="shrink-0"
      >
        {arcs.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2235" strokeWidth="26" />
        ) : (
          arcs.map((arc) => (
            <circle
              key={arc.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="26"
              strokeDasharray={`${Math.max(0, arc.dash - arc.gap)} ${circumference}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))
        )}
      </svg>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-300">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors.get(d.name) ?? DONUT_COLORS[0] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-semibold text-slate-400">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
