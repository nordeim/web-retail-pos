// ---------------------------------------------------------------------------
// Auth primitives: scrypt password hashing, HMAC session tokens, the shared
// in-memory rate limiter, and the S15 verification/reset seam functions.
// Pure — unit-pinned by tests/auth.test.ts. The cookie/server helpers that
// need next/headers live in src/lib/server/auth.ts (documented layering).
// ---------------------------------------------------------------------------

import {
  createHmac,
  randomBytes,
  randomFillSync,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { DEV_FALLBACK_SECRET } from "./env-check";

export { DEV_FALLBACK_SECRET };

const SCRYPT_KEYLEN = 64;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---- password hashing (scrypt) ----------------------------------------------

/** Format: scrypt$<16-byte salt hex>$<64-byte derived key hex> */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length !== 16 || expected.length !== SCRYPT_KEYLEN) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return timingSafeEqual(derived, expected);
}

// ---- session tokens (HMAC over { uid, iat, exp }) -----------------------------

function sessionSecret(): string {
  return process.env.AUTH_SECRET?.trim() || DEV_FALLBACK_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(userId: string, tokenVersion = 0): string {
  const payload = {
    uid: userId,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    v: tokenVersion,
  };
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSessionToken(
  token: string,
): { uid: string; iat: number; exp: number; v: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, mac] = parts;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload !== "object" || payload === null) return null;
    const { uid, iat, exp, v } = payload as Record<string, unknown>;
    if (typeof uid !== "string" || typeof iat !== "number" || typeof exp !== "number") return null;
    if (exp <= Date.now()) return null;
    // Tokens minted before the version field shipped (v absent) read as 0 —
    // the default matches every pre-existing row, so nothing revokes early.
    if (v !== undefined && typeof v !== "number") return null;
    return { uid, iat, exp, v: typeof v === "number" ? v : 0 };
  } catch {
    return null;
  }
}

// ---- rate limiting (in-memory; single instance only — documented) --------------

export const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

/** Sweep expired buckets so rotated/spoofed keys cannot grow the map without
 *  bound (V2 L10 — the historical map only ever overwrote entries). Runs
 *  opportunistically whenever a NEW bucket is created past a size floor. */
export function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/** `now` is injectable so the window boundary is unit-pinnable without
 *  fake timers. */
export function checkRateLimit(
  key: string,
  max: number = MAX_ATTEMPTS,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    // L10: prune before growing — spoofed key rotation can no longer leak.
    if (buckets.size >= 512) pruneExpiredBuckets(now);
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSec: Math.min(retryAfterSec, 900) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

// ---- S15 seams: verification codes + reset tokens -------------------------------

/** Exactly 6 digits, full zero-padded range (crypto random, not string floats). */
export function generateVerificationCode(): string {
  const bytes = randomBytes(4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const value = view.getUint32(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

/** 48 lowercase hex characters (24 random bytes). */
export function generateResetToken(): string {
  return randomBytes(24).toString("hex");
}

/** Tolerate pasted formatting; reject non-digit garbage and wrong lengths. */
export function normalizeVerificationCode(
  input: string | null | undefined,
): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[\s.-]/g, "");
  return /^\d{6}$/.test(cleaned) ? cleaned : null;
}

// ---- misc -----------------------------------------------------------------------

/** Cryptographically fill a buffer (shared helper for one-shot seams). */
export function secureRandomBytes(size: number): Buffer {
  const buf = Buffer.alloc(size);
  randomFillSync(buf);
  return buf;
}

// ---- the login timing equalizer (V2 M7) -------------------------------------------

/**
 * A throwaway scrypt hash of a random secret, computed once at boot. Unknown
 * emails verify against THIS before answering 401, so both credential
 * failures burn the same scrypt cost and the response time no longer
 * enumerates which emails exist.
 */
export const DUMMY_CREDENTIAL_HASH = hashPassword(
  randomBytes(18).toString("base64url"),
);

// ---- the trusted-proxy-hop contract (V2 H3) -----------------------------------------

/**
 * Resolve the limiter key from an x-forwarded-for chain. `hops` is the
 * number of trusted proxies IN FRONT of this process (AUTH_PROXY_HOPS):
 * the selected hop sits that many positions from the RIGHT. 0 (default,
 * directly-exposed node) takes the rightmost entry — the one the nearest
 * proxy appended — never the client-controlled first hop. Unparsable
 * chains and over-declared depths fail closed to the shared "local" key
 * (one bucket, never a fresh bucket per forged header).
 */
export function resolveClientIp(
  forwarded: string | null | undefined,
  hops = Number.parseInt(process.env.AUTH_PROXY_HOPS ?? "0", 10) || 0,
): string {
  if (!forwarded) return "local";
  const parts = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return "local";
  const index = parts.length - 1 - hops;
  if (index < 0) return "local";
  return parts[index];
}
