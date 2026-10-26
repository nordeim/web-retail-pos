# AGENTS.md — VeloxPOS

Agent instructions for this repository. Every line is something an agent would
likely get wrong without it. Verified against the codebase 2026-10-26.

## What this repo is

**VeloxPOS** — a self-hosted Spanish-language retail POS (Terminal, Dashboard,
Inventario, Ventas, Cajas, Cajeros, Reportes, Ajustes), a functional superset of
the Base44-hosted reference `https://veloxposretail.base44.app/` on:

Next.js 16 (App Router, `output: "standalone"`) · React 19 · TypeScript strict ·
Tailwind CSS v4 (CSS-first, **no** `tailwind.config.js`) · shadcn/Radix ·
ONE Zustand store · Zod 4 · Prisma 6 + SQLite · Vitest 5 · Playwright.

## Commands (bun — do not use npm/node mixed)

```bash
bun install                 # deps (bun.lock is the lockfile; package-lock.json is vestigial)
bun run db:push             # prisma db push → <repo>/db/custom.db (DATABASE_URL pinned INLINE in the script)
bun run db:seed             # seed the reference store data (12 products, 2 cajas, 2 ventas)
bun run dev                 # next dev on :3000 (pipes to dev.log)
bun run lint                # eslint — must be clean
bun run typecheck           # tsc --noEmit — must be clean
bun run test                # vitest (matches src/**/*.test.ts + tests/**/*.test.ts ONLY)
bun run build               # next build → .next/standalone (also copies static + public)
bun run test:e2e            # playwright: boots the standalone build on :3100 with db/e2e.db
bun run start               # serves the standalone build (expects a built tree)
```

**Gate order before any push:** `lint → typecheck → test → build → test:e2e`.
All five green or the push does not happen (no hosted CI — the local gate is
the only gate).

## Non-obvious architecture facts

1. **One page, SPA-rewritten.** The whole authed app is `src/app/page.tsx`
   (auth gate → `Sidebar` + `MobileChrome` → view switcher). The reference's
   routes (`/POS`, `/Dashboard`, `/Inventory`, `/Sales`, `/Registers`,
   `/Cashiers`, `/Reports`, `/StoreSettings`) are **rewrites onto `/`** in
   `next.config.ts`. `src/lib/router.ts` is the single view↔path map —
   unit-pinned by `tests/router.test.ts`. Adding a view = router entry +
   rewrite + view component + NAV_ICONS entry, all four or the type gate
   complains.
2. **The reference's mobile navigation is broken** (its sidebar stays open at
   390px covering content). The clone's fix is `src/components/layout/
   mobile-chrome.tsx` (hamburger app bar `< lg` + slide-in drawer, body lock,
   Esc/backdrop/lg-crossing close) and it is PINNED by
   `tests/e2e/mobile-navigation.spec.ts`. Do not regress it; do not replace
   the drawer with an always-visible sidebar below `lg`.
3. **Money is integer cents** (`priceCents`, `totalCents`, …). Tax rates are
   integer basis points of a percent (16% IVA → `1600`). All formatting /
   rounding lives ONLY in `src/lib/money.ts` (`formatMoney`, `roundHalfUp`,
   `lineTaxCents`). Never `Float` money, never format in a component.
4. **Pure seams.** Cart math → `src/lib/cart.ts`; shift rules →
   `src/lib/shifts.ts`; report/KPI aggregation → `src/lib/reports.ts`. Views
   render these results; they never compute domain numbers inline. Unit tests
   pin the seams (the reference's own worked ticket — 1× Coca-Cola $18.50 →
   subtotal $18.50 + IVA $2.96 = $21.46 — is a test fixture).
5. **Checkout is a transaction** in `src/lib/server/pos.ts`: open-shift gate →
   guarded stock decrement (`updateMany … stock >= qty`, count 0 ⇒ abort) →
   Sale + SaleItems with a generated `V-XXXXXXXX` ticket. Never split it into
   CRUD routes.
6. **API pattern.** Route files are 3-line shells over
   `makeCollectionRoutes`/`makeItemRoutes` + delegates in
   `src/lib/server/entities.ts`. Errors flow through `toErrorResponse`
   (Zod→400, P2002→409, P2025→404, unauth→401). Every payload is Zod-parsed
   from `src/lib/validation.ts` — nothing reaches Prisma unparsed.
7. **Data cache.** `src/lib/data.ts` is a globalThis-singleton collection
   cache (`useCollection(path)` + `posApi` commands that refetch). There is no
   React Query and no second store.
8. **Dark-only app, light login.** `globals.css` pins one dark theme; the
   login/reset surfaces paint their own light card (and set the body bg while
   mounted). The store's two configurable colors are runtime CSS triplets
   `--pos-primary` / `--pos-gradient-to` (Ajustes → Personalización) —
   consumed by the `pos-gradient` utility.

## Tailwind v4 traps (this repo's #1 bug source)

Documented exhaustively in `docs/Tailwind-V4-Validation-Report.md`; enforced
by `src/app/globals.css`:

- **No `tailwind.config.js`** — reintroducing it is the classic "flat look"
  bug. Tokens live in `@theme` (literal hex pins) + `:root` triplets.
- **No `var()`-chain colors in `@theme`** except through the
  `hsl(var(--x))` / `rgb(var(--pos-*))` routing shown there (raw triplets in
  `:root`).
- **Nav lists are `flex flex-col gap-*`** — never `space-y-*` with `mt-*`/`mb-*`
  children (v4's `:where()` rewrite flips which margin wins).
- **Exact-sRGB gradients are the `pos-gradient` / `pos-gradient-success`
  utilities or inline styles** — v4 utility gradients interpolate in oklab and
  drift from the measured stops.
- `backdrop-blur-xs` is the v4 name for v3's `backdrop-blur-sm`.
- Custom utilities go in `@utility` blocks, never `@layer utilities`.

## Database & env

- `.env` (git-ignored): `DATABASE_URL="file:../db/custom.db"` — resolves to
  `<repo>/db/custom.db` for BOTH the Prisma CLI (schema-anchored) and the
  runtime (`src/lib/db-path.ts`). The `db:*` npm scripts pin the var INLINE;
  don't rely on `.env` auto-loading for CLI calls.
- `AUTH_SECRET` is REQUIRED in production — `src/instrumentation.ts` exits the
  process at boot if missing/weak. Dev falls back with a warning.
- The e2e suite uses its own `db/e2e.db` (pushed + seeded by
  `tests/e2e/global-setup.ts`); it never touches `db/custom.db`.
- `db/` is git-ignored. A fresh checkout runs `bun run db:push && bun run db:seed`.

## Testing conventions

- Vitest covers pure seams only (`*.test.ts`); the e2e specs (`*.spec.ts`) are
  invisible to it. Playwright boots the PRODUCTION build — `bun run build`
  first or the suite fails to find the server.
- E2E auth: `tests/e2e/auth.setup.ts` signs in ONCE and saves
  `tests/e2e/.auth/user.json`; specs start from that storageState (the auth
  routes are rate-limited 10/IP/15min — per-test logins WILL trip it).
- Seed account: `demo@veloxpos.mx` / `Demo1234`. Never invent other accounts
  in specs; the limiter is shared.
- The mobile spec asserts `scrollWidth ≤ clientWidth` at 390×844 on ALL 8
  routes — a new view with a wide table must wrap it in `overflow-x-auto`.

## Conventions

- UI language: Spanish (es-MX). Dates/numbers via `src/lib/money.ts`
  formatters (Intl es-MX), never `toLocaleString()` inline.
- `data-testid` every interactive element a spec touches; register/shift
  controls use the name-slugged form (`open-shift-card-caja-1`).
- Commits: Conventional Commits on `main` only — no feature branches.
- Never commit: `.env`, keys (`*.key`, `ssh-key.txt` are git-ignored),
  `db/*.db`, `test-results/`, `dev.log`. The SSH deploy key for pushes lives
  OUTSIDE the repo — see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`
  for the wrapper procedure (`docs/ssh_git_wrapper_v3.py`).
- React 19: no `setState` directly inside effect bodies (lint enforces
  `react-hooks/set-state-in-effect`) — use lazy state init, render-time
  adjustment, or `useSyncExternalStore`.
