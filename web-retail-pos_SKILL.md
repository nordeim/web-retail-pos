---
name: web-retail-pos
description: >
  Comprehensive engineering skill distilled from the VeloxPOS (web-retail-pos)
  codebase — a production-grade Next.js 16 clone (functional superset,
  measured visual parity) of the veloxposretail.base44.app Spanish retail
  POS. Covers the design-token pins that keep Tailwind v4 visually identical
  to the v3 reference, the schema-anchored SQLite DATABASE_URL contract, the
  one-page SPA + rewrites routing model, the integer-cents money seam, the
  route-factory API layer, the Session-V2 security hardening (reset
  delivery, tokenVersion revocation, trusted-proxy-hop limiter keys,
  bounded body reads), and the two-layer testing strategy. Use this to
  extend, debug, onboard, or replicate the architecture without re-deriving
  the pivot + remediation history.
version: 1.0.0
tags:
  - nextjs16
  - react19
  - tailwindv4
  - prisma
  - sqlite
  - pos
  - visual-parity
  - spa
  - testing
  - security-hardening
---

# VeloxPOS (web-retail-pos) — Engineering SKILL

> **What this is:** the single-source-of-truth reference for working in
> `nordeim/web-retail-pos`. Every fact below is verified against the
> codebase (181 Vitest unit + 67 Playwright e2e green at the 1.0.0 pin —
> lint, tsc, production build, and both suites re-run on the final tree).
> Sections marked with ⚠️ encode non-obvious contracts — violating them has
> historically produced silent visual, data-path, or security bugs.
> Supersedes `omni-study1_SKILL.md` (the StudyFlow predecessor; git history
> preserves it).

---

## §1 Project Identity & Design Philosophy

**One sentence:** VeloxPOS is a self-hosted Spanish retail point-of-sale —
terminal, inventory, receipt history, registers/shifts, cashiers, reports,
store settings — a production-ready clone of `veloxposretail.base44.app`
that is a **functional superset** (every view really works: live selling
with stock decrement, the full shift lifecycle, cashier CRUD — all things
the reference cannot do) at **measured visual parity**.

**Design thesis:** *parity is measured, not guessed.* Computed styles from
the LIVE reference are ground truth (re-verified 2026-10-26); screenshots
and VLM reviews are secondary signals. Every visual fix lands with an e2e
computed-style pin (`tests/e2e/parity-pins.spec.ts`).

**Non-negotiable rules:**
1. The 8 view paths are **rewrites onto one page** — never create per-view
   route folders (`/Dashboard` … `/StoreSettings` all serve
   `src/app/page.tsx`; PascalCase is canonical, lowercase aliases resolve).
2. The measured palette (canvas `#080a14`, surface `#0d0f1a`, border
   `#1e2235`), the pinned `--shadow-sm`, and the radius contract in
   `globals.css` must not be "modernized" — parity e2e specs fail.
3. Money is **integer cents everywhere** (`Int` columns; `src/lib/money.ts`);
   prices are IVA-exclusive per product (default 16%);
   `lineTotal = round(price × (1+iva/100) × qty)` — the SINGLE final round.
   Any float at a money boundary is a bug.
4. Every API payload passes its Zod schema; every Prisma query is scoped
   `where: { userId }`; deletes verify ownership first.
5. Layout uses `flex gap-*` exclusively — margin utilities inside
   `space-y/x-*` containers are banned (Tailwind v4 trap 4).
6. **Superset, not clone-of-quirks:** where the reference is broken or a
   dead end (no mobile menu, no cashier creation → its Terminal can never
   sell), the clone ships the working feature and pins it.

## §2 Canonical Stack & Versions

Next.js 16.4 (App Router, `output: "standalone"`, Turbopack) · React 19 ·
TypeScript 5 strict (no `ignoreBuildErrors`, no `noImplicitAny: false`) ·
Tailwind CSS v4 CSS-first (`@theme`/`@utility`; NO tailwind.config.js) ·
shadcn/Radix primitives in `src/components/ui/` · Prisma 6 + SQLite ·
Zustand 5 (two stores) · Zod 4 · Vitest 5 + Playwright · Bun 1.3 runtime.
Hand-rolled SVG charts (zero chart deps, deterministic, pixel-controlled).

## §3 ⚠️ Configuration & The Database Path Contract

- `.env`: `DATABASE_URL="file:../db/custom.db"` — the file lands at
  `<repo>/db/custom.db`, pinned by `tests/schema.test.ts`.
- ⚠️ **Prisma CLI anchors shell-provided relative `file:` URLs against
  `prisma/schema.prisma`; Next dev (Turbopack) pre-resolves the SAME value
  against the project dir and injects an absolute path one level OFF** —
  creating a stray EMPTY db at `<parent>/db/` on boot.
  `src/lib/db-path.ts` (v3) hardens this: an absolute target shaped like
  the mangled default loses to the repo owning `prisma/schema.prisma`.
  Do not "simplify" that branch — its pins live in `tests/db-path.test.ts`.
- The `db:*` scripts set the env var inline (schema-anchored); never rely
  on repo-root `.env` auto-loading with the raw CLI.
- e2e runs against `db/e2e.db`, force-reset + reseeded by
  `tests/e2e/global-setup.ts` every run.
- ⚠️ bun's dotenv expands `$…` in .env values — the seed password default
  lives IN `prisma/seed.ts`, never in `.env` (a `'$Abcd1234'` value arrives
  as `""`).
- Env surface: `DATABASE_URL`, `AUTH_SECRET` (placeholder/example values
  are FATAL in production — `src/lib/env-check.ts`),
  `NEXT_PUBLIC_SITE_URL`, `RESET_INAPP_DELIVERY` (§6), `AUTH_PROXY_HOPS`
  (§6), `SEED_OWNER_*`.

## §4 Data Layer & Domain Model

Models: `User` (+ tokenVersion, auth tokens) · `StoreSetting` (1:1) ·
`Category` · `Product` · `Register` · `Cashier` · `Shift` · `Sale` ·
`SaleItem` — all user-owned (`onDelete: Cascade`), history refs SetNull.
Hot-path `@@index`es: `Sale(userId, createdAt)`, `SaleItem(saleId)`,
`Shift(userId, registerId, status)`, per-user tables. Money columns are
`Int` cents. Ticket numbers `V-` + 8 base-36, server-generated with P2002
retry.

## §5 ⚠️ The API Layer (route-handler idiom)

- Routes are 3-line shells over `makeCollectionRoutes`/`makeItemRoutes`
  factories + delegates (`src/lib/server/entities.ts`); hand-rolled flows
  (sales, shifts, reports) still go through `withUser`/`withUserParams` +
  `parseWith` + `toErrorResponse`.
- Next 15+/16 `params` are a Promise — always the `withUserParams` wrapper.
- ⚠️ **Error contract** (one mapper, `src/lib/server/http.ts`): Zod → 400
  (the delegates call `.parse` directly — the mapper's `ZodError` branch is
  what keeps that a 400, never 500) · `ConflictError` → 409 (duplicate
  open shift, checked INSIDE the open transaction) · `BusinessRuleError` →
  422 (insufficient stock — guarded `updateMany` decrement INSIDE the sale
  transaction with `stock: { gte: qty }`; short cash on efectivo) ·
  `PayloadTooLargeError` → 413 (1MB cap) · `UnsupportedMediaTypeError` →
  415 (non-JSON bodies; the client seam always sends
  `Content-Type: application/json`) · P2002 → 409 · P2025 → 404 ·
  unauth → 401 · unknown → 500 (detail logged server-side only).
- Partial PATCHes go through `sentKeysPatch` (absent keys never write).
- Sale totals/IVA recompute from DB rows, never client input.

## §6 ⚠️ Auth & Security Hardening (Session V2)

- Passwords: scrypt. Sessions: HMAC token `{uid, iat, exp, v}` in an
  httpOnly sameSite=lax cookie; `getCurrentUser` re-proves the user AND
  compares `v` against `User.tokenVersion` — a password reset bumps the
  version in-transaction, instantly revoking every pre-reset cookie.
- ⚠️ **Reset delivery** (`src/lib/reset-delivery.ts`): the forgot-password
  body carries the one-shot reset URL ONLY when `RESET_INAPP_DELIVERY=1`
  or NODE_ENV ≠ production. A default production boot answers a bare
  `{ok:true}` — the historical always-leak shape was an unauthenticated
  account-takeover path. The login surface degrades gracefully.
- ⚠️ **Rate-limit keys** (`resolveClientIp`): hop `AUTH_PROXY_HOPS`
  (default 0) from the RIGHT of `x-forwarded-for`; fail-closed to the
  shared "local" key. NEVER trust the first hop (client-controlled —
  rotated headers minted fresh buckets). Buckets prune on growth (cap 512
  sweep); successful login resets the user's bucket.
- `verify-email`: IP-limited (10/15min) + atomic per-token attempt counter
  (`updateMany` guard) — 6 misses kill the token, the correct code
  included.
- Login equalizer: unknown emails verify against a boot-time dummy scrypt
  hash (`DUMMY_CREDENTIAL_HASH`) — no timing oracle.
- `readJson`: 1MB cap (413) + content-type gate (415) — the pre-auth
  reader is bounded.

## §7 Design System (Tailwind v4, CSS-First) & ⚠️ The Five Traps

1. **Never** `mt-*`/`mb-*` children inside `space-y-*` containers — use
   `flex flex-col gap-*` (the reference's own mobile-menu bug; pinned by
   `tests/tailwind-traps.test.ts` + the drawer geometry spec).
2. `@theme inline` values must be FULL colors, never bare triplets.
3. `--shadow-sm` pinned to the v3 geometry in `@theme` — do not remove.
4. Exact-sRGB gradients are explicit `linear-gradient` utilities
   (`vx-gradient`), never `bg-gradient-to-*` (v4 interpolates in oklab).
5. Measured tokens are evidence — changing them breaks parity with
   `docs/reference-evidence/`.

⚠️ **Section heading contract (measured live 2026-10-26, pinned in
`parity-pins.spec.ts`):** Dashboard/Ajustes cards use the `card` variant —
h3, title case (NO transform), literal `#334155` (Tailwind v4's oklch
slate-700 resolves 1 bit off), 16px bold. Reportes cards use `kicker` —
h3 DOM title-case + CSS `uppercase`, `rgba(255,255,255,0.6)`, 14px bold,
letter-spacing 0.7px. The H1 is 24px at EVERY viewport (no sm:text-3xl
step). Chart Y labels: dashboard plain integers, reports integer `$`;
dense X axes thin to ≤8 evenly stepped labels (first/last kept). Chromium
serializes computed colors as lab/oklab — e2e color pins resolve through a
canvas `getImageData` pixel read.

## §8 The Mobile Drawer Contract (superset, e2e-pinned)

App bar <1024px; w-72 (288px) full-height panel, 8 links, uniform 44px
pitch, zero horizontal overflow at 390×844; Esc/backdrop/route-change
close; body scroll lock; `aria-expanded` hamburger; focus moves INTO the
panel on open, Tab wraps inside, focus returns to the invoker on close
(WCAG dialog contract). The reference has NO working mobile menu — never
"match" that.

## §9 Testing Strategy (two layers, one law)

1. **Unit (Vitest, node env)** — `src/**/*.test.ts` + `tests/**/*.test.ts`
   ONLY (16 files / 181 tests): money/ticket/date/router/validation/schema/
   db-path/auth (incl. `resolveClientIp`, the limiter prune)/api seams/
   reset-delivery/env-check + source pins (tailwind-traps, hardening,
   source-pins). Injectable `now` on the limiter; structural Requests on
   `readJson`; canvas pixel reads for colors in e2e.
2. **E2E (Playwright)** — production standalone on :3100 vs `db/e2e.db`
   (force-reset per run); ONE setup login (storageState); 67 specs across
   navigation, mobile-navigation (geometry + focus), auth, inventory,
   terminal-sales, registers, cashiers, settings, reports, a11y smoke,
   hardening (the API security contracts + a full
   forgot→reset→revoke round-trip on a DEDICATED user), parity-pins.
   Specs that need state create it and DELETE it (hardening's
   register/cashier/shift cleanup).

**Count-lockstep:** the live counts live in CLAUDE.md/README/PAD — update
them in the same commit as any test change.

## §10 The Quality Gate

```bash
bun run lint → bun run typecheck → bun run build → bun run test → bun run test:e2e
```

Order matters (build before e2e — the webServer boots the standalone
bundle; a stale build tests dead code). Never weaken a guardrail to pass:
no `ignoreBuildErrors`, no loosened types, no skipped pins. Failures are
fixed or disclosed, never suppressed.

## §11 Known-Issues Register (at the 1.0.0 pin)

Disclosed, not silently dropped: product image UPLOAD storage (imageUrl is
a string; the Subir-logo control is UI-wired only), receipt email action
(no SMTP), in-memory limiter (single-instance), the reference's own
low-contrast headings replicated for parity (axe color-contrast excluded,
disclosed), Dockerfile/DEPLOYMENT prose refresh pending.

## Appendix — Distilled Lessons (transferable)

1. **The mapper is the root fix.** One `ZodError` branch in
   `toErrorResponse` replaced per-delegate churn — probe the blast radius
   before touching call sites.
2. **Race-proof writes go IN the transaction.** A pre-transaction stock
   check is documentation, not a guard; `updateMany` with a `gte` filter
   + count check is.
3. **Secrets in responses are takeover paths.** Any flow that returns a
   one-shot credential needs an env-gated delivery contract, not
   "documented demo posture" alone.
4. **Counters that gate success must be read before the comparison.** An
   attempt counter checked only on the failure path lets guess #7 sign in.
5. **Computed colors need a pixel read.** Chromium 132+ serializes
   lab/oklab; canvas `getImageData` is the only stable cross-engine form.
6. **Re-verify the LIVE reference.** Evidence PNGs age; the sweep that
   re-measures before remediating found the heading contract the dossier
   had mislabeled.
