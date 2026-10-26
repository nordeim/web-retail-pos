"use client";

// ---------------------------------------------------------------------------
// Dashboard (/Dashboard) — the KPI header (Ventas Hoy / Transacciones /
// Productos / Stock Bajo with the glowing icon chips), the 7-day sales bar
// chart, the category donut and the low-stock list. All numbers come from
// src/lib/reports.ts pure seams; Recharts renders them (the reference's own
// charting library, measured off its compiled DOM).
// ---------------------------------------------------------------------------

import * as React from "react";
import { AlertTriangle, BarChart3, DollarSign, Package, ShoppingCart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard, CardTitle } from "@/components/views/shared";
import { useCollection, type Category, type Product, type Sale } from "@/lib/data";
import { formatLongDate, formatMoney, formatNumber } from "@/lib/money";
import { categoryDistribution, last7Days, lowStockProducts } from "@/lib/reports";

const DONUT_COLORS = [
  "#8b5cf6",
  "#a78bfa",
  "#6366f1",
  "#22c55e",
  "#3b82f6",
  "#c4b5fd",
  "#475569",
];

export function DashboardView() {
  const sales = useCollection<Sale[]>("/api/sales");
  const products = useCollection<Product[]>("/api/products");
  const categories = useCollection<Category[]>("/api/categories");

  const [now] = React.useState(() => new Date());

  const stats = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completed = (sales ?? []).filter((s) => s.status === "completed");
    const today = completed.filter((s) => new Date(s.createdAt).getTime() >= todayStart.getTime());
    const revenueToday = today.reduce((sum, s) => sum + s.totalCents, 0);
    const active = (products ?? []).filter((p) => p.active);
    return {
      revenueToday,
      transactionsToday: today.length,
      productCount: active.length,
      low: lowStockProducts(products ?? []),
    };
  }, [sales, products]);

  const weekly = React.useMemo(() => last7Days(sales ?? [], now), [sales, now]);

  const donut = React.useMemo(
    () => categoryDistribution(products ?? [], categories ?? []),
    [products, categories],
  );

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="dashboard-view">
      <PageHeader
        title="Dashboard"
        subtitle={formatLongDate(now)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas hoy" value={formatMoney(stats.revenueToday)} icon={DollarSign} tone="green" />
        <StatCard label="Transacciones" value={formatNumber(stats.transactionsToday)} icon={ShoppingCart} tone="violet" />
        <StatCard label="Productos" value={formatNumber(stats.productCount)} icon={Package} tone="blue" />
        <StatCard label="Stock bajo" value={formatNumber(stats.low.length)} icon={AlertTriangle} tone="orange" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 7-day sales bar chart (2/3 width on large screens). */}
        <div className="pos-card p-6 lg:col-span-2">
          <CardTitle className="mb-4">Ventas — Últimos 7 días</CardTitle>
          <div className="h-64" data-testid="dashboard-weekly-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#2a2f45" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tickFormatter={(v: number) => `$${Math.round(v / 100)}`}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "rgba(139,92,246,0.08)" }}
                  contentStyle={{
                    background: "#141828",
                    border: "1px solid #1e2235",
                    borderRadius: 12,
                    color: "#e7e9ef",
                    fontSize: 13,
                  }}
                  formatter={(value: unknown) => formatMoney(Number(value))}
                />
                <Bar dataKey="revenueCents" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category donut. */}
        <div className="pos-card p-6">
          <CardTitle className="mb-4">Productos por Categoría</CardTitle>
          {donut.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">Sin productos aún</p>
          ) : (
            <>
              <div className="h-40" data-testid="dashboard-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut}
                      dataKey="count"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donut.map((entry, index) => (
                        <Cell key={entry.categoryId ?? entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
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
              <ul className="mt-4 space-y-2">
                {donut.map((entry, index) => (
                  <li key={entry.categoryId ?? entry.name} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-slate-300">{entry.name}</span>
                    <span className="font-semibold text-slate-400">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Low stock. */}
      <div className="pos-card mt-6 p-6">
        <CardTitle className="mb-4">Productos con stock bajo</CardTitle>
        {stats.low.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Todo el inventario está por encima de su mínimo.
          </p>
        ) : (
          <ul className="divide-y divide-[#1e2235]">
            {stats.low.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <span className="truncate text-sm font-semibold text-slate-200">{p.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-amber-400">
                    {p.stock} en stock (mín. {p.minStock})
                  </span>
                  <BarChart3 aria-hidden className="h-4 w-4 text-slate-600" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
