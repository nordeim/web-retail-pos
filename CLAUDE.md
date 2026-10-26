# CLAUDE.md — VeloxPOS

Project instructions for Claude Code working in this repository. Companion to
`AGENTS.md` (quick operational facts) and `Project_Architecture_Document.md`
(the full blueprint). This file covers working conventions and standards.

## Project identity

VeloxPOS is a production-grade, self-hosted Spanish-language retail POS — a
functional superset of `https://veloxposretail.base44.app/` with visual parity.
Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind v4 (CSS-first) ·
shadcn/Radix · Zustand (ONE store) · Zod 4 · Prisma 6/SQLite · Vitest ·
Playwright. Package manager: **bun**.

## Commands

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` (port 3000, logs to `dev.log`) |
| DB create/update | `bun run db:push` |
| DB seed (demo store) | `bun run db:seed` |
| Lint | `bun run lint` |
| Types | `bun run typecheck` |
| Unit tests | `bun run test` |
| Build (standalone) | `bun run build` |
| E2E (boots build on :3100) | `bun run test:e2e` |
| Single test file | `bunx vitest run tests/money.test.ts` |
| Single e2e spec | `bunx playwright test tests/e2e/mobile-navigation.spec.ts` |

The pre-push gate is exactly: `lint && typecheck && test && build && test:e2e`
— all green, in that order. There is no hosted CI.

## Architecture in one screen

```
src/app/page.tsx              ← THE app: auth gate → shell → view switcher
src/app/login|reset-password  ← light-theme auth surfaces (the app is dark-only)
src/app/api/*                 ← route shells over the factories (auth kept from S15)
src/components/layout/        ← Sidebar (desktop ≥lg) + MobileChrome (drawer <lg) + nav-items
src/components/views/         ← the 8 views (terminal, dashboard, inventory, sales,
                                registers, cashiers, reports, settings) + shared.tsx
src/components/ui/            ← shadcn primitives (dialog, select, toast, …)
src/lib/router.ts             ← THE view↔path map (PascalCase rewrites in next.config.ts)
src/lib/money.ts              ← cents ↔ strings, es-MX formatters (single money seam)
src/lib/cart.ts               ← cart lines + totals (IVA math)
src/lib/shifts.ts             ← turno rules (one open per register/cashier, close math)
src/lib/reports.ts            ← KPI/daily/method aggregations (pure, chart-feeding)
src/lib/validation.ts         ← every Zod schema (the one validation boundary)
src/lib/store.ts              ← the ONE Zustand store (view, chrome, user, colors)
src/lib/data.ts               ← collection cache + posApi command surface
src/lib/server/               ← http.ts (envelope/mappers/factories), entities.ts
                                (CRUD delegates), pos.ts (shift/checkout transactions),
                                settings.ts, auth.ts (session cookie seam)
prisma/schema.prisma          ← 9 models; money = integer cents; rates = bp
prisma/seed.ts                ← the reference store data (12 products, 2 cajas, 2 ventas)
tests/*.test.ts               ← Vitest seam pins
tests/e2e/*.spec.ts           ← Playwright journeys vs the production build
```

## Code standards (enforced)

- **TypeScript strict.** `any` forbidden (`unknown` + narrowing). The build is
  the type gate — never add `ignoreBuildErrors` (it is already `true` from the
  scaffold; `bun run typecheck` is the real gate and must stay clean).
- **Server components by default;** `"use client"` only where interactivity
  requires it (all views are client components under the single shell).
- **Zod at every API boundary.** A payload that skips `src/lib/validation.ts`
  is a bug even if it works.
- **Partial PATCH discipline:** route writes go through `sentKeysPatch` (or the
  delegates) so zod `.default()`s never overwrite columns the caller didn't
  send (the AH8 data-loss class — see tests/sent-keys-patch.test.ts).
- **React 19:** no synchronous `setState` in effect bodies (lint rule
  `react-hooks/set-state-in-effect`). Use lazy init, render-time adjustment,
  or `useSyncExternalStore` (see `reset-password/page.tsx` for the pattern).
- **Money:** integer cents + basis points; format only via `src/lib/money.ts`.
- **UI copy:** Spanish (es-MX). Test ids on every spec-touched element.
- Error handling: `try/catch` at the route wrapper + the client `apiSend`
  seam only; toasts for user-facing failures; no silent swallows.

## The domain rules (don't improvise)

1. Selling requires an **open shift** (turno). One open shift per register and
   per cashier — enforced server-side in `src/lib/server/pos.ts`, guarded
   twice (pre-check + inside the transaction).
2. Checkout decrements stock atomically; insufficient stock aborts the WHOLE
   sale (409 with the product name in the message).
3. Totals: `subtotal = Σ price×qty`, `IVA = Σ roundHalfUp(price×qty×rate)`,
   `total = subtotal + IVA`. The reference's own ticket (1× Coca-Cola $18.50 →
   $21.46) is pinned by `tests/cart.test.ts` and `tests/money.test.ts`.
4. Closing a shift: `expected = openingFloat + Σ cash sales`;
   `difference = counted − expected`. Card/transfer money never touches the
   drawer math.
5. Ticket numbers are `V-` + 8 chars from a no-lookalike alphabet
   (`generateTicketNumber`).
6. Deleting categories/products/registers/cashiers must NEVER destroy sale
   history (schema uses SetNull + name snapshots on SaleItem).

## Tailwind v4 rules (the trap list)

No `tailwind.config.js`. Tokens in `src/app/globals.css` `@theme` (literal hex
pins) + `:root` raw triplets. Nav lists use `flex gap-*`, never `space-y-*`
with margin children. Exact gradients via `pos-gradient`/`pos-gradient-success`
utilities (oklab drift otherwise). `backdrop-blur-xs` (v4 naming). Custom
utilities only via `@utility`. Full context:
`docs/Tailwind-V4-Validation-Report.md`.

## Testing rules

- Vitest: pure seams only, no React rendering, no mocks of things the seam
  doesn't own. Name the behavior, not the function.
- Playwright: journeys against the built app; shared storageState from
  `auth.setup.ts`; NEVER log in per-test (rate limiter). Wait for
  `[data-app-hydrated=true]` or stable testids, never fixed sleeps.
- A bug fix ships with the regression test that failed before it (red → green).
- Never weaken or delete a test to make a gate pass — fix the code, or flag
  the debt explicitly in the commit message.

## Git

- `main` only, Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`,
  `chore:`), atomic commits that explain why.
- Pushes use the SSH wrapper (`docs/ssh_git_wrapper_v3.py`) per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. The key is never in the
  tree, never in the shell history, shredded after the push.
- `.env`, `db/`, `dev.log`, `test-results/`, `*.key` stay untracked.
