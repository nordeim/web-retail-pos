# CLAUDE.md — VeloxPOS

Guidance for Claude Code sessions in this repository. Generated per the
`skills/claude-md` skill; verified against the actual configs (commands exist,
versions match lockfiles). Agent-focused gotchas live in `AGENTS.md` — this
file covers the working contract: project shape, conventions, and the
validation loop.

## Project Overview

- **Product**: VeloxPOS — a Spanish-language retail point-of-sale (terminal,
  inventory, sales history, registers, cashiers, reports, store settings),
  self-hosted as a functional superset of `veloxposretail.base44.app`.
- **Stack**: Next.js 16.4 (App Router, standalone output, Turbopack) · React
  19 · TypeScript 5 (strict) · Tailwind CSS **v4** (CSS-first) · Prisma 6 +
  SQLite · Zustand 5 · Zod 4 · Vitest 5 + Playwright 1.5x · Bun 1.3 runtime.
- **Shape**: ONE page (`src/app/page.tsx`) renders all 8 views; the
  PascalCase routes are `rewrites()` in `next.config.ts`. Server state flows
  through `src/app/api/**` route handlers; client state lives in two Zustand
  stores (`src/lib/store.ts`).

## Commands

```bash
bun install            # deps (bun 1.3; scripts assume bun)
bun run dev            # dev server :3000 (tees to dev.log)
bun run lint           # eslint 9 (flat config)
bun run typecheck      # tsc --noEmit — run BEFORE tests
bun run build          # production standalone build (REQUIRED before e2e)
bun run test           # vitest unit layer (181 tests / 16 files)
bun run test:e2e       # playwright e2e layer (67 specs, boots standalone :3100)
bun run db:push        # prisma db push (schema-anchored, see AGENTS.md)
bun run db:seed        # seed the owner + the reference dataset
```

The full gate, in order: `lint → typecheck → build → test → test:e2e`.
Never skip a failing gate; never weaken a pin to pass.

## Project Conventions (verified from the codebase)

### File organization

```
src/app/            ONE page + /login /signup /reset-password + not-found + api/**
src/app/api/        route handlers: thin shells over src/lib/server factories
src/components/
  layout/           sidebar (dark, 220/68px), mobile-chrome (app bar + drawer)
  views/            the 8 view components (terminal, dashboard, inventario,
                    ventas, cajas, cajeros, reportes, ajustes)
  pos/              shared presentational pieces (StatCard, charts, pills)
  ui/               shadcn/radix primitives (do not hand-roll new ones)
  auth/             login + signup surfaces (LIGHT theme)
src/lib/            pure domain seams: money, ticket, date (es-MX), router,
                    validation (Zod), api (fetch seam), db-path, store (zustand)
src/lib/server/     next/headers-dependent layer: auth, http (route factories),
                    entities (delegates)
prisma/             schema.prisma + seed.ts (reference dataset)
tests/              vitest units (*.test.ts) + e2e/ playwright (*.spec.ts)
docs/               investigation dossier, plan, v4 trap report, evidence
```

### Naming & language

- UI copy is **Spanish** (reference parity); code identifiers are English.
- Views are `<name>-view.tsx`; dialogs are local to their view file unless
  shared (`src/components/pos/`).
- Routes are PascalCase as the reference spells them: `/Sales`, `/Registers`,
  `/Cashiers`, `/Reports`, `/StoreSettings` (NOT /Ventas /Cajas /Cajeros /
  /Reportes /Ajustes — those are aliases). Terminal is `/`.

### State management

- Zustand stores only — no React Context, no prop drilling of server data.
- `useAppStore`: active view (synced with `location.pathname` via
  `viewFromPath`), sidebar collapse (persisted), mobile drawer open.
- `usePosStore`: products/categories/registers/cashiers/shifts/sales/settings
  collections + the in-progress ticket + `activeShift` (an OPEN shift gates
  the Terminal). Mutations go through the api seam and settle back into the
  store via `loadCollections`.
- Dialog form state resets by **key-remount**, never by effect writes (the
  `react-hooks/set-state-in-effect` lint rule).

### API patterns

- Collection: `makeCollectionRoutes(delegate)` → GET list + POST create.
  Item: `makeItemRoutes(delegate)` → PATCH + DELETE (ownership-checked 404).
- Money crosses the boundary as decimal strings and is parsed to integer
  cents by `moneyCents` in `src/lib/validation.ts`.
- Ticket numbers are generated SERVER-side (`src/lib/ticket.ts`, `V-` +
  8 base-36); sale prices/IVA always recompute from DB rows, never client
  input; stock decrements inside the sale's transaction.
- Errors: Zod → 400 · P2002/P2002-class + duplicate-open-shift → 409 ·
  P2025 → 404 · no session → 401 · business rules (stock, cash, OTP
  attempts) → 422 · oversized body → 413 · non-JSON body → 415 ·
  unknown → 500 (details logged server-side only).

### Styling (Tailwind v4)

- CSS-first config: `@theme`/`@theme inline` in `src/app/globals.css`; there
  is NO `tailwind.config.js`. Custom utilities are `@utility vx-*`.
- The five trap rules in `AGENTS.md` (§ Tailwind v4 traps) are enforced by
  `tests/tailwind-traps.test.ts` — read them before touching layout CSS.
- Design tokens are reference-measured (canvas `#080a14`, surface `#0d0f1a`,
  border `#1e2235`); the store's two configurable colors ride the
  `--vx-primary` / `--vx-secondary` CSS vars (Ajustes → Personalización).

### Testing

- Unit (vitest, node env): pure seams — money/ticket/date (incl.
  `weekWindow`)/router/validation/schema/db-path/auth (incl.
  `resolveClientIp` + the limiter prune)/api-timeout/api-offline/
  reset-delivery/env-check + source pins (tailwind-traps, hardening,
  schema). `bun run test`.
- E2E (playwright, chromium): boots the standalone build on :3100 against
  `db/e2e.db` (force-reset per run). Auth once via the setup project's
  storageState. `bun run test:e2e` (build first!). The V2 pins:
  `hardening.spec.ts` (400/409/413/415/422 contracts, the OTP attempt
  counter, the reset-revokes-sessions round-trip) and `parity-pins.spec.ts`
  (the measured live-reference heading/chart contracts); the drawer pins
  gained focus-into-panel + focus-return (L11).
- A11y: axe smoke (critical/serious, color-contrast excluded as a disclosed
  parity deviation) in `tests/e2e/a11y-smoke.spec.ts`.

## Framework-specific checklist (Next.js 16)

- Route handler `params` are a Promise — use `withUserParams`.
- `useSearchParams` needs a Suspense boundary — the auth pages avoid it
  (no search-param reads at module scope).
- `output: "standalone"`: the build copies `static/` + `public/` into the
  standalone dir (see the `build` script) — don't bypass the script.
- `allowedDevOrigins` pins `127.0.0.1`/`localhost` (Next 16 dev-origin
  protection) — extend it, don't remove it.
- Client components: `"use client"` at the top; server components never
  import the stores.

## Validation loop (every change)

1. `bun run lint` — zero errors expected.
2. `bun run typecheck` — strict, no `any` (use `unknown` + narrowing).
3. `bun run build` — before claiming anything about prod behavior.
4. `bun run test` — unit layer green.
5. `bun run test:e2e` — for anything touching views, routes, chrome, or APIs.
6. Update the doc chain when behavior/commands change: AGENTS.md, CLAUDE.md,
   README.md, Project_Architecture_Document.md, worklog.md.
