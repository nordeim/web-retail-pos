"use client";

// ---------------------------------------------------------------------------
// The Dashboard view: 4 stat cards, the 7-day sales chart, the category
// donut, and the low-stock card — the reference's exact layout, fed by
// /api/dashboard.
// ---------------------------------------------------------------------------

import * as React from "react";
import {
  TriangleAlert,
  ShoppingBasket,
  Box,
  DollarSign,
  Package,
  ShoppingCart,
} from "lucide-react";

import {
  DonutChart,
  PageHeading,
  SalesAreaChart,
  SectionCard,
  StatCard,
} from "@/components/pos/shared";
import { apiGet } from "@/lib/api";
import { formatLongSpanish } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import type { DashboardData } from "@/lib/store";

const EMPTY: DashboardData = {
  salesToday: 0,
  transactionsToday: 0,
  productCount: 0,
  lowStockCount: 0,
  weekly: [],
  byCategory: [],
  lowStock: [],
};

export function DashboardView() {
  const [data, setData] = React.useState<DashboardData>(EMPTY);
  const [error, setError] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    apiGet<DashboardData>("/api/dashboard")
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoaded(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar");
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date();

  return (
    <div>
      <PageHeading title="Dashboard" subtitle={formatLongSpanish(today)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-stats">
        <StatCard
          label="Ventas hoy"
          value={formatMoney(data.salesToday)}
          color="success"
          testId="stat-sales-today"
          icon={<DollarSign className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Transacciones"
          value={data.transactionsToday}
          color="primary"
          testId="stat-transactions"
          icon={<ShoppingCart className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Productos"
          value={data.productCount}
          color="info"
          testId="stat-products"
          icon={<Package className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Stock bajo"
          value={data.lowStockCount}
          color="warning"
          testId="stat-low-stock"
          icon={<TriangleAlert className="h-6 w-6" strokeWidth={2.2} />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Ventas — Últimos 7 días" testId="weekly-chart-card">
          <SalesAreaChart
            points={(data.weekly ?? []).map((d) => ({ label: d.label, value: d.total / 100 }))}
            // The reference's dashboard Y axis is plain integers (no $).
            formatY={(v) => String(Math.round(v))}
          />
        </SectionCard>
        <SectionCard title="Productos por Categoría" testId="category-chart-card">
          <DonutChart data={data.byCategory ?? []} />
        </SectionCard>
      </div>

      <SectionCard
        title="Productos con stock bajo"
        className="mt-6"
        testId="low-stock-card"
        icon={<TriangleAlert className="h-4.5 w-4.5 text-amber-400" />}
      >
        {!loaded ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : data.lowStock.length === 0 ? (
          <p className="text-sm text-slate-400">Todo el inventario está por encima del mínimo. ✓</p>
        ) : (
          <ul className="space-y-2">
            {data.lowStock.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-xl bg-amber-400/10 px-4 py-3"
              >
                {/* The reference's row anatomy: amber box-icon chip, name,
                    stock line UNDER the name (V2 V6). */}
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400"
                >
                  <Box className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">{product.name}</p>
                  <p className="text-sm font-medium text-orange-400" data-testid="low-stock-detail">
                    {product.stock} en stock (mín. {product.minStock})
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
        <ShoppingBasket className="h-3.5 w-3.5" />
        VeloxPOS
      </div>
    </div>
  );
}
