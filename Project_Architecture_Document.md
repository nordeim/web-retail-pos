# VeloxPOS (`web-retail-pos`) — Master Project Architecture Document (PAD) v1.1.0

> Generated per the `skills/project-architecture-document-md` canonical
> section order. Evidence labels: **Verified** (executed/observed in this
> workspace), **Reasoned** (inference from code), **Assumed** (stated
> decision). Companion: `docs/reference-investigation.md` (the reference
> dossier), `docs/implementation-plan.md` (the replication plan),
> `docs/remediation-plan-v2.md` (the Session-V2 audit record),
> `AGENTS.md` (agent gotchas), `worklog.md` (session journal).
> v1.1.0 — Session V2: ADR-011/012, the hardened error contract, the
> security-control additions, 181 unit + 67 e2e.

## Table of Contents

1. System Overview & Decisions
2. High-Level System Topology
3. Application Architecture
4. Data Architecture
5. Design System Reference
6. Security Architecture
7. Worker / Background Service Architecture
8. Testing Strategy
9. Build & Deployment
10. Developer Handbook
11. Known Issues & Outstanding Tasks
12. Key Files Reference
13. Glossary

---

## 1. System Overview & Decisions `[MANDATORY]`

**What.** VeloxPOS is a single-tenant retail point-of-sale web app: a selling
terminal, inventory, receipt history, registers with shift lifecycles,
cashiers, revenue reporting, and store settings — Spanish UI, dark canvas,
mobile-first drawer navigation. It is a functional superset of the hosted
reference `veloxposretail.base44.app` rebuilt from observation
(`docs/reference-investigation.md`, evidence-labeled).

**Why this shape.** The operator asked for the reference's UX with owned
infrastructure. The scaffold (this repo, previously the StudyFlow build)
already carried a proven Next.js 16 + React 19 + Tailwind v4 + Prisma/SQLite
pipeline with the v3→v4 trap work test-pinned — keeping it was the
lowest-risk path. **Verified.**

### ADR index (the decisions that bind future work)

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Single Next.js page + `rewrites()` SPA at reference PascalCase paths (`/`, `/Dashboard`, `/Inventario`, `/Sales`, `/Registers`, `/Cashiers`, `/Reports`, `/StoreSettings`) | Accepted — Verified (routes render via e2e) |
| ADR-002 | Prisma + SQLite at `<repo>/db/custom.db` via `DATABASE_URL="file:../db/custom.db"` (schema-anchored + runtime-anchored resolution) | Accepted — Verified (db exists; contract unit-pinned) |
| ADR-003 | Money as integer cents; prices IVA-exclusive; per-product `ivaRate` (default 16) | Accepted — Verified against the reference ticket ($18.50 → $21.46) |
| ADR-004 | Tailwind v4 CSS-first (`@theme`/`@utility`), the five trap rules enforced by source pins | Accepted — Verified (tests/tailwind-traps.test.ts) |
| ADR-005 | Two Zustand stores (`useAppStore`, `usePosStore`) — no React Context | Accepted — Verified (store.ts) |
| ADR-006 | API routes as 3-line shells over delegate factories; hand-rolled flows still `withUser` + `parseWith` + `toErrorResponse` | Accepted — Verified (api/**) |
| ADR-007 | Charts hand-rolled SVG (no chart dependency) | Accepted — Verified (pos/shared.tsx) |
| ADR-008 | Mobile drawer is a superset feature (the reference has none); geometry e2e-pinned at 390×844 | Accepted — Verified (mobile-navigation.spec.ts) |
| ADR-009 | Seed identity via `SEED_OWNER_*` env with an in-code password default (bun dotenv expands `$…`) | Accepted — Verified |
| ADR-010 | db-path v3 hardening: the repo owning `prisma/schema.prisma` wins over Turbopack's mangled sibling-db absolute form | Accepted — Verified (db-path.test.ts pins) |
| ADR-011 | Reset delivery: the forgot-password response carries the token only when in-app delivery is enabled (`RESET_INAPP_DELIVERY=1` / non-production); default production never leaks it | Accepted — Verified (reset-delivery pins + hardening.spec) |
| ADR-012 | Session revocation: `User.tokenVersion` rides the HMAC payload and is compared on every authed read; password reset bumps it in-transaction | Accepted — Verified (hardening.spec revocation round-trip) |

---

## 2. High-Level System Topology `[MANDATORY]`

```mermaid
flowchart TB
  B["Browser (SPA: one page, 8 views)"]
  subgraph NextServer["Next.js 16 standalone server"]
    MW["Route rewrites + middleware-less auth gate"]
    subgraph API["Route handlers /api/**"]
      AUTH["/api/auth/*"]
      CRUD["products · categories · registers · cashiers"]
      FLOW["shifts · sales · settings · dashboard · reports"]
    end
    SEAM["src/lib/server: http factories + entity delegates + auth"]
  end
  DB[("SQLite · <repo>/db/custom.db")]
  B -->|JSON over fetch (cookie session)| API
  API --> SEAM --> DB
```

- Single process; no external services; SQLite file storage. **Verified.**
- The SPA authenticates through an httpOnly cookie; a 401 from
  `/api/auth/me` bounces the shell to `/login` via full reload. **Verified.**

---

## 3. Application Architecture `[MANDATORY]`

### 3.1 The view layer

- **One page** (`src/app/page.tsx`): auth gate → splash → shell (Sidebar +
  MobileChrome + view switcher). The view syncs with `location.pathname`
  through `viewFromPath` (`src/lib/router.ts`) — the rewrite map keeps URLs
  canonical while the SPA never reloads on nav. **Verified** (e2e
  navigation.spec asserts pushState URLs).
- **Views** (`src/components/views/*-view.tsx`): terminal (grid + ticket +
  payment dialog), dashboard (KPIs + charts + low stock), inventario (table +
  product dialog), ventas (history + ticket detail), cajas (register cards +
  shift dialogs), cajeros (cashier CRUD + shift history), reportes (period
  windows + KPIs + SVG area chart + method breakdown), ajustes (settings
  form, live theming, category chips).
- **Chrome**: desktop sidebar — dark, fixed, 220px expanded / 68px collapsed,
  bottom-parked toggle; mobile (<1024px) — app bar (hamburger + brand) and
  the w-72 drawer (Esc/backdrop/route-change close, body scroll lock). The
  drawer nav and sidebar share ONE `NavItemLink` source. **Verified** (e2e
  pins the widths, the 288px panel, and the uniform 44px link pitch — the
  Tailwind v4 space-y trap stays dead).

### 3.2 State

- `useAppStore` — view, sidebar collapse (localStorage-persisted), drawer.
- `usePosStore` — the retail collections + settings, the in-progress ticket
  (`ticketAdd/SetQty/Remove/Clear`), `activeShift` (derived from shifts), and
  `loadCollections(keys)` (parallel `Promise.allSettled` fetchers; failures
  never block the shell). **Verified.**
- Dialog form state initializes per mount (key-remount) — the
  `react-hooks/set-state-in-effect` lint rule forbids effect-driven writes.
  **Verified** (lint green).

### 3.3 The API layer

- **Factories** (`src/lib/server/http.ts`): `withUser`/`withUserParams`
  (session gate + error mapper), `parseWith` (Zod → 400), 
  `makeCollectionRoutes`/`makeItemRoutes` (GET/POST + PATCH/DELETE).
- **Delegates** (`src/lib/server/entities.ts`): every query scoped
  `where:{userId}`; updates/removes verify ownership BEFORE mutating;
  `sentKeysPatch` filters partial PATCHes to schema-validated sent keys.
- **Hand-rolled flows**: shifts (open: 409 on duplicate open register,
  flips register status in a transaction; close: stamps count, closes the
  register), sales (open-shift gate, DB-side price/IVA recompute, stock
  decrement in the same transaction, server-generated ticket `V-XXXXXXXX`
  with P2002 retry), settings (upsert singleton), dashboard/reports
  (aggregations over local-day buckets).
- **Error contract**: Zod (incl. the delegates' raw `.parse`) → 400 ·
  P2002 → 409 · P2025 → 404 · no session → 401 · duplicate open shift →
  409 (`ConflictError`, checked INSIDE the open transaction) · business
  rules → 422 (`BusinessRuleError`: insufficient stock — guarded
  decrement inside the sale transaction — short cash, burnt OTP) ·
  oversized body → 413 · non-JSON body → 415 · unknown → 500 (server log
  only). **Verified** (unit + hardening.spec).

---

## 4. Data Architecture `[MANDATORY]`

### 4.1 Model map (Prisma/SQLite)

```
User 1─1 StoreSetting          Store identity (name, colors, ticket footer…)
User 1─* Category              unique(userId, name)
User 1─* Product               unique(userId, name); optional category (SetNull)
User 1─* Register (Caja)       status closed|open
User 1─* Cashier               optional email, active flag
User 1─* Shift (Turno)         register + cashier; openingFloat; closedAt?
User 1─* Sale                  ticketNo unique; method efectivo|tarjeta;
                               subtotal/tax/total cents; register/shift (SetNull)
Sale 1─* SaleItem              product (SetNull); name/price/iva snapshots
User 1─* VerificationToken, PasswordResetToken   (auth, unchanged from scaffold)
```

All money columns are integer **cents**; every user-owned model cascades on
user delete; sale history survives product/register deletion via SetNull.
**Verified** (tests/schema.test.ts pins the model list, cascades, cents).

### 4.2 The db-path contract

`.env` `DATABASE_URL="file:../db/custom.db"`. The Prisma CLI anchors
shell-provided relative URLs against `prisma/schema.prisma` →
`<repo>/db/custom.db`. The runtime resolves the same value in
`src/lib/db-path.ts` (anchor order: standalone-root → module-root → CWD).
**v3 hardening**: Next dev (Turbopack) pre-resolves the relative URL one
level off (`<project>/../db/custom.db`) and *creates that stray file on
boot* — when an absolute target is the default's name inside a `/db`
directory outside the repo while the repo owns its own `db/custom.db`, the
repo wins. Pinned by three `tests/db-path.test.ts` cases. **Verified.**

### 4.3 Seeding

`prisma/seed.ts` upserts: the owner (`SEED_OWNER_*`, password hashed with the
app's own scrypt seam), 6 categories (reference order), the 12 reference
products (11 read live + the count-pinned 12th — dossier §8), 2 registers,
1 cashier, and the 2 verified historical sales inside their closed shifts
(`V-MO6BJT7G` $21.46, `V-MMPNY55Z` $61.48). Idempotent: sales/shifts only
when the store has none. **Verified.**

---

## 5. Design System Reference `[CONDITIONAL]`

| Token | Value | Source |
|---|---|---|
| Canvas | `#080a14` | computed `body` on the live reference — Verified |
| Surface / raised | `#0d0f1a` / `#12141f` | sidebar computed style — Verified |
| Border / strong border | `#1e2235` / `#262a36` | sidebar computed style — Verified |
| Primary / secondary | `#6366f1` / `#8b5cf6` | the reference's own settings inputs — Verified |
| Gradient | `linear-gradient(to right, var(--vx-secondary), var(--vx-primary-deep))` | explicit sRGB (v4 oklab trap) |
| Success / warning / info | emerald-500 / amber-orange / blue-500 | stat chips + pills — Verified visually |
| Headings | slate-800/900 on dark (24–30px bold) | computed h1 styles — Verified |
| Radius / font | 12px controls, 16px cards / system ui-sans | computed — Verified |

Typography: system stack (`ui-sans-serif, system-ui, …`); tables use
uppercase bold 11–12px headers. The auth surface is intentionally LIGHT
(self-contained `vx-auth-page` utility). The Ajustes color pickers write
`--vx-primary` / `--vx-secondary` at runtime — settings-driven theming is
live. **Verified** (settings.spec e2e).

---

## 6. Security Architecture `[MANDATORY]`

| Control | Implementation | Evidence |
|---|---|---|
| Password storage | scrypt (64-byte key, 16-byte salt), `scrypt$salt$key` format | src/lib/auth.ts — Verified |
| Sessions | HMAC-signed stateless token, httpOnly cookie `sf_session`, 7-day TTL; verification re-proves the user exists | Verified (auth.test.ts) |
| Rate limiting | In-memory per-IP buckets on login/register/forgot/verify (10/15min), expired buckets pruned, successful login RESETS the user's bucket; the IP resolves through the trusted-proxy-hop contract (`AUTH_PROXY_HOPS`, fail-closed — never the client-controlled first hop) | Verified (auth.test.ts + hardening.test.ts) |
| Reset delivery | The 200 body carries the reset URL only when `RESET_INAPP_DELIVERY=1` or non-production; a default production boot returns an empty `{ok:true}` (the historical token-in-body was an unauthenticated takeover path) | Verified (reset-delivery pins) |
| Session revocation | `User.tokenVersion` rides the HMAC payload; compared on every authed read; reset bumps it in the same transaction as the password write | Verified (hardening.spec) |
| OTP hardening | verify-email is IP-rate-limited and its token carries an atomic attempt counter (6 misses kill it, correct code included) | Verified (hardening.spec) |
| Timing equalization | Unknown-email logins verify against a boot-time dummy scrypt hash — both credential failures burn the same cost | Verified (source pin) |
| Body bounds | `readJson` caps bodies at 1MB (413) and gates non-JSON content types (415) — the pre-auth reader is bounded | Verified (unit + hardening.spec) |
| Boot guard | Production fatals on missing/blank/public-dev `AUTH_SECRET` (exit 1, not a degraded server) | Verified (env-check.test.ts) |
| Ownership | Every retail query scoped `where:{userId}`; deletes verify ownership first | Verified (delegates) |
| Input validation | Zod strip-mode on every write path; unknown keys dropped; partial PATCH filtered by `sentKeysPatch` | Verified |
| Injection | Prisma parameterized queries only; no string-built SQL | Verified (code inspection) |
| Secret hygiene | `.env` gitignored; seed password default documented as demo-only; no credentials in src (the reference account's email/password never appear in committed code — seed reads env) | Verified |
| Money integrity | Prices/IVA recomputed server-side from DB rows; client cannot set totals | Verified (sales route) |
| Shift/stock integrity | Open-shift gate + transactional stock decrement; duplicate-open 409; delete guards on registers/cashiers with open shifts | Verified (e2e) |

Threat notes: the login limiter is in-memory (per-process) — acceptable for
single-tenant self-hosting; multi-instance deploys need a shared store.
Social-login buttons are intentionally honest placeholders (no OAuth apps
configured; they explain instead of dead-ending). **Reasoned/Assumed.**

---

## 7. Worker / Background Service Architecture `[CONDITIONAL]`

None. There are no queues, schedulers, or background workers; everything is
request-scoped. `src/instrumentation.ts` runs the AUTH_SECRET boot check once
per server start (fail-fast in production). The Next.js dev indicator and
`dev.log`/`server.log` tees are the only operational surfaces. **Verified.**

---

## 8. Testing Strategy `[MANDATORY]`

Two layers, two runners, disjoint file globs:

| Layer | Runner | Scope | Count |
|---|---|---|---|
| Unit | vitest (`tests/**/*.test.ts`, `src/**/*.test.ts`, node env) | Pure seams + source pins | 181 tests / 16 files — Verified |
| E2E | playwright (chromium, standalone server on :3100) | Browser contracts | 67 specs — Verified |

- **Unit seams**: money (the verified ticket math), ticket (V-ID shape),
  router (8-view map + aliases), date (es-MX formatters), validation
  (schemas + gates), schema (model/cascade/cents pins + .env contract),
  tailwind-traps (the v4 space-y/theme/shadow rules in source), db-path
  (anchors + the v3 mangled-form hardening), auth (scrypt/HMAC/limiter),
  api-timeout/api-offline (the fetch seam), env-check, site, dev-preflight.
- **E2E**: navigation (8 routes + 404 + collapse widths), mobile-navigation
  (the drawer contract incl. TRAP-4 geometry guard + no-overflow sweep),
  auth (logged-out surface, bad/good credentials), inventory (CRUD + search +
  chips), terminal-sales (no-shift gate → open shift → sell → receipt →
  stock decrement → close; cash-short block), registers (CRUD + guards),
  cashiers (CRUD), settings (round-trip + live chrome rename), reports
  (periods + verified KPIs), a11y smoke (axe minus color-contrast, disclosed).
- **Infrastructure**: e2e boots `.next/standalone/server.js` on an isolated
  port with `db/e2e.db` (force-reset + reseeded per run); one storageState
  login (rate-limiter budget); `AUTH_SECRET` pinned to a 64-hex shape.
- **Gates**: `lint → typecheck → build → test → test:e2e`, all green at
  PAD v1.0.0 (worklog entry). Failure policy: fix the cause; never weaken a
  pin (AGENTS.md).

---

## 9. Build & Deployment `[MANDATORY]`

- **Build**: `bun run build` → Next standalone output; the script then copies
  `.next/static` and `public/` into `.next/standalone/` (self-contained
  server at `.next/standalone/server.js`). `outputFileTracingRoot` pins
  tracing to this repo. **Verified.**
- **Run**: `bun run start` (NODE_ENV=production) or `bun
  .next/standalone/server.js` with `PORT`; `Dockerfile` + `docs/DEPLOYMENT.md`
  carry the container path (inherited from the scaffold — re-verify the
  healthcheck app label before shipping a container).
- **Env for production**: absolute `DATABASE_URL` (or the repo-anchored
  contract if deployed in-place), a real 64-hex `AUTH_SECRET`
  (`openssl rand -hex 32`), `NEXT_PUBLIC_SITE_URL`.
- **DB migration**: `bun run db:push` (SQLite file). The db directory is
  gitignored; the seed rebuilds the reference dataset.
- **Screenshots**: `scripts/capture-screenshots.sh` regenerates
  `docs/screenshots/` against a running server.

---

## 10. Developer Handbook `[MANDATORY]`

- **Setup → daily loop**: see README Quick Start; the gate order is
  `lint → typecheck → build → test → test:e2e`.
- **Add a view**: `src/lib/router.ts` (ViewId/NAV_ITEMS/VIEW_TITLES) →
  rewrite in `next.config.ts` → view component in `src/components/views/` →
  registry in `src/app/page.tsx` → tests: router.test + a navigation.spec
  entry.
- **Add a model**: schema.prisma → `bun run db:push` → Zod schema in
  `src/lib/validation.ts` → delegate in `src/lib/server/entities.ts` (or a
  hand-rolled route via `withUser`) → store keys in `src/lib/store.ts` →
  schema.test pins.
- **Money**: never floats; use `src/lib/money.ts` (+ moneyCents at the
  boundary); new ticket math gets a money.test pin.
- **Styling**: tokens in `globals.css`; respect the five v4 trap rules
  (flex gap, full-color theme vars, pinned shadow, explicit gradients);
  run `bun run test` — tailwind-traps.test.ts guards the source.
- **Docs discipline**: behavior changes update AGENTS.md/CLAUDE.md/README/
  this PAD + `worklog.md` in the same change.

---

## 11. Known Issues & Outstanding Tasks `[MANDATORY]`

| # | Item | Status |
|---|---|---|
| 1 | Reference dead ends designed-from-language (active-shift terminal UI, payment dialog, close-shift dialog are unobservable on the reference) | Disclosed — dossier §8; treated as superset designs, evidence-labeled Assumed |
| 2 | The 12th seeded product is count-pinned only (below the reference's fold) | Disclosed — dossier §8 |
| 3 | In-memory rate limiter (per-process) | Accepted for single-tenant; revisit for multi-instance |
| 4 | Product images: the dialog accepts a file but the clone does not store/serve uploads | Known gap (reference stores an image URL) |
| 5 | Receipt email action (`Mail` icon) is present but not wired (no SMTP) | Known gap |
| 6 | Dockerfile/DEPLOYMENT.md inherited from the scaffold reference the old app name in prose | Pending doc refresh (prose only) |
| 7 | ~~`ignoreBuildErrors: true`~~ removed in Session V2 (L1); `next build` type-checks | Resolved — build green |
| 8 | a11y: the reference's own low-contrast headings are replicated for parity (axe color-contrast excluded, disclosed) | Disclosed deviation |

---

## 12. Key Files Reference `[MANDATORY]`

| File | Role |
|---|---|
| `src/app/page.tsx` | The shell: auth gate, pre-warm, view registry, live theming |
| `src/lib/router.ts` | The single view↔path map (+ aliases, titles) |
| `src/lib/store.ts` | Both Zustand stores; ticket math; activeShift pick |
| `src/lib/money.ts` | Cents/IVA/change — the verified money seam |
| `src/lib/ticket.ts` | `V-XXXXXXXX` ticket ids |
| `src/lib/validation.ts` | Every API payload schema |
| `src/lib/api.ts` | The client fetch seam (offline/timeout classes) |
| `src/lib/db-path.ts` | The DATABASE_URL resolution contract (v3-hardened) |
| `src/lib/server/http.ts` | Route factories + error mapper |
| `src/lib/server/entities.ts` | Owned delegates + sentKeysPatch |
| `src/app/api/sales/route.ts` | The sale transaction (gate, recompute, decrement) |
| `src/components/layout/sidebar.tsx` · `mobile-chrome.tsx` | The chrome + drawer |
| `src/components/views/terminal-view.tsx` | Grid + ticket + payment dialog |
| `src/app/globals.css` | The v4 design system + trap pins |
| `prisma/schema.prisma` · `prisma/seed.ts` | Data model + reference dataset |
| `tests/e2e/mobile-navigation.spec.ts` | The drawer contract + TRAP-4 guard |
| `docs/reference-investigation.md` | The evidence dossier |
| `scripts/capture-screenshots.sh` | The screenshot evidence generator |

---

## 13. Glossary `[CONDITIONAL]`

| Term | Meaning |
|---|---|
| Caja | Register — a physical checkout drawer |
| Cajero | Cashier — the person operating a shift |
| Turno | Shift — an open/close session on a register with a float and a count |
| Ticket | A sale's receipt (id `V-XXXXXXXX`) |
| IVA | VAT (default 16% in the reference's MXN context), per-product, price-exclusive |
| Fondo de caja inicial | Opening float |
| COBRAR | Charge/check-out action on the terminal |
| AGREGADO | The ticket panel's "added" kicker label (reference copy) |
