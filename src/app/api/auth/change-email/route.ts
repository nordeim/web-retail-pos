// ---------------------------------------------------------------------------
// POST /api/auth/change-email — the account-identity rotation
// (S26/ADR-024). Rate-limited 10/15-min per user. The password is verified
// FIRST (a wrong password → 400, PRE-WRITE); then the route-side guards —
// must-differ (posting the current address → 400) and uniqueness (an
// address owned by ANY account → 409). The ONE write moves the login
// identifier lowercased; emailVerified STAYS TRUE (the password proof IS
// the verification); the stateless session survives untouched and the
// response carries the new email for the store's identity slice.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { changeEmailSchema } from "@/lib/validation";
import { publicUser, requireUser } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const limit = checkRateLimit(`changeEmail:${user.id}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(limit.retryAfterSec, "Too many attempts. Try again shortly.");
    }

    const { password, email: newEmail } = parseWith(
      changeEmailSchema,
      await readJson(request),
    );

    const stored = await db.user.findUnique({
      where: { id: user.id },
      select: { email: true, passwordHash: true },
    });
    if (!stored || !verifyPassword(password, stored.passwordHash)) {
      return errorResponse(400, "Your password is incorrect.");
    }

    const normalized = newEmail.toLowerCase();
    // The current email is server state, not a body field — must-differ.
    if (normalized === stored.email) {
      return errorResponse(400, "This is already your email address.");
    }

    // Uniqueness: an address owned by ANY account (verified or not) is
    // taken — claiming it would lock that owner out of their own
    // re-registration path.
    const taken = await db.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (taken) {
      return errorResponse(409, "An account with this email already exists. Use a different address.");
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { email: normalized }, // emailVerified intentionally untouched
    });

    return NextResponse.json({ ok: true, email: normalized, user: publicUser(updated) });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
