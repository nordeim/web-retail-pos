# VeloxPOS — Remediation Plan v2 (Session V2, 2026-10-26)

> Scope: post-pivot audit remediation + live-reference parity re-verification
> for `nordeim/web-retail-pos` (the VeloxPOS clone). Baseline at plan time:
> `main @ a8e6430`, gates green (lint · tsc · unit 147/147 · build · e2e
> 49/49). Companion docs: `docs/reference-investigation.md` (dossier),
> `docs/implementation-plan.md` (the replication plan), `AGENTS.md`
> (contracts). The pre-pivot study-app record remains at
> `docs/remediation-plan.md` (historical, untouched).
>
> Method: Mode C audit of the pivot commits (`8534fee..0519e30`) per
> `skills/web-application/SKILL.md` (§5–§7, §14–§16, Appendix A) +
> `skills/code-review*`; then a live agent-browser sweep of BOTH the clone
> (dev server) and the reference (`veloxposretail.base44.app`, operator
> account) re-measuring the visual contract. Every fix lands TDD: the pin
> (unit or e2e) is written red first, then the fix, then the full gate.
> Evidence labels: **Verified** (executed/observed here), **Reasoned**
> (inference), **Assumed** (decision).

## 0. Verification ledger (what this plan is based on)

| Check | Method | Result |
|---|---|---|
| Baseline gates | executed lint/tsc/vitest/build/playwright | all green (147 + 49) |
| Ownership scoping | read every route + grep all Prisma reads | 0 unscoped retail queries |
| Money integrity | schema + routes + `tests/money.test.ts` | integer cents end-to-end |
| XSS/injection | grep vectors | 0 hits (only parameterized `SELECT 1`) |
| Factory invalid-input status | live repro (temp script) | **500 instead of 400 (H1)** |
| Dashboard weekday labels | `/api/dashboard` live response | **positional labels wrong 6/7 days (M2)** |
| Reference heading contract | agent-browser computed styles, live site 2026-10-26 | dashboard/ajustes h3 title-case slate-700 16px; reports h2 uppercase white/60 14px ls 0.7px (V1) |
| Reference H1 | live computed style at 390 + 1280 | 24px fixed (clone renders 30px at ≥sm — V2) |
| Reference mobile nav | live site at 390×844 | **still no drawer** (aside 220px, squeezed) — clone drawer remains the superset |
| Clone drawer | dev server at 390×844 | works: 8 links, backdrop, close, zero overflow (scrollWidth 390) |
| Stale study identity | grep + read manifests | package.json name/description, vitest header, next.config comment, dead `src/lib/server/ai.ts`, dead deps (M8) |

## 1. Findings (audit 1C/3H/8M/11L + sweep 6V)

Severity at plan time; every finding below is **Verified** unless labeled.

### Security
- **C1** `src/app/api/auth/forgot-password/route.ts` — the 200 body returns
  `resetPath`/`resetUrl` carrying the one-shot reset token → unauthenticated
  account takeover for any known email (rate limiter the only brake).
- **H1** `src/lib/server/entities.ts` — delegates call `.parse` directly;
  `ZodError` falls through `toErrorResponse` to the 500 branch → all
  factory-backed CRUD routes answer 500 (not the contracted 400) on invalid
  payloads. Verified by live repro.
- **H2** `src/app/api/auth/verify-email/route.ts` — no rate limit and no
  attempt counter on the 6-digit OTP (10⁶ space, sets a session on success).
- **H3** `src/lib/server/auth.ts:127` — `clientIp` trusts the raw first
  `x-forwarded-for` hop → every auth rate limiter is bypassable by header
  rotation.
- **M4** `src/lib/server/http.ts` `readJson` — unbounded `request.text()`, no
  content-type gate (pre-auth DoS surface).
- **M6** schema/auth — no `tokenVersion`: a reset does not revoke pre-reset
  session cookies (7-day validity).
- **M7** `login/route.ts:47` — unknown-email short-circuit skips scrypt →
  timing enumeration oracle.
- **L10** `src/lib/auth.ts:89` — rate-limit buckets never pruned (unbounded
  map growth, compounded by H3).

### Correctness / data integrity
- **M1** `sales/route.ts` — stock sufficiency checked outside the
  transaction; decrement is unguarded inside it → concurrent checkouts can
  oversell into negative stock.
- **M2** `dashboard/route.ts:54` — weekly labels are positional
  (`WEEKDAY_MIN[index]` on a rolling window) → wrong 6 days out of 7;
  `isoWeekday()` is dead code. The LIVE reference labels roll per-date
  (verified: window ending today ends "lun").
- **M3** `terminal-view.tsx:234` — line cells compute
  `round(price×(1+iva))×qty` while `money.ts`/the sale route compute
  `round(price×(1+iva)×qty)` → 1¢ divergence between the on-screen line and
  the stored/persisted total (e.g. $12.34×2 → shows $28.62, stores $28.63).
- **L2** `validation.ts:182` — vacuous `.refine(… || true)`; `cashReceived`
  accepted then never checked server-side (efectivo sales rely on the client
  gate only).
- **L4** `shifts/route.ts:69` — duplicate-open check outside the
  transaction, no DB-level guard → concurrent opens both succeed; header
  comment says 409 but `ValidationError` maps to 400.
- **M5** `sales/route.ts:36` + `shifts/route.ts:25` — unbounded list reads;
  shifts loads every sale row per shift and sums in JS (O(sales)).
- **L8** `prisma/schema.prisma` — zero `@@index` declarations on hot paths
  (`Sale(userId, createdAt)`, `SaleItem.saleId`, `Shift(registerId,status)`,
  per-user tables).

### Visual parity vs the LIVE reference (measured 2026-10-26)
- **V1** SectionCard headings — clone: `h3 uppercase violet-400 text-sm`
  everywhere. Reference: **dashboard/ajustes** h3 title-case, no transform,
  `rgb(51,65,85)` (slate-700), 16px/700; **reports** h2 uppercase (CSS
  transform), `rgba(255,255,255,0.6)`, 14px/700, letter-spacing 0.7px.
- **V2** PageHeading — clone `text-2xl sm:text-3xl` (30px at ≥sm);
  reference H1 is **24px fixed** at 390 and 1280. Colors already match
  (slate-800 / slate-500) — audit L7 is resolved as a false positive.
- **V3** Reports daily chart — clone renders ALL ~30 X labels (overlapping
  smear; reference shows ~8 evenly spaced) and decimal money Y labels
  (`$107.3`; reference `$0`-style integers).
- **V4** Dashboard weekly chart — same decimal Y labels; weekday labels
  positional (M2). Reference shows short weekday labels rolling with dates.
- **V5** Ajustes Logotipo — clone renders a raw browser file input;
  reference has a styled "Subir logo" button (upload icon + label).
- **V6** Dashboard low-stock row — reference: amber box-icon chip left,
  bold name, amber "3 en stock (mín. 5)" below; clone: no icon, name left +
  stock text right-aligned.

### Maintainability / hygiene
- **M8** Stale study-app identity: `package.json` name/description; dead
  deps `quill`, `web-vitals`, `z-ai-web-dev-sdk`; dead `src/lib/server/ai.ts`;
  `vitest.config.ts` header still narrates "28 files / 936 tests" study
  census; `next.config.ts:20` comment lists study routes.
- **L1** `next.config.ts` `ignoreBuildErrors: true`; `tsconfig.json`
  `noImplicitAny: false` — gate-weakening config inherited from the scaffold.
- **L3** Dead code: `void formatDayDash;` (dashboard route), `productById`
  built-then-voided + identical `"Agregado"/"Agregado"` ternary (terminal
  view).
- **L5** Donut legend swatches index the unfiltered array while arcs index
  the filtered one → swatch/slice color mismatch when zero-count categories
  precede non-zero ones.
- **L6** `loadCollections` drops `allSettled` rejections silently; reports/
  sales render empty with no error affordance.
- **L9** `.env.example` missing `NEXT_PUBLIC_SITE_URL` (read by
  `src/lib/site.ts`); the example `AUTH_SECRET` value is not in the
  production fatal set (a shared deploy can boot with it).
- **L11** Mobile drawer declares `role="dialog" aria-modal="true"` but never
  moves focus into the panel or traps/returns focus.
- **M8-adjacent (docs)** `omni-study1_SKILL.md` still describes the
  StudyFlow app; the charter references a `web-retail-pos_SKILL.md` that
  does not exist yet.

## 2. Remediation batches (TDD: pin red → fix → pin green → gate)

### R1 — Security hardening (C1, H1, H2, H3, M4, M6, M7, L10)
1. **C1**: response carries `resetPath`/`resetUrl` ONLY when in-app
   delivery is enabled (`RESET_INAPP_DELIVERY=1` or non-production);
   production default omits them (a deployed instance without a mail
   channel recovers via the documented CLI/seed path). Pin: e2e spec
   asserting production-shaped bodies never contain a token; login surface
   handles absence with the generic copy.
2. **H1**: map `ZodError` → 400 in `toErrorResponse` (single root fix per
   skill Appendix A #4). Pin: e2e POST/PATCH invalid payloads against
   products/categories/registers/cashiers → 400 (not 500).
3. **H2**: `verify-email` gains the IP rate limit (reuse the login bucket
   shape) + per-token atomic attempt counter (`updateMany` guard, ≥6 failed
   attempts invalidates). Pin: e2e — wrong code ×6 → token dead even when
   the right code follows; 429 after the IP burst.
4. **H3**: extract pure `resolveClientIp(xff, {hops})` — select the hop at
   the declared trusted depth (`AUTH_PROXY_HOPS`, default 0 = rightmost),
   fail closed on unparsable input. Pin: unit tests (single hop, rotated
   list, garbage, absent).
5. **M4**: `readJson` — reject `content-length` > 1MB (413), non-JSON
   content types (415, absent/empty tolerated). Pin: unit tests on the
   reader with constructed Requests.
6. **M6**: `tokenVersion Int @default(0)` on User; session payload carries
   `v`; `reset-password` bumps it; session verification compares. Pin: e2e —
   cookie captured before reset is 401 after; unit pin on the verify branch.
7. **M7**: unknown-email login burns a dummy scrypt verify before the 401.
   Pin: unit timing-shape assertion (both branches call verifyPassword) via
   seam injection — no wall-clock flake.
8. **L10**: expired buckets pruned during `checkRateLimit`. Pin: unit —
   expired entry deleted after a check.

### R2 — Data integrity & correctness (M1, M3, L2, L4, M5, L8)
1. **M1**: re-check + guarded decrement inside the sale transaction
   (`updateMany({ where: { id, userId, stock: { gte: qty } } })`, abort when
   `count < 1` → 422). Pin: e2e selling more than stock → 422, stock
   unchanged (replaces the pre-transaction check).
2. **M3**: terminal line cells render via `lineTotalCents`; AGENTS.md
   formula wording reconciled to `round(price × (1+iva) × qty)` in the same
   commit. Pin: money unit extended (`1234¢, 16%, ×2 → 2863`), plus a source
   pin asserting the view imports `lineTotalCents`.
3. **L2**: delete the vacuous refine; server-side rule — `efectivo`
   requires `cashReceived ≥ total` (else 422); card ignores it. Pin: unit
   (schema rejects short cash) + e2e API-level 422.
4. **L4**: open-shift create re-checked inside a transaction + 409 mapped
   via a dedicated conflict error; comment corrected. Pin: e2e — second
   open on the same register → 409.
5. **M5**: sales list capped (`take`, newest-first) and shifts "ventas"
   aggregated via `groupBy(shiftId, _sum)` — response shapes unchanged.
   Pin: unit on the aggregation seam + e2e suite stays green (shapes).
6. **L8**: `@@index` — `Sale([userId, createdAt])`, `SaleItem([saleId])`,
   `Shift([userId, registerId, status])`, `Product/Category/Register/
   Cashier([userId])`. Pin: schema.test asserts the indexes exist.

### R3 — Visual parity with the live reference (V1–V6)
1. **V1**: `SectionCard` gains `variant: "card" | "kicker"` —
   `card` = h3, title-case (no transform), `text-slate-700`, `text-base
   font-bold`; `kicker` = h2, `uppercase`, `text-white/60`, `text-sm
   font-bold tracking-[0.7px]`. Dashboard + Ajustes → `card`; Reports →
   `kicker`. DOM text stays title-case everywhere (testId/text pins safe).
   Pin: e2e computed-style assertions (transform + color + size) on one
   dashboard card, one ajustes card, one reports card.
2. **V2**: PageHeading → fixed `text-2xl` (24px at all widths). Pin: e2e
   computed font-size 24px at 1280×800.
3. **V3**: reports daily chart — X labels thinned to ≤8 evenly stepped
   (first + last always shown); money Y labels integer `$` format. Pin: e2e
   — 30-day window renders ≤9 X-label text nodes; Y labels match `/^\$\d+$/`.
4. **V4**: dashboard weekly — `weekWindow()` pure helper in `src/lib/date.ts`
   (rolling 7 days, per-date `WEEKDAY_MIN[isoWeekday(d)]` labels, today
   last); Y labels integer `$`. Pin: unit — window ending Wednesday labels
   `…mar mié`; e2e — last label equals today's weekday.
5. **V5**: Ajustes logotipo — styled `<button>`-looking label wrapping the
   hidden file input (upload icon + "Subir logo", filename feedback).
   Pin: e2e — button with "Subir logo" text visible; input remains
   functionally wired (setInputFiles works).
6. **V6**: dashboard low-stock rows — amber box-icon chip, bold name, amber
   `N en stock (mín. M)` on the second line. Pin: e2e structure (icon chip +
   name + sub-line) on the seeded "Atún Dolores 295g" row.

### R4 — Repo hygiene & UX (M8, L1, L3, L5, L6, L9, L11)
1. **M8**: `package.json` → name `web-retail-pos`, VeloxPOS description;
   remove `quill`, `web-vitals`, `z-ai-web-dev-sdk` (zero imports; bun
   remove); delete `src/lib/server/ai.ts`; rewrite the vitest.config.ts
   header for the POS suite; fix the next.config.ts route comment.
2. **L1**: drop `ignoreBuildErrors` + `noImplicitAny: false`; build must
   stay green (tsc already passes — Verified baseline).
3. **L3**: delete the `void` hacks and the identical ternary.
4. **L5**: donut — single `colorByName` map feeding arcs AND legend swatches.
5. **L6**: `loadCollections` — failures raise one `sonner` error toast
   ("No se pudieron cargar los datos") once per burst; views keep their
   empty states. Pin: e2e — aborting `/api/products` surfaces the toast.
6. **L9**: `.env.example` + `NEXT_PUBLIC_SITE_URL` (documented); env-check
   fatals in production on the example `AUTH_SECRET` value too. Pin: unit.
7. **L11**: drawer — focus moves to the panel on open (`tabIndex={-1}` +
   focus), Tab wraps inside, focus returns to the hamburger on close.
   Pin: e2e — focusedElement after open is inside the drawer; after Escape
   it is the hamburger.

### R5 — Docs, evidence, ship
1. Screenshots: re-capture the remediated dev server set into
   `docs/screenshots/` (desktop 8 views + login + 404 + mobile drawer) and
   archive the fresh live-reference frames used as ground truth
   (`live-ref-*.png` stay as sweep evidence).
2. `.env.example` updated (R4.6) and committed.
3. Docs chain: AGENTS.md (error contract + reset-delivery contract +
   index/tokenVersion notes), CLAUDE.md (counts + variants), README.md
   (env table + feature notes), PAD (ADR-011 reset delivery, ADR-012
   tokenVersion, revision bump), `worklog.md` session entry.
4. `web-retail-pos_SKILL.md` (v1.0.0) replaces the stale
   `omni-study1_SKILL.md` at the repo root (git history preserves the old).
5. Full gate re-run: lint → typecheck → build → unit → e2e.
6. Single-branch commit(s) on `main`; push via `docs/ssh_git_wrapper_v3.py`
   per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.

## 3. Execution order & risk notes

R1 → R2 → R3 → R4 (each pin-red before its fix), R5 last. Risks:
- M6 touches auth for every request — mitigated by the full e2e suite
  (auth flows covered) and the additive default (0 = no behavior change
  until bumped).
- R3 restyles shared components — mitigated by testId-based existing pins
  (Verified: no e2e asserts the old heading styles) + new computed-style
  pins.
- L1 could surface hidden type errors at build — tsc already passes strict;
  if Next's compiler finds stragglers they get fixed, not suppressed.
- sqlite `db push` for tokenVersion/indexes is non-interactive and
  additive; e2e force-resets its own db per run.

Out of scope (disclosed, unchanged): product image UPLOAD storage
(imageUrl stays a URL string), receipt email delivery channel, in-memory
limiter for multi-instance deploys, the reference's own dead ends
(documented superset gaps already shipped in V1).

---

## 4. Execution record (Session V2 — completed 2026-10-26)

Every batch landed TDD (pin red → fix → pin green). Red evidence: the unit
suite ran **26 red / 152 green** after writing the new pins against the
untouched source; the e2e "red" state is captured in the pre-remediation
sweep evidence (`docs/screenshots/live-ref-*.png` ground truth vs the
superseded `verify-*.png` set, removed after the re-capture).

| Batch | Findings | Resolution | Pins |
|---|---|---|---|
| R1 Security | C1, H1, H2, H3, M4, M6, M7, L10 | mapper `ZodError`→400; env-gated reset delivery (`src/lib/reset-delivery.ts`); `verify-email` IP limit + atomic attempt counter (6 misses kill the token — success path included); `resolveClientIp` trusted-hop contract; `readJson` 1MB/413 + 415; `tokenVersion` revocation; login dummy-hash equalizer; limiter pruning (injectable `now`) | `tests/hardening.test.ts` (18 unit) + `tests/source-pins.test.ts` (M7) + `hardening.spec.ts` e2e (400/409/413/415/422 + OTP-burn + reset-revokes-session round-trip) |
| R2 Integrity | M1, M3, L2, L4, M5, L8 | guarded `updateMany` decrement inside the sale tx; terminal lines render `lineTotalCents`; real server-side cash rule (422); duplicate-open `ConflictError` 409 checked in the open tx; sales list `take` 500 + shifts `groupBy` aggregates; `@@index` on the hot paths | schema pins, hardening.spec (409 / oversell-422 / cash-422) |
| R3 Visual parity | V1–V6 | `SectionCard` variants (`card` = title-case `#334155` 16px; `kicker` = uppercase white/60 14px/0.7px); PageHeading fixed 24px; `thinLabels` ≤8 + integer `$` Y labels; `weekWindow()` per-date weekday labels (dashboard Y plain integers); "Subir logo" styled button; low-stock row icon-chip + stacked copy | `parity-pins.spec.ts` (9 computed-style/structure pins) |
| R4 Hygiene | M8, L1, L3, L5, L6, L9, L11 | `package.json` → `web-retail-pos` + dep prune (quill/web-vitals/z-ai-web-dev-sdk) + `server/ai.ts` deleted + vitest header rewritten + next.config comment fixed; `ignoreBuildErrors` and `noImplicitAny:false` REMOVED (caught 2 spec type errors on the next build — the gate works); dead `void` hacks + identical ternary removed; donut single `colorByName`; load-failure error toast (rate-limited); `.env.example` full surface + `EXAMPLE_SECRET` production-fatal; drawer focus trap + return | source-pins.test.ts + mobile-navigation focus pins |

**Final gate (all on the final tree):** lint ✓ · tsc ✓ · build ✓ (types
enforced) · unit **181/181 (16 files)** · e2e **67/67** (49 original + 18
new pins). Screenshot evidence re-captured from the reseeded dev server:
`docs/screenshots/` (desktop 8 views + login + 404 + live-sale frames +
mobile set incl. drawer). Ground-truth live-reference frames:
`docs/screenshots/live-ref-*.png`.

**Deferred (unchanged from V1, disclosed):** product image upload storage,
receipt email delivery, multi-instance limiter store, Dockerfile prose.
