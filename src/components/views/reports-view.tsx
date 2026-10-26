"use client";

// ---------------------------------------------------------------------------
// The Reportes view (/Reports): the period segmented control (7/14/30/90
// días), the 3 KPI cards, the daily sales area chart, and the
// per-method breakdown cards — the reference's layout with real numbers.
// ---------------------------------------------------------------------------

import * as React from "react";
import { CalendarDays, CreditCard, TrendingUp } from "lucide-react";

import {
  PageHeading,
  SalesAreaChart,
  SectionCard,
  StatCard,
} from "@/components/pos/shared";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { ReportData } from "@/lib/store";
import { cn } from "@/lib/utils";

const PERIODS = [
  { days: 7, label: "7 días" },
  { days: 14, label: "14 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
] as const;

const EMPTY: ReportData = {
  totalRevenue: 0,
  transactions: 0,
  averageTicket: 0,
  daily: [],
  byMethod: [],
};

export function ReportsView() {
  const [days, setDays] = React.useState<7 | 14 | 30 | 90>(30);
  const [data, setData] = React.useState<ReportData>(EMPTY);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await apiGet<ReportData>(`/api/reports?days=${days}`);
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setData(EMPTY);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div>
      <PageHeading
        title="Reportes"
        subtitle="Análisis de ventas e ingresos"
        actions={
          <div
            className="flex gap-1 rounded-full border border-[#262a36] bg-[#12141f] p-1"
            role="tablist"
            aria-label="Período del reporte"
            data-testid="report-periods"
          >
            {PERIODS.map((period) => (
              <button
                key={period.days}
                type="button"
                role="tab"
                aria-selected={days === period.days}
                onClick={() => setDays(period.days)}
                className={cn(
                  "vx-focus rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  days === period.days
                    ? "vx-gradient text-white"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3" data-testid="report-stats">
        <StatCard
          label="Ingresos totales"
          value={formatMoney(data.totalRevenue)}
          color="primary"
          testId="report-revenue"
          icon={<TrendingUp className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Transacciones"
          value={data.transactions}
          color="success"
          testId="report-transactions"
          icon={<CalendarDays className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatMoney(data.averageTicket)}
          color="info"
          testId="report-average"
          icon={<CreditCard className="h-6 w-6" strokeWidth={2.2} />}
        />
      </div>

      <SectionCard
        title="Ventas diarias"
        className="mt-6"
        testId="report-daily-card"
        variant="kicker"
      >
        <SalesAreaChart
          points={data.daily.map((d) => ({ label: d.label, value: d.total / 100 }))}
          height={280}
          // Integer $ labels + thinned X ticks — the reference's 30-day
          // chart shows ~8 evenly spaced dates, never a smeared overlap.
          maxLabels={8}
        />
        {loading ? (
          <p className="mt-2 text-xs text-slate-500">Actualizando…</p>
        ) : null}
      </SectionCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Ingresos por método de pago" testId="report-by-method" variant="kicker">
          {data.byMethod.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos en este período</p>
          ) : (
            <ul className="space-y-3">
              {data.byMethod.map((entry) => {
                const share =
                  data.totalRevenue > 0 ? entry.total / data.totalRevenue : 0;
                return (
                  <li key={entry.method}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-slate-200">
                        {entry.method === "tarjeta" ? "Tarjeta" : "Efectivo"}
                      </span>
                      <span className="text-slate-300">
                        {formatMoney(entry.total)} · {entry.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1e2235]">
                      <div
                        className="vx-gradient h-full rounded-full"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Detalle por método" testId="report-method-detail" variant="kicker">
          {data.byMethod.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos en este período</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-2">Método</th>
                  <th className="pb-2 text-right">Ventas</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.byMethod.map((entry) => (
                  <tr key={entry.method} className="border-t border-[#1e2235]">
                    <td className="py-2.5 capitalize text-slate-200">
                      {entry.method === "tarjeta" ? "Tarjeta" : "Efectivo"}
                    </td>
                    <td className="py-2.5 text-right text-slate-300">{entry.count}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-100">
                      {formatMoney(entry.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
