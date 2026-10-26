// ---------------------------------------------------------------------------
// /api/shifts — GET the shift history (newest first, 200 cap) and POST to
// open a shift (the Abrir Turno dialog). The open rules (register free,
// cashier free, float ≥ 0) live in server/pos.ts and answer 400/404.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { listShifts, openShift } from "@/lib/server/pos";
import { parseWith, readJson, toErrorResponse, withUser } from "@/lib/server/http";
import { shiftOpenSchema } from "@/lib/validation";

export const GET = withUser(async (user) => {
  const shifts = await listShifts(user.id);
  return NextResponse.json(shifts);
});

export const POST = withUser(async (user, request: NextRequest) => {
  try {
    const input = parseWith(shiftOpenSchema, await readJson(request));
    const shift = await openShift(user.id, input);
    return NextResponse.json(shift, { status: 201 });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
