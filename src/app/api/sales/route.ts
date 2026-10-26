// ---------------------------------------------------------------------------
// /api/sales — GET the sale history (with line items, newest first) and
// POST the Terminal checkout. The checkout is the guarded transaction:
// open-shift gate → per-line stock decrement → Sale + SaleItems.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkout, listSales } from "@/lib/server/pos";
import { parseWith, readJson, toErrorResponse, withUser } from "@/lib/server/http";
import { checkoutSchema } from "@/lib/validation";

export const GET = withUser(async (user) => {
  const sales = await listSales(user.id);
  return NextResponse.json(sales);
});

export const POST = withUser(async (user, request: NextRequest) => {
  try {
    const input = parseWith(checkoutSchema, await readJson(request));
    const sale = await checkout(user.id, {
      items: input.items,
      paymentMethod: input.paymentMethod,
      customerName: input.customerName,
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
