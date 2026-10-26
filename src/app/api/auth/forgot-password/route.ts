// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password — the 3-state reset flow's request leg
// (S15/ADR-013). ALWAYS answers 200 (no account oracle). No SMTP: when the
// operator opts into in-app delivery (V2 C1 — RESET_INAPP_DELIVERY=1, or
// any non-production environment) the reset URL rides the response; in a
// default production boot the response NEVER carries the token (a raw
// 200-shape leak turned any known email into an account takeover; recovery
// without a mail channel is the documented CLI/seed path). The 30-minute
// one-shot PasswordResetToken is created here, consumed by reset-password.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { checkRateLimit, generateResetToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { inAppResetDeliveryEnabled } from "@/lib/reset-delivery";
import { clientIp } from "@/lib/server/auth";
import {
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const forgotSchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`forgot:${ip}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(
        limit.retryAfterSec,
        "Too many reset requests. Try again shortly.",
      );
    }

    const { email } = parseWith(forgotSchema, await readJson(request));
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      const token = generateResetToken();
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });
      if (
        inAppResetDeliveryEnabled(
          process.env.NODE_ENV,
          process.env.RESET_INAPP_DELIVERY,
        )
      ) {
        // The absolute URL derives from the REQUEST origin (the e2e suite
        // serves the app on a non-default port; siteUrl() is the metadata
        // origin, not the serving origin).
        const origin = request.nextUrl.origin;
        return NextResponse.json({
          ok: true,
          resetPath: `/reset-password?token=${token}`,
          resetUrl: `${origin}/reset-password?token=${token}`,
        });
      }
      // The default production shape: identical for known and unknown
      // emails, carrying nothing an attacker can use.
      return NextResponse.json({ ok: true });
    }

    // Unknown email: the identical 200 with no link (no enumeration).
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
