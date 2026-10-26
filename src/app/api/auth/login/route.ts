// ---------------------------------------------------------------------------
// POST /api/auth/login — the credential exchange. Rate-limited 10/IP/15 min;
// uniform "Invalid email or password" on any credential failure (no user
// enumeration); unverified accounts are gated behind the reference's inline
// copy (403 — the S15 gate). Success sets the sf_session cookie.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, DUMMY_CREDENTIAL_HASH, resetRateLimit, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { clientIp, publicUser, setSessionCookie } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

export const INVALID_CREDENTIALS = "Invalid email or password";
export const UNVERIFIED_COPY =
  "Please verify your email before logging in. Check your email for the verification code.";

export async function POST(request: NextRequest) {
  try {
    // The limiter sits BEFORE validation — invalid payloads consume budget.
    const ip = clientIp(request);
    const limit = checkRateLimit(`login:${ip}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(
        limit.retryAfterSec,
        "Too many login attempts. Try again shortly.",
      );
    }

    const body = await readJson(request);
    const { email, password } = parseWith(loginSchema, body);

    const user = await db.user.findUnique({
      // passwordHash is read ONLY for the scrypt verification and never
      // leaves this handler (publicUser selects its own fields).
      where: { email: email.toLowerCase() },
    });
    // Uniform rejection for both "no such user" and "wrong password" — and
    // BOTH burn the same scrypt cost (V2 M7: the unknown-email branch
    // verifies against the boot-time dummy hash so response timing no
    // longer enumerates which emails exist).
    const passwordOk = verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_CREDENTIAL_HASH,
    );
    if (!user || !passwordOk) {
      return errorResponse(401, INVALID_CREDENTIALS);
    }
    if (!user.emailVerified) {
      return errorResponse(403, UNVERIFIED_COPY);
    }

    // Successful sign-ins RESET the IP limiter (the documented progressive-
    // throttling model — only FAILED attempts consume budget; a legitimate
    // user's later logins must never inherit an attacker's spent bucket).
    resetRateLimit(`login:${ip}`);

    return setSessionCookie(NextResponse.json({ user: publicUser(user) }), user.id, {
      secure: request.nextUrl.protocol === "https:",
      // The row's CURRENT version — a session minted after a reset must
      // match the bumped counter or the next request 401s (V2 M6).
      tokenVersion: user.tokenVersion,
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
