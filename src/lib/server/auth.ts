// ---------------------------------------------------------------------------
// The server-side auth layer (the next/headers half — src/lib/auth.ts is the
// pure seam). Reads the `sf_session` httpOnly cookie through the request
// cookie store, verifies the HMAC token, resolves the user; builds the
// session/clear cookie helpers the auth routes answer with.
//
// Layering (documented in src/lib/auth.ts): everything HERE may import
// next/headers + the db; nothing in src/lib/auth.ts does.
// ---------------------------------------------------------------------------

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { db } from "../db";
import { createSessionToken, readSessionToken, resolveClientIp } from "../auth";
import { UnauthorizedError } from "./http";

// ---- the session cookie contract ------------------------------------------------

export const SESSION_COOKIE_NAME = "sf_session";
/** 7 days — mirrors SESSION_TTL_MS in the pure seam. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

// ---- the session user (hashless by construction) -----------------------------

/** The columns every authed surface may see — passwordHash is never in the
 *  select (rule #3: no secret fields in any select). */
const SESSION_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  emailVerified: true,
  tokenVersion: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

/** The API's public user shape — `name`, never the hash. Every user-bearing
 *  response funnels through this mapper. */
export function publicUser(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ---- reading the session ---------------------------------------------------------

/** Resolve the signed-in user from the `sf_session` cookie, or null. The
 *  token verification (HMAC + expiry) is the pure seam's job; the DB lookup
 *  proves the user still exists (a deleted account's cookie is dead) and
 *  that the token's version matches the row (V2 M6: a password reset bumps
 *  tokenVersion, instantly revoking every pre-reset cookie). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = readSessionToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.uid },
    select: SESSION_USER_SELECT,
  });
  if (!user || user.tokenVersion !== payload.v) return null;
  return user;
}

/** The gate every authed route starts with. Throws UnauthorizedError → the
 *  withUser wrapper maps it to the uniform 401 JSON. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

// ---- writing/clearing the session ---------------------------------------------------

/**
 * Attach the session cookie to a response: httpOnly, sameSite=lax, 7-day
 * maxAge, path=/. `secure` rides the REQUEST protocol — a Secure cookie is
 * silently DROPPED by browsers on a plain-HTTP non-localhost origin (the
 * e2e suite serves the standalone build over http on a fixed port), so
 * deriving it from the request (with the production default when the
 * caller cannot know) is the correct contract.
 */
export function setSessionCookie(
  response: NextResponse,
  userId: string,
  options?: { secure?: boolean; tokenVersion?: number },
): NextResponse {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionToken(userId, options?.tokenVersion ?? 0),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: options?.secure ?? process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    },
  );
  return response;
}

/** Clear the session cookie (logout + account deletion): maxAge 0 — the
 *  browser drops it immediately. */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}

// ---- client-IP extraction (the limiter's key material) -------------------------------

/** The limiter's key: resolved through the trusted-proxy-hop contract
 *  (src/lib/auth.ts resolveClientIp — the pure seam, unit-pinned). The
 *  historical first-hop read let a rotated x-forwarded-for header mint a
 *  fresh bucket per request (V2 H3). */
export function clientIp(request: Request): string {
  return resolveClientIp(request.headers.get("x-forwarded-for"));
}
