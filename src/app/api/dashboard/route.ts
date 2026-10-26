// ---------------------------------------------------------------------------
// /api/dashboard — the stats + series the Dashboard view renders:
// sales today, transactions today, product count, low-stock count,
// the 7-day sales series (per-date weekday labels — the live reference ends
// the series at today), the category split, and the low-stock rows.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { startOfDay, weekWindow } from "@/lib/date";
import { withUser } from "@/lib/server/http";

export async function buildDashboard(userId: string, now: Date) {
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [todaySales, productCount, lowStockRows, weekSales, categories] =
    await Promise.all([
      db.sale.aggregate({
        where: { userId, status: "completada", createdAt: { gte: today } },
        _sum: { total: true },
        _count: true,
      }),
      db.product.count({ where: { userId } }),
      db.product.findMany({
        where: { userId, active: true, stock: { lte: db.product.fields.minStock } },
        select: { id: true, name: true, stock: true, minStock: true },
        orderBy: { stock: "asc" },
      }),
      db.sale.findMany({
        where: { userId, status: "completada", createdAt: { gte: weekStart } },
        select: { createdAt: true, total: true },
      }),
      db.category.findMany({
        where: { userId },
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Bucket the week's sales by local calendar day. V2 M2: the labels come
  // from weekWindow — each day labeled by its OWN weekday (the historical
  // positional WEEKDAY_MIN[index] was wrong whenever the rolling window did
  // not start on a Monday).
  const window = weekWindow(today);
  const buckets = new Map<string, { total: number; label: string }>();
  for (const day of window) {
    buckets.set(day.date.toDateString(), { total: 0, label: day.label });
  }
  for (const sale of weekSales) {
    const bucket = buckets.get(sale.createdAt.toDateString());
    if (bucket) bucket.total += sale.total;
  }
  const weekly = Array.from(buckets.values()).map(({ label, total }) => ({
    label,
    total,
  }));

  return {
    salesToday: todaySales._sum.total ?? 0,
    transactionsToday: todaySales._count,
    productCount,
    lowStockCount: lowStockRows.length,
    weekly,
    byCategory: categories.map((c) => ({ name: c.name, count: c._count.products })),
    lowStock: lowStockRows,
  };
}

export const GET = withUser(async (user) => {
  const data = await buildDashboard(user.id, new Date());
  return NextResponse.json(data);
});
