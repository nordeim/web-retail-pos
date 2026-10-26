"use client";

// ---------------------------------------------------------------------------
// Shared view primitives — the pieces every POS view reuses: the page
// header, the reference's rounded empty-state card, the status badges and
// the filter chip row. Visual contract: measured off the live reference
// (2026-10-26) — dim slate titles (the a11y-superset deviation, ≈4.1:1 on
// the dark canvas), 16px-radius cards with the 0 8px 32px black glow.
// ---------------------------------------------------------------------------

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** h1 + optional subtitle + optional right-side action. The h1 renders
 *  slate-500 — the reference's own #1e293b-on-dark is ~1.1:1; documented. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-500">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/** The reference's empty state: a centered rounded card with a big dim
 *  icon, a bold title and a muted description. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pos-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <Icon className="h-14 w-14 text-violet-400/70" strokeWidth={1.6} />
      <h2 className="text-xl font-bold text-slate-300">{title}</h2>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

/** Status badges — "Activo"/"Completada" green-on-green-100, "Cerrada"
 *  dark-on-slate-100 (reference-measured fills). */
export function Badge({
  tone,
  children,
  className,
}: {
  tone: "success" | "neutral" | "danger" | "warning" | "violet";
  children: React.ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    success: "bg-green-100 text-green-700",
    neutral: "bg-slate-100 text-slate-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The filter chip row (Todos / categories): active = pos-gradient + white,
 *  inactive = #161a2b surface with slate-300 text (reference-measured). */
export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sf-primary/40",
        active
          ? "pos-gradient text-white shadow-[0_4px_16px_rgb(99_102_241/0.4)]"
          : "border border-[#1e2235] bg-[#141828] text-slate-300 hover:border-[#2a2f4a] hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Section heading inside a card ("Ventas — Últimos 7 días"). */
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-base font-bold text-slate-300", className)}>{children}</h3>
  );
}

/** The dashboard/report stat card with the right-side glowing icon chip. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "violet" | "blue" | "orange";
}) {
  const tones: Record<string, { chip: string; glow: string }> = {
    green: { chip: "bg-emerald-500 text-white", glow: "rgb(16 185 129 / 0.35)" },
    violet: { chip: "bg-violet-500 text-white", glow: "rgb(139 92 246 / 0.35)" },
    blue: { chip: "bg-blue-500 text-white", glow: "rgb(59 130 246 / 0.35)" },
    orange: { chip: "bg-amber-500 text-white", glow: "rgb(245 158 11 / 0.35)" },
  };
  const t = tones[tone];
  return (
    <div className="pos-card relative flex items-center justify-between overflow-hidden p-5">
      <div aria-hidden className="absolute -right-4 -top-6 h-20 w-28 rounded-full bg-white/[0.03] blur-xl" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold text-slate-300">{value}</p>
      </div>
      <span
        aria-hidden
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", t.chip)}
        style={{ boxShadow: `0 6px 24px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
    </div>
  );
}

/** The primary gradient button (Nuevo Producto / Nueva Caja / Guardar). */
export function GradientButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "pos-gradient inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** The emerald success button (COBRAR / Abrir Turno / Iniciar Turno). */
export function SuccessButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "pos-gradient-success inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Small square icon button (table actions). */
export function IconButton({
  label,
  icon: Icon,
  tone = "default",
  className,
  ...props
}: {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sf-primary/40",
        tone === "danger"
          ? "text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white",
        className,
      )}
      {...props}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
    </button>
  );
}
