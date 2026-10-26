import { describe, expect, it } from "vitest";

import {
  byPaymentMethod,
  categoryDistribution,
  dailySeries,
  inPeriod,
  isPeriodDays,
  last7Days,
  lowStockProducts,
  periodStart,
  periodSummary,
  type SaleLike,
} from "@/lib/reports";

function sale(overrides: Partial<SaleLike> = {}): SaleLike {
  return {
    id: Math.random().toString(36).slice(2),
    totalCents: 1000,
    paymentMethod: "cash",
    status: "completed",
    createdAt: new Date(),
    ...overrides,
  };
}

const NOW = new Date(2026, 9, 26, 12, 0, 0); // lun 26 oct 2026, noon

describe("period helpers", () => {
  it("periodStart(…, 6) is the local midnight six days back", () => {
    const start = periodStart(NOW, 6);
    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(20);
  });

  it("isPeriodDays accepts only the reference's toggle", () => {
    expect(isPeriodDays(7)).toBe(true);
    expect(isPeriodDays(90)).toBe(true);
    expect(isPeriodDays(6)).toBe(false);
  });

  it("inPeriod excludes refunds and pre-window sales", () => {
    const start = periodStart(NOW, 6);
    expect(inPeriod(sale(), start)).toBe(true);
    expect(inPeriod(sale({ status: "refunded" }), start)).toBe(false);
    expect(inPeriod(sale({ createdAt: new Date(2020, 0, 1) }), start)).toBe(false);
  });
});

describe("periodSummary", () => {
  it("sums revenue/transactions and averages the ticket", () => {
    const sales = [
      sale({ totalCents: 2146 }),
      sale({ totalCents: 6148 }),
      sale({ totalCents: 99999, status: "refunded" }),
    ];
    const summary = periodSummary(sales, periodStart(NOW, 30));
    expect(summary.transactions).toBe(2);
    expect(summary.revenueCents).toBe(8294);
    expect(summary.averageTicketCents).toBe(4147); // 8294/2 rounded
  });

  it("an empty period is zeros (the reference's Sin datos state)", () => {
    const summary = periodSummary([], periodStart(NOW, 7));
    expect(summary).toEqual({ revenueCents: 0, transactions: 0, averageTicketCents: 0 });
  });
});

describe("dailySeries / last7Days", () => {
  it("zero-fills every local day and buckets by day", () => {
    const sales = [
      sale({ totalCents: 2146, createdAt: new Date(2026, 9, 25, 22, 9) }),
      sale({ totalCents: 1000, createdAt: new Date(2026, 9, 25, 23, 50) }),
    ];
    const series = dailySeries(sales, periodStart(NOW, 6), NOW);
    expect(series).toHaveLength(7);
    const dom25 = series.find((p) => p.label === "25 oct");
    expect(dom25?.revenueCents).toBe(3146);
    expect(dom25?.transactions).toBe(2);
    expect(series[series.length - 1].label).toBe("26 oct");
  });

  it("last7Days returns exactly 7 points oldest→newest", () => {
    expect(last7Days([], NOW)).toHaveLength(7);
  });
});

describe("byPaymentMethod", () => {
  it("groups revenue per method within the period", () => {
    const sales = [
      sale({ totalCents: 2146, paymentMethod: "cash" }),
      sale({ totalCents: 5000, paymentMethod: "card" }),
      sale({ totalCents: 1000, paymentMethod: "cash" }),
    ];
    const methods = byPaymentMethod(sales, periodStart(NOW, 30));
    const cash = methods.find((m) => m.method === "cash");
    expect(cash?.revenueCents).toBe(3146);
    expect(cash?.transactions).toBe(2);
  });
});

describe("categoryDistribution / lowStockProducts", () => {
  it("counts active products per category and names orphans", () => {
    const products = [
      { id: "1", categoryId: "c1", active: true },
      { id: "2", categoryId: "c1", active: true },
      { id: "3", categoryId: null, active: true },
      { id: "4", categoryId: "c2", active: false },
    ];
    const donut = categoryDistribution(products, [
      { id: "c1", name: "Bebidas" },
      { id: "c2", name: "Snacks" },
    ]);
    expect(donut.find((d) => d.name === "Bebidas")?.count).toBe(2);
    expect(donut.find((d) => d.name === "Sin categoría")?.count).toBe(1);
    expect(donut.find((d) => d.name === "Snacks")).toBeUndefined();
  });

  it("lowStock lists active products at/below min, lowest first", () => {
    const products = [
      { id: "1", name: "A", stock: 3, minStock: 5, active: true },
      { id: "2", name: "B", stock: 0, minStock: 5, active: true },
      { id: "3", name: "C", stock: 10, minStock: 5, active: true },
      { id: "4", name: "D", stock: 1, minStock: 5, active: false },
    ];
    const low = lowStockProducts(products);
    expect(low.map((p) => p.name)).toEqual(["B", "A"]);
  });
});
