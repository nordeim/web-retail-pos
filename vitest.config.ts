import { defineConfig } from "vitest/config";
import path from "node:path";
// ---------------------------------------------------------------------------
// VeloxPOS — the unit-test layer (Vitest, node env). Matches
// src/**/*.test.ts + tests/**/*.test.ts ONLY — the e2e specs
// (tests/e2e/*.spec.ts) belong to playwright.config.ts's webServer and never
// leak into this run.
//
// The suite pins the pure domain seams: money (integer cents + IVA), ticket
// numbers, the Spanish date formatters, the SPA router map, the Zod
// validation boundaries, the Prisma schema + the .env contract, the db-path
// resolution (Turbopack's stray-db hardening), the auth primitives (scrypt,
// HMAC sessions, the rate limiter), and the Session-V2 hardening seams
// (docs/remediation-plan-v2.md): resolveClientIp's trusted-proxy-hop
// contract, the bounded readJson, the error-mapper statuses, and the
// source pins that keep the remediated shapes from regressing.
//
// Count-lockstep rule: the live test count lives in CLAUDE.md/README —
// update them in the same commit as any test change.
// ---------------------------------------------------------------------------
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
