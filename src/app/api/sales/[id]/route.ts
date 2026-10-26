// ---------------------------------------------------------------------------
// /api/sales/[id] — GET one sale with its line items (the ticket dialog).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { getSale } from "@/lib/server/pos";
import { NotFoundError, toErrorResponse, withUserParams } from "@/lib/server/http";

export const GET = withUserParams(async (user, _request, id) => {
  try {
    const sale = await getSale(user.id, id);
    if (!sale) throw new NotFoundError("La venta no existe.");
    return NextResponse.json(sale);
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
