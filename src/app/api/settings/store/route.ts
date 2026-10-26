// ---------------------------------------------------------------------------
// /api/settings/store — GET returns (creating) the 1:1 StoreSettings row;
// PATCH validates and applies the sent keys. The two colors ride back to
// the shell as CSS vars (see page.tsx).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { getOrCreateSettings, updateSettings } from "@/lib/server/settings";
import { readJson, toErrorResponse, withUser } from "@/lib/server/http";

export const GET = withUser(async (user) => {
  const settings = await getOrCreateSettings(user.id);
  return NextResponse.json(settings);
});

export const PATCH = withUser(async (user, request: NextRequest) => {
  try {
    const settings = await updateSettings(user.id, await readJson(request));
    return NextResponse.json(settings);
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
