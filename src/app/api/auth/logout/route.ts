// ---------------------------------------------------------------------------
// POST /api/auth/logout — clears the pos_session cookie (maxAge 0). The
// stateless token dies client-side; the cookie is doubly dead afterwards.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/server/auth";

export async function POST() {
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
