// ---------------------------------------------------------------------------
// Session V2 hardening pins (docs/remediation-plan-v2.md R1/R2):
//   · resolveClientIp — the trusted-proxy-hop contract (H3)
//   · readJson — bounded bodies + the JSON content-type gate (M4)
//   · the error mapper — ZodError → 400 (H1), ConflictError → 409 (L4),
//     BusinessRuleError → 422 (M1/L2)
//   · the rate limiter prunes expired buckets (L10)
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  BusinessRuleError,
  ConflictError,
  PayloadTooLargeError,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";
import {
  checkRateLimit,
  resetRateLimit,
  resolveClientIp,
} from "@/lib/auth";
import { inAppResetDeliveryEnabled } from "@/lib/reset-delivery";

describe("resolveClientIp (the trusted-proxy-hop contract)", () => {
  it("returns local when x-forwarded-for is absent", () => {
    expect(resolveClientIp(null)).toBe("local");
    expect(resolveClientIp("")).toBe("local");
  });

  it("defaults to the rightmost hop (0 trusted proxies in front)", () => {
    expect(resolveClientIp("203.0.113.7")).toBe("203.0.113.7");
    expect(resolveClientIp("203.0.113.7, 10.0.0.9")).toBe("10.0.0.9");
  });

  it("selects the hop at the declared depth", () => {
    expect(resolveClientIp("203.0.113.7, 10.0.0.9, 10.0.0.2", 1)).toBe("10.0.0.9");
    expect(resolveClientIp("203.0.113.7, 10.0.0.9, 10.0.0.2", 2)).toBe("203.0.113.7");
  });

  it("fails closed when the declared depth exceeds the chain", () => {
    expect(resolveClientIp("203.0.113.7", 3)).toBe("local");
  });

  it("fails closed on unparsable chains", () => {
    expect(resolveClientIp(" , , ")).toBe("local");
  });
});

describe("readJson bounds (M4)", () => {
  const json = (body: string, contentType?: string) =>
    new Request("http://localhost/api/x", {
      method: "POST",
      headers: contentType ? { "content-type": contentType } : {},
      body,
    });

  it("parses a JSON body", async () => {
    expect(await readJson(json('{"a":1}' as string, "application/json"))).toEqual({ a: 1 });
  });

  it("treats an empty body as an empty object (payload-less POSTs)", async () => {
    // A body-less POST (logout-style) arrives with no content type at all.
    const response = await readJson(new Request("http://localhost/api/x", { method: "POST" }));
    expect(response).toEqual({});
  });

  it("rejects bodies over the 1MB cap with 413", async () => {
    const big = "x".repeat(1_000_001);
    const err = await readJson(json(big, "application/json")).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PayloadTooLargeError);
    expect(toErrorResponse(err).status).toBe(413);
  });

  it("rejects non-JSON content types with 415", async () => {
    const err = await readJson(json("<html/>", "text/html")).catch((e: unknown) => e);
    expect(toErrorResponse(err).status).toBe(415);
  });

  it("accepts an absent content type (curl defaults)", async () => {
    // Structural request: no content-type header, a JSON payload.
    const bare = {
      headers: new Headers(),
      text: async () => '{"ok":true}',
    } as unknown as Request;
    expect(await readJson(bare)).toEqual({ ok: true });
  });
});

describe("the error mapper additions", () => {
  it("maps a raw ZodError to 400 (H1 — the delegate .parse path)", () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 5 });
    const response = toErrorResponse(result.success ? null : result.error);
    expect(response.status).toBe(400);
  });

  it("maps ConflictError to 409 (L4)", async () => {
    const response = toErrorResponse(new ConflictError("Esa caja ya tiene un turno abierto."));
    expect(response.status).toBe(409);
  });

  it("maps BusinessRuleError to 422 (M1/L2)", async () => {
    const response = toErrorResponse(new BusinessRuleError("Stock insuficiente."));
    expect(response.status).toBe(422);
  });
});

describe("rate limiter pruning (L10)", () => {
  it("deletes an expired bucket instead of growing the map forever", () => {
    resetRateLimit("prune-a");
    checkRateLimit("prune-a", 10, Date.now() - 16 * 60 * 1000);
    // A later check at the real clock must start a FRESH window (the stale
    // bucket was discarded, not extended).
    const second = checkRateLimit("prune-a", 1);
    expect(second.ok).toBe(true);
  });

  it("still throttles within a live window", () => {
    resetRateLimit("prune-b");
    const now = Date.now();
    checkRateLimit("prune-b", 2, now);
    checkRateLimit("prune-b", 2, now + 1000);
    const third = checkRateLimit("prune-b", 2, now + 2000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("in-app reset delivery (C1 — the pure seam)", () => {
  it("defaults OFF in production (the takeover-closed shape)", () => {
    expect(inAppResetDeliveryEnabled("production", undefined)).toBe(false);
  });

  it("requires the explicit opt-in in production", () => {
    expect(inAppResetDeliveryEnabled("production", "1")).toBe(true);
    expect(inAppResetDeliveryEnabled("production", "0")).toBe(false);
  });

  it("stays on in non-production (the no-SMTP demo posture)", () => {
    expect(inAppResetDeliveryEnabled("development", undefined)).toBe(true);
  });
});
