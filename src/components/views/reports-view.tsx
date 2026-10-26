"use client";

// ---------------------------------------------------------------------------
// Reportes (/Reports) — the period toggle (7/14/30/90 días), the three KPI
// cards (left-icon variant the reference uses here), the VENTAS DIARIAS
// area chart, INGRESOS POR MÉTODO DE PAGO (donut) and DETALLE POR MÉTODO.
// Every number is a pure reports.ts seam over the sales feed.
// ---------------------------------------------------------------------------

import * as React from "react";
import { CalendarDays, CreditCard, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge, Chip, PageHeader } from "@/components/views/shared";
import { loadCollection, useCollection, type Sale } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/money";
import {
  PERIODS,
  byPaymentMethod,
  dailySeries,
  periodStart,
  periodSummary,
  type PeriodDays,
} from "@/lib/reports";
import { cn } from "@/lib/utils";

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const METHOD_COLORS: Record<string, string> = {
  cash: "#22c55e",
  card: "#6366f1",
  transfer: "#8b5cf6",
};

export function ReportsView() {
  const sales = useCollection<Sale[]>("/api/sales");
  const [days, setDays] = React.useState<PeriodDays>(30);
  const [now] = React.useState(() => new Date());

  const start = React.useMemo(() => periodStart(now, days - 1), [now, days]);

  const summary = React.useMemo(
    () => periodSummary(sales ?? [], start),
    [sales, start],
  );

  const series = React.useMemo(() => dailySeries(sales ?? [], start, now), [sales, start, now]);

  const methods = React.useMemo(() => byPaymentMethod(sales ?? [], start), [sales, start]);

  // The period chips re-pull the sales feed so numbers stay fresh after
  // checkouts made since the shell mounted.
  const changePeriod = (next: PeriodDays) => {
    setDays(next);
    void loadCollection("/api/sales");
  };

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="reports-view">
      <PageHeader
        title="Reportes"
        subtitle="Análisis de ventas e ingresos"
        action={
          <div
            role="group"
            aria-label="Período"
            data-testid="reports-period"
            className="flex w-full max-w-full flex-wrap gap-1 rounded-2xl border border-[#1e2235] bg-[#141828] p-1 sm:w-auto"
          >
            {PERIODS.map((p) => (
              <Chip
                key={p}
                active={days === p}
                onClick={() => changePeriod(p)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-1.5 whitespace-nowrap sm:flex-none",
                  days === p
                    ? ""
                    : "border-0 bg-transparent text-slate-400 hover:text-white",
                )}
              >
                {p} días
              </Chip>
            ))}
          </div>
        }
      />

      {/* KPI cards — the Reports variant: icon LEFT, label + big value. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(
          [
            { label: "Ingresos totales", value: formatMoney(summary.revenueCents), icon: TrendingUp, chip: "bg-violet-600/25 text-violet-300" },
            { label: "Transacciones", value: formatNumber(summary.transactions), icon: CalendarDays, chip: "bg-emerald-500/15 text-emerald-400" },
            { label: "Ticket promedio", value: formatMoney(summary.averageTicketCents), icon: CreditCard, chip: "bg-violet-600/25 text-violet-300" },
          ] as const
        ).map((card) => (
          <div key={card.label} className="pos-card flex items-center gap-4 p-5">
            <span aria-hidden className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", card.chip)}>
              <card.icon className="h-5.5 w-5.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="truncate text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily area chart. */}
      <div className="pos-card mt-6 p-6" data-testid="reports-daily-chart">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">Ventas diarias</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="posAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#2a2f45" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${Math.round(v / 100)}`}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: "#141828",
                  border: "1px solid #1e2235",
                  borderRadius: 12,
                  color: "#e7e9ef",
                  fontSize: 13,
                }}
                formatter={(value: unknown, name: unknown) =>
                  name === "revenueCents"
                    ? [formatMoney(Number(value)), "Ingresos"]
                    : [String(value), "Ventas"]
                }
              />
              <Area
                type="monotone"
                dataKey="revenueCents"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#posAreaFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ingresos por método. */}
        <div className="pos-card p-6" data-testid="reports-methods">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
            Ingresos por método de pago
          </h3>
          {methods.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">Sin datos en este período</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methods}
                      dataKey="revenueCents"
                      nameKey="method"
                      innerRadius="60%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {methods.map((entry) => (
                        <Cell key={entry.method} fill={METHOD_COLORS[entry.method] ?? "#475569"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        formatMoney(Number(value)),
                        METHOD_LABEL[String(name)] ?? String(name),
                      ]}
                      contentStyle={{
                        background: "#141828",
                        border: "1px solid #1e2235",
                        borderRadius: 12,
                        color: "#e7e9ef",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                {methods.map((m) => (
                  <li key={m.method} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: METHOD_COLORS[m.method] ?? "#475569" }}
                    />
                    <span className="flex-1 truncate text-slate-300">
                      {METHOD_LABEL[m.method] ?? m.method}
                    </span>
                    <span className="font-semibold text-slate-400">{formatMoney(m.revenueCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detalle por método. */}
        <div className="pos-card p-6" data-testid="reports-method-detail">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
            Detalle por método
          </h3>
          {methods.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">Sin datos en este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#1e2235] text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-2.5 pr-4">Método</th>
                  <th scope="col" className="px-4 py-2.5">Transacciones</th>
                  <th scope="col" className="px-4 py-2.5">Ingresos</th>
                  <th scope="col" className="px-4 py-2.5">Ticket prom.</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.method} className="border-b border-[#161a2b] last:border-0">
                    <td className="py-3 pr-4">
                      <Badge tone="violet">{METHOD_LABEL[m.method] ?? m.method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatNumber(m.transactions)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatMoney(m.revenueCents)}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatMoney(m.transactions > 0 ? Math.round(m.revenueCents / m.transactions) : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
