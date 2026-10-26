// ---------------------------------------------------------------------------
// GET /api/reports/summary?days=7|14|30|90 — the Reports feed: KPIs, the
// daily series and the payment-method breakdown. Bucketing happens in the
// pure seams (src/lib/reports.ts); this route is a thin read + shape.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { salesForReports } from "@/lib/server/pos";
import { toErrorResponse, withUser } from "@/lib/server/http";
import { isPeriodDays, periodStart, periodSummary } from "@/lib/reports";

export const GET = withUser(async (user, request: NextRequest) => {
  try {
    const raw = Number(request.nextUrl.searchParams.get("days") ?? "30");
    const days = isPeriodDays(raw) ? raw : 30;
    const sales = await salesForReports(user.id);
    const start = periodStart(new Date(), days - 1);
    const summary = periodSummary(sales, start);
    return NextResponse.json({
      days,
      start: start.toISOString(),
      revenueCents: summary.revenueCents,
      transactions: summary.transactions,
      averageTicketCents: summary.averageTicketCents,
      sales: sales.filter((s) => new Date(s.createdAt).getTime() >= start.getTime()),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
