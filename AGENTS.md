# AGENTS.md — VeloxPOS (`web-retail-pos`)

Instructions for AI coding agents working in this repository. Every line
answers "would an agent likely miss this without help?" — if it reads like
generic advice, it does not belong here. Companion docs:
`CLAUDE.md` (workflow), `README.md` (setup), `Project_Architecture_Document.md`
(the full PAD), `docs/reference-investigation.md` + `docs/implementation-plan.md`
(the replication dossier).

## What this app is

A self-hosted, functional-superset clone of the `veloxposretail.base44.app`
POS (Spanish UI). One Next.js page + `rewrites()` renders 8 views at
reference-measured PascalCase paths; Zustand stores are the only mutation
path; Prisma/SQLite owns persistence. The domain is RETAIL — when a file
name says "Caja/Cajero/Shift/Ticket", that is a register/cashier/turn/receipt.

## Commands

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` (port 3000; `dev.log` tees output) |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` (run BEFORE tests — it is the fast gate) |
| Unit tests | `bun run test` (vitest; `*.test.ts` only) |
| E2E | `bun run test:e2e` (builds required FIRST; see below) |
| Build | `bun run build` (standalone output; required before e2e) |
| DB push | `bun run db:push` (schema-anchored) |
| DB seed | `bun run db:seed` |

Order matters: **lint → typecheck → build → `bun run test` → `bun run test:e2e`**.
The e2e webServer boots `.next/standalone/server.js` — a stale build means the
suite tests dead code. Single unit file: `bunx vitest run tests/money.test.ts`.
Single e2e spec: `bunx playwright test tests/e2e/inventory.spec.ts`.

## The database contract (do not improvise)

- `.env` MUST read `DATABASE_URL="file:../db/custom.db"`; the file lands at
  `<repo>/db/custom.db`. Pinned by `tests/schema.test.ts`.
- **Prisma CLI anchors shell-provided relative `file:` URLs against
  `prisma/schema.prisma`** — but Next dev (Turbopack) pre-resolves the SAME
  value against the project dir and injects an absolute path one level OFF
  (`<project>/../db/custom.db`), creating a stray EMPTY db at `<parent>/db/`
  on boot. `src/lib/db-path.ts` hardens against this (v3): when an absolute
  target is `<elsewhere>/db/custom.db` while the repo owning
  `prisma/schema.prisma` has its own `db/custom.db`, the repo wins. Do not
  "simplify" that branch — its unit pins live in `tests/db-path.test.ts`.
- Money is **integer cents everywhere** (`Int` columns; `src/lib/money.ts`).
  Floats at a money boundary are a bug. IVA is per-PRODUCT (`ivaRate`,
  default 16); prices are IVA-exclusive; `lineTotal = round(price × 1+iva/100) × qty`
  (verified reference ticket: $18.50 → $21.46).
- The e2e suite runs against `db/e2e.db`, force-reset + reseeded by
  `tests/e2e/global-setup.ts` every run (the sale specs decrement stock).
- Seed credentials ride `SEED_OWNER_*` env vars; **bun's dotenv expands `$…`
  in .env values** — the seed password default therefore lives IN
  `prisma/seed.ts`, not in `.env` (a `'$Abcd1234'` .env value arrives as `""`).

## Tailwind v4 traps (the repo's raison d'être)

The reference was built on Tailwind v3; this clone compiles on v4. The five
documented traps live in `docs/Tailwind-V4-Validation-Report.md`; the build
rules:

1. **Never** put `mt-*`/`mb-*` utilities on children of `space-y-*`/`space-x-*`
   containers — v4's `:where()` rewrite flips the specificity outcome and the
   gaps change (the reference's own mobile-menu bug). Use `flex flex-col gap-*`.
   Pinned by `tests/tailwind-traps.test.ts` + e2e geometry checks.
2. `@theme inline` values must be FULL colors (`rgb(var(--x))`), never bare
   triplets; raw triplets live in `:root` only.
3. `--shadow-sm` is pinned to the reference geometry in `@theme` — v4 shifted
   the scale one notch; do not remove the pin.
4. Exact-sRGB gradients are explicit `linear-gradient(...)` utilities
   (`vx-gradient`), never `bg-gradient-to-*` (v4 interpolates in oklab).
5. The measured design tokens (`--color-vx-canvas: #080a14`, surface
   `#0d0f1a`, border `#1e2235`) are reference evidence — changing them breaks
   visual parity with `docs/reference-evidence/ref-*.png`.

## The mobile drawer contract

The reference has NO working mobile menu (its 220px sidebar squeezes content
at 390px — verified). The clone's drawer (`src/components/layout/mobile-chrome.tsx`)
is the superset: w-72 panel, 8 links, Esc/backdrop/route-change close, body
scroll lock, `aria-expanded` on the hamburger. Geometry (288px panel, uniform
44px link pitch, zero horizontal overflow) is pinned by
`tests/e2e/mobile-navigation.spec.ts` — touching the drawer means running it.

## React conventions that bite

- **No setState synchronously inside effect bodies** — the
  `react-hooks/set-state-in-effect` rule fails lint. Dialogs reset via
  key-remount (`<Dialog key={entity?.id ?? "new"}>` rendered only when open);
  URL-derived state defers with `setTimeout(…, 0)`.
- Next 15+/16 route handlers receive `params` as a Promise — use the
  `withUserParams` wrapper from `src/lib/server/http.ts`, never raw contexts.
- API routes are 3-line shells over the factories
  (`makeCollectionRoutes`/`makeItemRoutes` + delegates from
  `src/lib/server/entities.ts`). Hand-rolled handler logic (sales, shifts,
  reports) still goes through `withUser` + `parseWith` + `toErrorResponse`
  (Zod → 400, P2002 → 409, P2025 → 404, unauth → 401; V2 added
  `ConflictError` → 409, `BusinessRuleError` → 422 — duplicate open shift,
  insufficient stock, short cash — plus oversized body → 413 and non-JSON
  body → 415 from the bounded `readJson`; raw `ZodError` from the delegates
  maps to 400, never 500).
- The reset contract (V2 C1): `POST /api/auth/forgot-password` carries the
  reset URL in the body ONLY when in-app delivery is enabled —
  `RESET_INAPP_DELIVERY=1` or non-production (`src/lib/reset-delivery.ts`,
  unit-pinned). A default production boot never returns a token; the login
  surface degrades to the generic "sent" copy. A password reset bumps
  `User.tokenVersion` inside its transaction, revoking every pre-reset
  cookie (V2 M6).
- The limiter's client IP resolves through `resolveClientIp`
  (`src/lib/auth.ts`): hop `AUTH_PROXY_HOPS` (default 0) from the RIGHT of
  `x-forwarded-for`, fail-closed. Never read the first hop — it is
  client-controlled (V2 H3).
- `verify-email` is rate-limited per IP and its OTP carries an atomic
  attempt counter (6 misses kill the token, the right code included — V2
  H2). Login burns a dummy scrypt hash for unknown emails (no timing
  oracle, V2 M7).
- Zod schemas are strip-mode; partial PATCHes go through `sentKeysPatch` so
  absent keys are never writes.
- State: `useAppStore` (view/chrome) + `usePosStore` (retail collections +
  ticket). Views subscribe with selectors; no React Context.

## Test-suite rules

- vitest matches `src/**/*.test.ts` + `tests/**/*.test.ts` ONLY — e2e
  (`*.spec.ts`) never leaks into it, and vice versa via playwright.config.
- Auth in e2e: the "setup" project signs in ONCE (storageState). Real login
  attempts are rate-limited 10/IP/15min — do not add per-test logins. The
  suite's server opts into `RESET_INAPP_DELIVERY=1` so the hardening spec
  can complete a real forgot→reset→revoke round-trip.
- `tests/hardening.spec.ts` owns its data (register/cashier/user created and
  DELETED in the spec); `tests/e2e/parity-pins.spec.ts` pins the measured
  live-reference heading/chart contract (V1–V6) with computed-style
  assertions — colors resolve through a canvas pixel read (Chromium
  serializes computed colors as lab/oklab).
- The seeded e2e identity is `owner@veloxpos.local` / `VeloxDemo123!`
  (pinned in `tests/e2e/global-setup.ts` + `tests/e2e/helpers.ts`), NOT the
  developer's local owner from `.env`.
- Never weaken or delete a failing pin to make a gate green — fix the cause.
  The archived study-app tests/scripts live in `scripts/archive-study-sweep/`
  (excluded from tsconfig) and are historical reference only.

## Repo hygiene

- `docs/reference-evidence/` holds the LIVE reference captures (evidence,
  not assets); `docs/screenshots/` holds this app's own screenshots
  (`scripts/capture-screenshots.sh` regenerates the set).
- Git: single-branch (`main`), no merge commits without need; pushes go
  through `docs/ssh_git_wrapper_v3.py` (see
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).
- Do not commit `db/*.db`, `.env`, `dev.log`, `server.log`, or
  `tests/e2e/.auth/` (all gitignored).
