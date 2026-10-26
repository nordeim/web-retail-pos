// ---------------------------------------------------------------------------
// POST /api/auth/verify-email — the OTP completion (S15/ADR-013). The code
// is normalized (pasted formatting tolerated), matched against the LATEST
// UNEXPIRED token for the account, consumed, and — on success — the account
// is marked verified AND signed in (verify = the email proof).
//
// V2 H2 hardening: the endpoint is rate-limited per IP AND the token carries
// an atomic attempt counter — 6 failed codes invalidate it regardless of the
// window, so a leaked code cannot be brute-forced (10⁶ space, no unlimited
// guesses against a session-granting endpoint).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  checkRateLimit,
  normalizeVerificationCode,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, publicUser, setSessionCookie } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

/** Relaxed on purpose: the code is normalized AFTER the parse (the strict
 *  6-digit regex lives in verifyEmailSchema, but pasted "123 456" must
 *  survive the boundary too). */
const verifyBodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1).max(32),
});

const MAX_CODE_ATTEMPTS = 6;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`verify:${ip}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(
        limit.retryAfterSec,
        "Too many verification attempts. Try again shortly.",
      );
    }

    const { email, code } = parseWith(verifyBodySchema, await readJson(request));
    const normalized = normalizeVerificationCode(code);
    if (!normalized) {
      return errorResponse(400, "Enter the 6-digit code from your email.");
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });
    if (!user) {
      // Uniform rejection — no account-state oracle.
      return errorResponse(400, "That code is invalid or has expired.");
    }

    const token = await db.verificationToken.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    // H2: the attempt counter gates the SUCCESS path too — once the budget
    // is burnt, even the correct code is dead (a brute force that stumbles
    // onto the right code on try 7 must not sign in). The conditional
    // updateMany is the concurrency-safe counter (no read-modify-write
    // race); tripping it deletes the token for good.
    if (!token || token.attempts >= MAX_CODE_ATTEMPTS || token.code !== normalized) {
      if (token) {
        const bumped = await db.verificationToken.updateMany({
          where: { id: token.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
          data: { attempts: { increment: 1 } },
        });
        if (bumped.count === 0) {
          await db.verificationToken.deleteMany({ where: { userId: user.id } });
        }
      }
      return errorResponse(400, "That code is invalid or has expired.");
    }

    // The one-shot consumption + the verification mark in one transaction.
    const [verifiedUser] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      db.verificationToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return setSessionCookie(
      NextResponse.json({ ok: true, user: publicUser(verifiedUser) }),
      user.id,
      {
        secure: request.nextUrl.protocol === "https:",
        tokenVersion: verifiedUser.tokenVersion,
      },
    );
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
