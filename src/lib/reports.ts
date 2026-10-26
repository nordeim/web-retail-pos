// ---------------------------------------------------------------------------
// Reporting seams — every chart/KPI number the Dashboard and Reports views
// render is computed HERE, never inside a component (§5.2 charting rule).
// Inputs are plain sale rows (JSON-shaped, as the API returns them).
// Pinned by tests/reports.test.ts.
// ---------------------------------------------------------------------------

export type SaleLike = {
  id: string;
  totalCents: number;
  paymentMethod: string; // cash | card | transfer
  status: string; // completed | refunded
  createdAt: string | Date;
};

export type PeriodDays = 7 | 14 | 30 | 90;
export const PERIODS: PeriodDays[] = [7, 14, 30, 90];

export function isPeriodDays(value: number): value is PeriodDays {
  return (PERIODS as number[]).includes(value);
}

/** Start of the local day `daysAgo` days before `now` (0 = today). */
export function periodStart(now: Date, days: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export function inPeriod(sale: SaleLike, start: Date): boolean {
  if (sale.status !== "completed") return false;
  const t = typeof sale.createdAt === "string" ? new Date(sale.createdAt) : sale.createdAt;
  return t.getTime() >= start.getTime();
}

/** The three Reports KPI cards: ingresos totales, transacciones, ticket promedio. */
export type PeriodSummary = {
  revenueCents: number;
  transactions: number;
  averageTicketCents: number;
};

export function periodSummary(sales: SaleLike[], start: Date): PeriodSummary {
  let revenueCents = 0;
  let transactions = 0;
  for (const sale of sales) {
    if (!inPeriod(sale, start)) continue;
    revenueCents += sale.totalCents;
    transactions += 1;
  }
  return {
    revenueCents,
    transactions,
    averageTicketCents: transactions > 0 ? Math.round(revenueCents / transactions) : 0,
  };
}

/** Daily buckets for the VENTAS DIARIAS area chart — one point per local day
 *  from start to now, zero-filled; label "27 sep". */
export type DailyPoint = { date: string; label: string; revenueCents: number; transactions: number };

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function dailySeries(sales: SaleLike[], start: Date, now: Date = new Date()): DailyPoint[] {
  const byDay = new Map<string, DailyPoint>();
  const cursor = new Date(start);
  while (cursor.getTime() <= now.getTime()) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    byDay.set(key, {
      date: key,
      label: `${cursor.getDate()} ${MONTHS_SHORT[cursor.getMonth()]}`,
      revenueCents: 0,
      transactions: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const sale of sales) {
    if (!inPeriod(sale, start)) continue;
    const t = typeof sale.createdAt === "string" ? new Date(sale.createdAt) : sale.createdAt;
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.revenueCents += sale.totalCents;
      bucket.transactions += 1;
    }
  }
  return Array.from(byDay.values());
}

/** The Dashboard's 7-day bar chart — same buckets, oldest → newest. */
export function last7Days(sales: SaleLike[], now: Date = new Date()): DailyPoint[] {
  return dailySeries(sales, periodStart(now, 6), now);
}

export type MethodSlice = { method: string; revenueCents: number; transactions: number };

/** Revenue grouped by payment method for the period. */
export function byPaymentMethod(sales: SaleLike[], start: Date): MethodSlice[] {
  const out = new Map<string, MethodSlice>();
  for (const sale of sales) {
    if (!inPeriod(sale, start)) continue;
    const slice = out.get(sale.paymentMethod) ?? {
      method: sale.paymentMethod,
      revenueCents: 0,
      transactions: 0,
    };
    slice.revenueCents += sale.totalCents;
    slice.transactions += 1;
    out.set(sale.paymentMethod, slice);
  }
  return Array.from(out.values());
}

export type CategorySlice = { categoryId: string | null; name: string; count: number; color: string };

/** Product counts per category for the Dashboard donut (inactive products excluded). */
export function categoryDistribution(
  products: { id: string; categoryId: string | null; active: boolean }[],
  categories: { id: string; name: string; color?: string }[],
): CategorySlice[] {
  const nameOf = new Map(categories.map((c) => [c.id, c.name]));
  const colorOf = new Map(categories.map((c) => [c.id, c.color ?? "#8b5cf6"]));
  const out = new Map<string, CategorySlice>();
  for (const p of products) {
    if (!p.active) continue;
    const key = p.categoryId ?? "_none";
    const slice = out.get(key) ?? {
      categoryId: p.categoryId,
      name: p.categoryId ? nameOf.get(p.categoryId) ?? "Sin categoría" : "Sin categoría",
      count: 0,
      color: p.categoryId ? colorOf.get(p.categoryId) ?? "#8b5cf6" : "#475569",
    };
    slice.count += 1;
    out.set(key, slice);
  }
  return Array.from(out.values());
}

/** Products at/below their minimum stock, lowest margin first. */
export function lowStockProducts(
  products: { id: string; name: string; stock: number; minStock: number; active: boolean }[],
): { id: string; name: string; stock: number; minStock: number }[] {
  return products
    .filter((p) => p.active && p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
    .map(({ id, name, stock, minStock }) => ({ id, name, stock, minStock }));
}
