// ---------------------------------------------------------------------------
// /api/shifts/[id]/close — POST closes the turno: computes expected
// (float + cash sales) and the counted difference inside the write.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { closeShift } from "@/lib/server/pos";
import { parseWith, readJson, toErrorResponse, withUserParams } from "@/lib/server/http";
import { shiftCloseSchema } from "@/lib/validation";

export const POST = withUserParams(async (user, request, id) => {
  try {
    const input = parseWith(shiftCloseSchema, await readJson(request));
    const shift = await closeShift(user.id, id, input);
    return NextResponse.json(shift);
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
