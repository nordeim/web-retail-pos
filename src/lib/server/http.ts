// ---------------------------------------------------------------------------
// The HTTP layer seam: error responses, the error→status mapper, the
// authed-handler wrappers, the entity CRUD route factories, and the
// download-header builder. Route files stay 3-line shells over the
// factories (AGENTS.md "API pattern").
//
// Error contract (PAD §6.2): Zod → 400, Prisma P2002 → 409, P2025 → 404,
// unauthed → 401, ConflictError → 409, BusinessRuleError → 422, oversized
// body → 413, non-JSON body → 415, unknown → 500 with the detail logged
// server-side ONLY (the response never carries a stack or provider message).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";

import type { SessionUser } from "./auth";
import { requireUser } from "./auth";

// ---- typed control-flow errors -----------------------------------------------

/** Thrown by the auth seam; mapped to 401 by the wrappers below. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "UnauthorizedError";
  }
}

/** Thrown by the delegates' ownership pre-check; mapped to 404. */
export class NotFoundError extends Error {
  constructor(message = "That record does not exist.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Thrown by parseWith; carries the Zod issues for the 400 message. */
export class ValidationError extends Error {
  issues: ZodError["issues"];
  constructor(message: string, issues: ZodError["issues"] = []) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

/** A valid request that the domain rejects: duplicate open shift (V2 L4).
 *  Mapped to 409 — README's documented contract. */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** A syntactically valid request the business rules reject: insufficient
 *  stock, short cash (V2 M1/L2). Mapped to 422 — README's documented
 *  contract, previously unreachable. */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

/** The request body exceeds the reader cap (V2 M4). Mapped to 413. */
export class PayloadTooLargeError extends Error {
  constructor() {
    super("The request body is too large.");
    this.name = "PayloadTooLargeError";
  }
}

/** The request body is not JSON (V2 M4's login-CSRF gate). Mapped to 415. */
export class UnsupportedMediaTypeError extends Error {
  constructor() {
    super("The request body must be application/json.");
    this.name = "UnsupportedMediaTypeError";
  }
}

/** Format the first Zod issue: `field: message` (the refine copies carry no
 *  path and surface verbatim — the schemas' messages ARE the copy). */
function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
}

// ---- responses -----------------------------------------------------------------

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimitedResponse(
  retryAfterSec: number,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSec)) } },
  );
}

/** Parse a request body through its Zod schema; failure → ValidationError. */
export function parseWith<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error), result.error.issues);
  }
  return result.data;
}

/** Read a JSON body defensively (malformed JSON → the caller's 400 path).
 *  V2 M4: the read is BOUNDED (1MB → 413) and content-type-gated (non-JSON
 *  → 415; absent tolerated for curl-style payload-less POSTs) — the auth
 *  routes run this BEFORE authentication, so the reader is pre-auth attack
 *  surface. The param is the structural Request surface (text + headers);
 *  NextRequest satisfies it. */
const MAX_BODY_CHARS = 1_000_000;

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    throw new UnsupportedMediaTypeError();
  }
  const text = await request.text();
  if (text.length === 0) return {};
  if (text.length > MAX_BODY_CHARS) throw new PayloadTooLargeError();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ValidationError("The request body is not valid JSON.");
  }
}

// ---- the error mapper ------------------------------------------------------------

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return errorResponse(401, err.message);
  }
  if (err instanceof ValidationError) {
    return errorResponse(400, err.message);
  }
  // V2 H1: the delegates call their Zod schemas directly (.parse) — a raw
  // ZodError used to fall through to the 500 branch. The mapper is the one
  // root fix for every factory-backed route.
  if (err instanceof ZodError) {
    return errorResponse(400, formatZodError(err));
  }
  if (err instanceof ConflictError) {
    return errorResponse(409, err.message);
  }
  if (err instanceof BusinessRuleError) {
    return errorResponse(422, err.message);
  }
  if (err instanceof PayloadTooLargeError) {
    return errorResponse(413, err.message);
  }
  if (err instanceof UnsupportedMediaTypeError) {
    return errorResponse(415, err.message);
  }
  if (err instanceof NotFoundError) {
    return errorResponse(404, err.message);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return errorResponse(409, "That record already exists.");
    }
    if (err.code === "P2025") {
      return errorResponse(404, "That record does not exist.");
    }
    if (err.code === "P2003") {
      return errorResponse(400, "That record references something that does not exist.");
    }
  }
  // Unknown → 500; the detail is logged server-side only (never the body).
  console.error("[api] unhandled error:", err);
  return errorResponse(500, "Something went wrong. Please try again.");
}

// ---- the authed-handler wrappers ---------------------------------------------------

type AuthedHandler = (
  user: SessionUser,
  request: NextRequest,
) => Promise<NextResponse | Response>;

/** Wrap a context-less route handler with the requireUser gate + error map. */
export function withUser(handler: AuthedHandler) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await requireUser();
      return await handler(user, request);
    } catch (err: unknown) {
      return toErrorResponse(err);
    }
  };
}

type ItemRouteContext = { params: Promise<{ id: string }> };
type AuthedItemHandler = (
  user: SessionUser,
  request: NextRequest,
  id: string,
) => Promise<NextResponse | Response>;

/** Wrap an item route handler (Next 15+/16: params arrive as a Promise). */
export function withUserParams(handler: AuthedItemHandler) {
  return async (request: NextRequest, context: ItemRouteContext): Promise<Response> => {
    try {
      const { id } = await context.params;
      const user = await requireUser();
      return await handler(user, request, id);
    } catch (err: unknown) {
      return toErrorResponse(err);
    }
  };
}

// ---- the CRUD route factories -------------------------------------------------------

export type EntityDelegate = {
  list: (userId: string) => Promise<unknown[]>;
  create: (userId: string, input: unknown) => Promise<unknown>;
  update: (userId: string, id: string, input: unknown) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
};

/** Collection routes: GET list + POST create. */
export function makeCollectionRoutes(delegate: EntityDelegate) {
  const GET = withUser(async (user) => {
    const rows = await delegate.list(user.id);
    return NextResponse.json(rows);
  });
  const POST = withUser(async (user, request) => {
    const row = await delegate.create(user.id, await readJson(request));
    return NextResponse.json(row, { status: 201 });
  });
  return { GET, POST };
}

/** Item routes: PATCH update + DELETE remove. */
export function makeItemRoutes(delegate: EntityDelegate) {
  const PATCH = withUserParams(async (user, request, id) => {
    const row = await delegate.update(user.id, id, await readJson(request));
    return NextResponse.json(row);
  });
  const DELETE = withUserParams(async (user, _request, id) => {
    await delegate.remove(user.id, id);
    return NextResponse.json({ ok: true });
  });
  return { PATCH, DELETE };
}

// ---- the download-header builder (S13-C3) --------------------------------------------

/**
 * Content-Disposition for downloads: an ASCII-safe quoted fallback
 * (RFC 2183 — quotes/backslashes/non-ASCII neutralized, never terminated
 * early) plus the RFC 5987 extended form `filename*=UTF-8''…` carrying the
 * exact original name percent-encoded. The quoted form NEVER carries raw
 * percent-encoding of a unicode name (the historical bug: browsers saved
 * the literal "%D1%84..." filename).
 */
export function buildContentDisposition(filename: string): string {
  const safe = filename.trim().length > 0 ? filename : "download";
  const fallback = safe
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const extended = encodeURIComponent(safe);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${extended}`;
}

// ---- shared download-header sets -------------------------------------------------------

/** The S13/S14 download contract: attachment + nosniff + private no-store. */
export function downloadHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": buildContentDisposition(filename),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
}
