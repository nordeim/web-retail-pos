// ---------------------------------------------------------------------------
// POST /api/auth/reset-password — the 3-state reset flow's completion leg.
// The 48-hex token is ONE-SHOT (usedAt set inside the same transaction as
// the password write) and expires 30 minutes after issue. The response is
// the success signal the login screen's note renders.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { errorResponse, parseWith, readJson, toErrorResponse } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = parseWith(
      resetPasswordSchema,
      await readJson(request),
    );

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return errorResponse(400, "That reset link is invalid or has expired. Request a new one.");
    }

    // The one-shot consumption, the password write, AND the session-
    // revocation bump ride the SAME transaction — a replay can never land
    // between them, and every pre-reset cookie dies at once (V2 M6: the
    // token version is compared on each authed read).
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: hashPassword(password),
          tokenVersion: { increment: 1 },
        },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
