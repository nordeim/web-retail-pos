// ---------------------------------------------------------------------------
// GET /api/health — liveness + DB probe. Unauthenticated BY DESIGN: the e2e
// webServer gate and the Docker healthcheck both poll it before any session
// exists. A trivial query proves the Prisma connection (and, transitively,
// that the db-path contract resolved a real file).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", app: "veloxpos" });
  } catch (err: unknown) {
    // The health endpoint is the one place a server-side log is expected —
    // the probe IS the signal; the body stays uniform.
    console.error("[h[health] db probe failed:", err);
    return NextResponse.json(
      { status: "degraded", db: "down", app: "veloxpos" },
      { status: 503 },
    );
  }
}
