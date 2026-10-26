# VeloxPOS — Implementation Plan (StudyFlow → VeloxPOS Transformation)

**Date:** 2026-10-26
**Reference:** `https://veloxposretail.base44.app/` (Base44-hosted, Spanish-language retail POS)
**Codebase root:** this repository (`web-retail-pos/`)
**Mode:** Generation (Mode A) with Audit sweep (Mode C) of the inherited scaffold.

---

## 1. Mission

Transform the cloned **StudyFlow** (omni-study clone) codebase into **VeloxPOS** — a
production-ready, self-hosted, functional **superset** of the reference POS with visual
parity, on the same stack: Next.js 16 (App Router, standalone) + React 19 + TypeScript
strict + Tailwind CSS v4 (CSS-first) + shadcn/Radix + ONE Zustand store + Zod + Prisma/SQLite.

Everything the reference shows is rebuilt from measured evidence (computed styles +
screenshots captured 2026-10-26); everything the reference leaves broken or empty
(mobile navigation, cashier CRUD, shift lifecycle) is shipped **working** — the superset.

## 2. Reference evidence (measured 2026-10-26)

### 2.1 Routes (SPA shell, PascalCase paths)

| Nav (Spanish) | Path | Purpose |
|---|---|---|
| Terminal | `/POS` (home) | POS terminal: product grid + TICKET cart + checkout |
| Dashboard | `/Dashboard` | KPIs + charts (7-day sales, category donut, low stock) |
| Inventario | `/Inventory` | Product table, search, category chips, create/edit sheet |
| Ventas | `/Sales` | Sale history table + ticket detail dialog |
| Cajas | `/Registers` | Register cards, Abrir/Cerrar Turno lifecycle |
| Cajeros | `/Cashiers` | Cashier CRUD + recent shifts table |
| Reportes | `/Reports` | Period toggle (7/14/30/90 días), KPIs, daily chart, by-method |
| Ajustes | `/StoreSettings` | Store info, logo, colors, ticket footer, card provider, categories |
| Login | `/login` | Light-theme auth card (OAuth buttons + email/password) |

### 2.2 Measured design tokens (computed styles, not eyeballed)

| Token | Value |
|---|---|
| App background | `#080a14` |
| Card surface | `#0e111f` (rgba(16,18,32,.9) measured) + `0 8px 32px rgba(0,0,0,.5)` |
| Sidebar surface | `#0d0f1a`, border `#1e2235`, width **220px** (collapsed **68px**) |
| Active nav item | bg `rgba(124,58,237,.2)`, text `#c4b5fd` (violet-300), radius 12px, h 42px, p 10px 12px |
| Inactive nav item | text `rgba(255,255,255,.4)`, 14px/500, radius 12px |
| Brand chip | 40px rounded-xl, violet gradient (`#6366f1 → #8b5cf6` per Ajustes) |
| Primary/secondary (Ajustes defaults) | `#6366f1` / `#8b5cf6` |
| Primary action buttons | gradient `#6366f1 → #8b5cf6` (Nuevo Producto, Nueva Caja, Guardar Cambios) |
| Success/charge (COBRAR / Abrir Turno) | gradient `135deg #059669 → #10b981`, white, radius 16px, weight 900 (COBRAR: 20px/900, p 20px 32px) |
| Stat icon chips | emerald `#10b981`, violet `#8b5cf6`, blue `#3b8ʌf6` (`#3b82f6`), amber `#f59e0b` — rounded-xl + same-hue glow |
| Success badge ("Activo"/"Completada") | bg `#dcfce7`, dark-green ink |
| Neutral badge ("Cerrada") | bg `#f1f5f9`, dark ink |
| Product icon box | `#eef2ff` rounded square, indigo box icon |
| Login page | bg `#f6f9fb`, white/95 card r16 shadow-2xl, h1 30px/700 `#0f172a`, OAuth rows h54 r12 border `#e2e8f0`, Sign-in block `#0f172a` |
| Font | system-ui stack (Tailwind default), charts via **Recharts** |
| Date/number locale | es-MX (`lunes 26 de octubre, 2026`, `19/04/26 22:09`, `$0.00`), IVA 16% |

### 2.3 Reference defects the clone supersedes

1. **Mobile navigation is broken on the reference** — at 390×844 the 220px sidebar
   stays fixed-open and covers the content; there is no hamburger, no drawer, no
   backdrop. The clone ships a **working** mobile chrome: `<lg` fixed app bar with
   hamburger → slide-in drawer (w-72, backdrop, Esc close, body-scroll lock,
   auto-close on navigation and on crossing `lg`). This is the Tailwind-v4-safe
   pattern already proven in this repo (`mobile-chrome.tsx` + the
   `tests/e2e/mobile-navigation.spec.ts` family), restyled dark.
2. **Cashier dropdown renders zero options** in the reference's Abrir Turno dialog
   (cashier list empty; the app ships no visible cashier CRUD). The clone ships full
   cashier CRUD, so the shift lifecycle actually works end-to-end.
3. **Reference h1 renders `#1e293b` on `#080a14`** (~1.1:1 — invisible-grade
   contrast). The clone renders titles `slate-500` (≈4.1:1, AA-large) — the
   documented a11y-superset deviation, same precedent as the StudyFlow port.

## 3. Domain model (Prisma/SQLite)

`User` (owner account, existing auth stack) →
`Category` (name) → `Product` (name, barcode unique-per-user, price¢, cost¢, stock,
minStock, taxRate‱, unit, imageUrl, active) ·
`CashRegister` (name, location, active) · `Cashier` (name, email?, phone?, pin?, active) ·
`Shift` (registerId, cashierId, openedAt, closedAt?, openingFloat¢, closingAmount¢?,
status open|closed) · `Sale` (ticketNumber `V-XXXXXXXX` unique, cashierId?, registerId?,
shiftId?, customerName?, paymentMethod cash|card|transfer, subtotal¢, tax¢, total¢,
status completed|refunded) → `SaleItem` (productId?, name, unitPrice¢, qty, taxRate‱,
lineTotal¢) · `StoreSettings` (1:1 user: storeName, logoUrl, address, phone, email,
taxId, currency, primaryColor, secondaryColor, ticketFooter, cardProvider).

**Money contract:** integer **cents** everywhere at rest; `src/lib/money.ts` is the
single formatting/rounding seam (`formatMoney` → `$38.50`, `roundHalfUp`). Totals:
`subtotal = Σ price×qty`; `tax = Σ round(price×qty×rate)`; `total = subtotal + tax`
(pinned by unit tests against the reference's own worked example: 1× Coca-Cola $18.50
@16% → subtotal $18.50, IVA $2.96, total $21.46).

## 4. Architecture (unchanged family contract)

- **Shell:** one `page.tsx` (auth gate → sidebar + mobile chrome → view switcher);
  PascalCase paths rewritten onto `/` in `next.config.ts`; the store syncs
  view ↔ `location.pathname` (popstate included).
- **API envelope:** `{ error }` on failure, JSON row(s) on success; Zod at every
  boundary (`validation.ts`); route files are 3-line shells over
  `makeCollectionRoutes`/`makeItemRoutes` + POS-specific delegates (`server/entities.ts`).
  Checkout (`POST /api/sales`) is a transaction: validate shift open → decrement
  stock (guard: insufficient stock → 409) → create Sale + items → return ticket.
- **One Zustand store** (`store.ts`): view/chrome + identity; the data cache lives in
  `data.ts` per the family's collection-store pattern.
- **Auth:** keep the inherited scrypt + HMAC-cookie stack verbatim (register →
  6-digit code in response → verify; login gated on verified; rate-limited).
- **Dark-only app, light login:** the theme accent system is reduced to the store's
  two configurable colors applied as CSS vars (`--pos-primary`/`--pos-secondary`),
  consumed by the gradient utilities. No light/dark toggle (the reference has none).

## 5. Tailwind v4 compliance (the trap list)

Applied from `docs/Tailwind-V4-Validation-Report.md` + `skills/nextjs16-react19-tailwind4-full-stack`:
literal-hex `@theme` pins (no `var()` chains, no config file); nav lists are
`flex flex-col gap-*` **never** `space-y-*` with margin children (trap 4);
exact-sRGB gradients as inline styles/classes, never oklab-interpolated utility
gradients (trap 5); `backdrop-blur-xs` is the v4 name (trap 9); custom utilities via
`@utility` only; `pt-20` single-property offset after `p-4` (trap 8); radius scale
pinned where asserted. The mobile drawer + e2e pins prove the nav works at 390×844
and 768×1024.

## 6. Build stages

| # | Stage | Contents |
|---|---|---|
| 1 | Env + data layer | `.env` (`DATABASE_URL="file:../db/custom.db"`, `AUTH_SECRET`), `db/` at repo root, POS `schema.prisma`, seed (reference's 12 products, 6 categories, 2 cajas, 2 cajeros-less shifts history, 2 sample sales), `db:push` |
| 2 | Seams | `money.ts`, `cart.ts`, `shifts.ts`, `reports.ts`, `ticket.ts`, POS `validation.ts`, `router.ts` (8 views), `store.ts`, `data.ts` |
| 3 | Design system | `globals.css` dark POS tokens + v4 trap pins; `layout.tsx`; login surface (light) |
| 4 | Chrome | `sidebar.tsx` (220/68px, reference-exact), **working** `mobile-chrome.tsx` drawer |
| 5 | Views | Terminal, Dashboard, Inventory, Sales, Registers, Cashiers, Reports, Settings (+ shared table/dialog/badge primitives) |
| 6 | API | products, categories, registers, cashiers, shifts (+open/close), sales (+checkout), reports/summary, settings, keep auth/* |
| 7 | Tests | Vitest: money/cart/shifts/reports/ticket/validation/db-path (+ kept infra tests). Playwright: auth, navigation, **mobile-navigation**, terminal sale journey, inventory CRUD |
| 8 | Verify | lint → typecheck → test → build → e2e; agent-browser visual sweep desktop+mobile; screenshots → `docs/screenshots/` |
| 9 | Docs | this plan, AGENTS.md, CLAUDE.md, README.md, Project_Architecture_Document.md (per the repo's four doc skills), worklog.md |
| 10 | Ship | conventional commits on `main`; push via `docs/ssh_git_wrapper_v3.py` (key never in-tree), remote-ref verification |

## 7. Acceptance criteria (Definition of Done)

1. Every reference view exists at the same path, same language (es-MX), same dark
   visual system, same data on first seed (12 products, 2 cajas, sample ventas).
2. Terminal completes a real sale against an open shift (search → add → COBRAR →
   payment dialog → ticket), decrementing stock; the sale appears in Ventas,
   Dashboard and Reports aggregates.
3. Cashiers CRUD → open shift on a caja → terminal active → close shift with
   counted amount (difference computed).
4. Mobile (390×844): hamburger opens the drawer; drawer closes on item tap, backdrop
   tap, Esc; body scroll locked while open; no horizontal overflow — pinned by e2e.
5. `lint && typecheck && test && build` green; e2e green; zero secrets in tree.
6. All four root docs + this plan describe the VeloxPOS codebase truthfully.
