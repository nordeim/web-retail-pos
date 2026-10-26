# Omni-Study1 — Worklog

> The running work journal for the remediation/parity effort on
> `nordeim/omni-study1`. Newest sessions at the bottom. Session numbering
> follows the README remediation table (session-1 … session-54 are recorded
> there; this file starts at the session-55 continuation).

---

## Session 55 — parity re-application, account flows, regression hardening

**Context.** The workspace was reset a fifth time mid-stream (the s21–s23
chunk had just gone green). The insurance-push strategy held: remote `main`
preserved the chrome baseline (`cf23159`) plus every green batch pushed
before each reset (`c03bd05` S5 → `ff0a80f` S9 → `30d6cbe` RUM/export/import).
This session re-verified the workspace, finished the remaining superset
(s24–s26), and ran the first complete full-suite regression.

**Work log.**

1. **State recovery.** Re-cloned/verified; confirmed remote main == local
   HEAD at `30d6cbe`; rebuilt the push infrastructure
   (`/home/z/ssh-infra/`: ed25519 key + paramiko GIT_SSH shim + `push_main.py`).
2. **s24–s26 decode + completion.** The change-password / delete-account /
   change-email routes and the three Settings Profile cards existed but
   failed their pins. Fixed: `aria-label`s on all three card sections, the
   "Update the address you use to sign in" + "Update email address" copy
   pins, the Danger-zone "Confirmation" label, the 409 duplicate-email copy,
   the Profile tab intro line ("Your account and study information."), the
   EmailCard identity `<p>` → `<div>` (S26 strict-mode collision with the
   Account card `<p>`), and the S26 live identity slice (store `setEmail` +
   `onEmailChanged` re-render both the sidebar footer and the Profile
   identity block). **18/18 green** → commit `5fdfd99` pushed.
3. **Login limiter progressive reset (product fix).** Three specs document
   "successful logins RESET the IP limiter"; the route never reset it and the
   suite's 11th loopback login 429'd. Added `resetRateLimit` on successful
   credential verification. Auth chunks re-verified green.
4. **Full e2e regression (six chunks).** chrome 94→**104** (incl. s14) ·
   S5+calc+S6 **46** · S7+S8+S9 **79** · tasks/resilience/s16/s17 **20** ·
   auth+s18–s23 **35** · s24–s26 **18**. Unit **834/834**. Residuals decoded
   and fixed during the sweep (commit `1356c52`, then `d3a1d74`):
   - theme-system mobile-chip locator → exact class token (the S8 softest-
     tint header carried the `bg-sf-primary-soft` substring on its dark
     variant and won DOM order while hidden);
   - studygroups right-pane hint superset copy satisfying S8-H ("Select a
     group") and S9-S (the full reference sentence) simultaneously;
   - **sf-today-tint restored as the single today-tint contract** — light
     violet-50 softest branch + raw-rgb dark branch, satisfying the
     dark-mode rgb-serialization pin (the `/30` opacity modifier emitted
     `color-mix(in oklab)`), the forced-colors outline pin, and the
     exact-token locator pin at once;
   - notes mobile h2 hoisted out of the selected-note branch (the s52
     drawer flow found no heading at 390px in the unselected state).
5. **Evidence.** 34 screenshots captured from the running remediated build
   into `docs/screenshots/` (16 desktop views, the Settings Profile card
   chain, the mobile set including the open drawer, the login card).
6. **Docs.** `docs/remediation-plan.md` written (the full findings→fix→guard
   record); README Session-55 row added; `omni-study1_SKILL.md` regenerated
   (v2.0.0 — AP-91…AP-96, the chunk map, the security note, the session-55
   lessons) per the distill skills; the superseded `omni-study_SKILL.md`
   removed and the CLAUDE.md doc-chain pointer updated.

**Stage summary.**

- Final gates: lint ✓ · tsc ✓ · build ✓ (REAL_EXIT verified) · 834 unit ✓ ·
  298 e2e + setup ✓ — all on `main`, no branches.
- Commits this session: `5fdfd99` (s24–s26 + limiter) · `1356c52`
  (regression residuals) · `d3a1d74` (sf-today-tint + notes h2) · the final
  docs/worklog commit.
- Key standing guards added: the progressive limiter reset, the
  `sf-today-tint` utility contract, the exact-token locator rule, the
  status-gated two-layer hydration gate (re-verified), and the union-based
  nullable-ID atoms (re-verified).

---

## Session 56 (continuation 7) — fresh-clone re-verification; the lost S17 batch recovered; cold full regression

**Context.** The sixth workspace reset wiped the local tree; the remote
main survived at `3ccc6c8` (the session-55 docs chain intact). This session
re-cloned, rebuilt the push infrastructure (ed25519 key + paramiko GIT_SSH
shim in `/home/z/ssh-infra/`, host fingerprints pinned from GitHub's
published docs after the meta API rate-limited), and re-verified EVERY
recorded gate from scratch instead of trusting the session-55 "final
gates" claim.

**Work log.**

1. **Fast gates re-verified.** lint ✓ tsc ✓ unit 834/834 ✓ build
   (repo script, REAL_EXIT) ✓ — all green on the fresh clone.
2. **The full e2e sweep immediately contradicted the record.** S8-C
   failed (78/79): commit `d3a1d74` had collapsed the calendar cell's
   violet-100 pin into `sf-today-tint`'s violet-50 (S8-E's header value)
   and the S8 chunk was never re-run. Fixed with a sibling utility
   `sf-today-cell-tint` (light `--sf-primary-empty` = violet-100 237 233
   254; shared raw-rgb dark branch) — 115/115 across S7–S9 +
   dark-mode + accessibility + theme-system.
3. **The s17 family: specs survived, implementation didn't.** 5/6 tests
   failed from a fresh clone; the pinned strings never existed in src
   (`git log -S` showed them only in specs since the initial scaffolding).
   Implemented the whole batch TDD-style: the seven reference-measured
   empty-state hint families (+ the tasks hint no longer counting the
   "active" status default), analytics zero-state sub-captions
   (avg progress / total study hours / exams scheduled / No subject data
   yet), GradeTracker stat-cards-only zero state (Highest Grade "—" keeps
   the exact-"0%" pin single), the Settings depth (Appearance intro,
   Subjects/Holidays reference copy + headers, School placeholder, Daily
   Study Goal readout, Account created line), the Notifications
   master-toggle rebuild (local state + Save Preferences → PATCH +
   "Preferences saved." + reload persistence; remount-key resync — the
   setState-in-effect lint gate forced the better pattern), and the
   StudyGroups zero-state placeholder split (exact "Select a group" span
   + the full-sentence span, visible above the empty state in both panes
   — S8-H + S9-S + S17-G all satisfied). 6/6 green.
4. **Cold-start residuals the warm sweep had hidden.** resilience-A3:
   the mathsolver input was `accept="image/png,image/jpeg,image/webp"`
   (the spec targets `accept="image/*"`) and the guard toast copy was
   invented — fixed to the reference's. S16: the auth sub-screens shipped
   desktop values — h2 `text-xl sm:text-2xl`, the back link moved ABOVE
   the h2 on verify/forgot with the measured gaps (76px = 12+44+12+8;
   28px = 20+8; the link is `display:block` so the inline line-box
   descender cannot add 2px). s16 4/4, resilience 5/5.
5. **The RUM beacon never fired — ever.** A fresh-DB s18 run with a 20s
   poll still saw samples=0; a network probe showed ZERO /api/rum calls
   on a real Dashboard load. Root cause: `hasSessionCookie()` reads
   `document.cookie`, and the `sf_session` cookie is httpOnly — invisible
   to JS — so the gate was permanently closed and every prior "green"
   s18 was fed by other specs' POSTed batches. Gate removed (the
   authed-shell mount point is the auth gate). s18–s23 25/25.
6. **Spec hygiene (cold-start races, assertions unchanged).** s18's fixed
   3.5s sleep → bounded poll on samples≥1; the skip-link's fixed 400ms
   focus read → bounded poll on MAIN#main-content.
7. **Final certification.** Three chunks on the FINAL bundle with a cold
   server + fresh DB each: 149 + 98 + 54 = **301/301**; unit 834/834;
   lint/tsc/build clean. 13 new screenshots (`56-*.png`).
8. **Push infrastructure rebuilt + debugged.** The paramiko shim needed
   three fixes this session: the `-o` flag's separate value was parsed as
   the host (DNS error), the read-all-then-write stdin feed deadlocks a
   push (stream chunks instead), and the `makefile("rb")` stdout reader
   starved under git (raw `recv_ready()` polling). Insurance commits
   pushed after every green batch.

**Stage summary.**

- Final gates: lint ✓ · tsc ✓ · build ✓ (REAL_EXIT) · unit 834/834 ·
  e2e 301/301 (cold, fresh DB, 3 chunks) — all on `main`, no branches.
- Commits this session: `70be173` (the s17 batch + residuals + beacon
  fix) · the docs/worklog/screenshots commit.
- Standing lessons recorded: AP-97 (httpOnly cookie gates), AP-98
  (sibling tint utilities for divergent light pins), AP-99 (specs are
  the pin source — re-verify from a fresh clone), AP-100 (bounded polls
  over fixed sleeps).

---

## Session 57 (continuation 8) — sync + independent re-certification; no code changes

**Context.** The seventh continuation opened on a tree that was NOT reset
this time: local `main` held the full session-56 chain (`70be173` +
`7373c11`), appearing "ahead by 2" only because the local `origin/main`
ref was stale. The push attempt was rejected — the remote had moved to
`71b70ae` ("update session log", the user-side `docs/session_3.md`
addition) which already contained both session-56 commits. Fast-forwarded
to `71b70ae`; local == remote.

**Work log.**

1. **Read `docs/session_3.md`** — the user's own session-56 transcript;
   no new asks. Its "suggested next steps" (screenshot spot-check, live
   walkthrough, upstream re-sweep) remain optional enhancements.
2. **Environment verified intact** (no rebuild needed): node_modules,
   Prisma client, `.env` (`DATABASE_URL="file:../db/custom.db"`),
   `.env.example`, vitest + playwright configs, `db/e2e.db` scratch.
3. **Standalone build currency proven** — `find src prisma -newer
   .next/BUILD_ID` is empty, so the 04:08 build contains the final
   session-56 source (`70be173`); no rebuild required.
4. **All fast gates re-run from scratch**: lint ✓ · tsc ✓ · unit
   **834/834** ✓ — matching the record exactly.
5. **Full e2e re-certified on this machine**: stray-server kill, fresh
   `db/e2e.db`, three cold chunks — **151 + 95 + 55 = 301/301 GREEN**
   (2.2m / 1.3m / 47.5s), matching session-56's certification number
   for number.
6. **Deliverable inventory re-verified**: 13 `56-*.png` screenshots,
   SKILL.md v2.1.0, README Session-55/56 rows, remediation-plan Batch Q,
   worklog Sessions 55–56, `.env.example` committed.

**Stage summary.**

- No code changes this session — a pure verification pass. Every gate
  the record claims was independently reproduced and observed green.
- Remote `main` = local `main` = `71b70ae` (this worklog entry rides on
  top as the only new commit).
- The delegation's standing state: **lint ✓ tsc ✓ unit 834/834 ✓ e2e
  301/301 ✓ build ✓** — all on `main`, no branches.

---

## Session 58 (continuation 9) — sync, re-certification, and the reference drift check

**Context.** The workspace survived again. Local held the session-57
record; remote had moved to `31c54c9` (the user-side `docs/session_4.md`
addition, which already contained `e1763f8`). Fast-forwarded; local ==
remote. `session_4.md` is the user's saved transcript of session 57 —
no new asks, so this session executed the standing contract: independent
re-verification, plus the one outstanding "suggested next step" from the
session-3/4 notes that had never been done — **a live re-sweep of the
reference site** to confirm no upstream drift since session-53.

**Work log.**

1. **Fast gates re-run**: lint ✓ · tsc ✓ · unit **834/834** ✓; the
   standalone build proven still current (no src file newer than
   `.next/BUILD_ID`).
2. **E2E re-certified cold**: stray-server kill, fresh `db/e2e.db`,
   three chunks — **151 + 95 + 55 = 301/301 GREEN** (2.2m / 1.3m /
   45.4s), matching the record for the third consecutive session.
3. **The reference drift check (agent-browser, first since session-53).**
   Logged into `omni-study1.base44.app` with the delegated credentials,
   switched to a 390×844 mobile viewport, opened the mobile navigation
   drawer, and mapped its live structure:
   - Brand "StudyFlow" + "Your study companion" subtitle.
   - The 20-link nav in order: Dashboard, My Day, Tasks, Calendar,
     Events, Timetable, Assignments, Exams, Notes, Flashcards, Practice
     Tests, Study Groups, Grade Tracker, Analytics, Files, Calculator,
     Math Solver, AI Assistant, Focus Timer, Settings.
   - Footer: live clock ("05:12 AM" — the pinned 2-digit-hour 12-hour
     format), date, user avatar + name + email.
   - Fixed-position translucent drawer (ASIDE, white/80).
4. **Drift verdict: ZERO drift.** Every observed element matches the
   clone's `mobile-navigation.spec.ts` pins line-for-line — the same 20
   labels in the same order, the same brand block, the same clock regex
   (`^\d{2}:\d{2} (AM|PM)$`), the same drawer semantics. The reference
   dashboard also still shows the pinned greeting ("Good morning,
   … 👋"), Start My Day CTA, four stat headings, and the three content
   sections (Today's Tasks / Upcoming Exams / Upcoming Assignments).
   The delegation's mobile-nav / Tailwind-v4 concern is re-confirmed
   healthy: the clone already passes all 10 mobile-navigation specs
   against this exact structure.
5. **Evidence archived**: the two live reference captures saved as
   `docs/screenshots/58-ref-mobile-dashboard.png` and
   `58-ref-mobile-drawer-open.png`.

**Stage summary.**

- No code changes — verification + drift check only. All gates green
  on this machine: lint ✓ tsc ✓ unit 834/834 ✓ e2e 301/301 ✓.
- **Upstream parity confirmed current**: the reference site has not
  drifted from the clone's pinned contracts (mobile nav verified live;
  dashboard verified live).
- Remote `main` = local `main` (this entry rides on top). Still no
  branches; `skills/` still excluded from all checks.

---

## Session 59 (continuation 10) — the desktop drift check found (and fixed) the dead greeting name

**Context.** Synced to `2a64e09` (the user-side `docs/session_5.md`
transcript of session 58 — no new asks). This session executed the
standing re-verification AND the remaining suggested next step: the
**desktop surface drift check**. It found a real bug the mobile check
could not see.

**The bug (High, fixed TDD-style).**

- **Symptom (live, both warm and cold):** the clone's dashboard greeted
  every user "Good morning, **there** 👋" and the sidebar showed the
  "StudyFlow user" fallback — the reference greets by account name.
- **Root cause chain:** `publicUser()` (src/lib/server/auth.ts:66)
  deliberately serializes the DB's `fullName` as the wire field **`name`**
  (documented in the route comment), but the client `AppUser` type
  declared **`fullName`** — so `loadFromUser` read a field the wire never
  sends, `userName` stayed `""` forever, and `firstNameOf("")` fell back
  to "there". The type drift is exactly why tsc never caught it.
- **Fix (client-side only, wire contract respected):** `AppUser.fullName`
  → `AppUser.name` (store.ts, with a comment pinning the publicUser
  mapping), `loadFromUser` reads `user.name`, settings DisplayNameCard
  initial reads `user?.name`. Blast radius verified first: all API
  emitters use `publicUser` (me/login/verify-email/change-email/
  preferences), no other client consumer of `.fullName` existed, and NO
  spec pins the fallback strings — safe to change.
- **TDD:** new `tests/user-hydration.test.ts` written first against the
  real wire shape — red (1 failed) → fix → **3/3 green**. Full unit suite
  **837/837** (+3). lint ✓ tsc ✓.
- **Live verification:** rebuilt (repo build script, REAL_EXIT=0),
  relaunched the standalone server (the S22 boot guard correctly refused
  the first boot without AUTH_SECRET — generated a scratch 64-hex secret,
  process-env only), logged in, and observed "**Good morning, Demo 👋**"
  + sidebar "Demo Student" on the new bundle.

**Regression certification (post-fix bundle).** Fresh e2e DB, three
chunks: **151 + 95 + 55 = 301/301 GREEN** (the chunk-1 "150" was the
known cold-start skip-link race — passed solo and in the re-run).

**Desktop drift verdict.** Reference vs clone at 1440×900 across
Dashboard / Tasks / Analytics / Settings: same structural skeleton
(brand H1 + greeting, 4 stat H3s, 3 section H2s, 20-link nav; per-page
page titles identical). Content differs only by data (seeded demo vs the
reference's empty account). The reference renders section titles as
styled divs where the clone uses semantic h2 — an accessibility
improvement, consistent with the documented superset approach. Evidence
archived as nine `59-*.png` captures (both sides, all four surfaces).

**Stage summary.**

- One production bug fixed (the dead greeting name) + 3 unit pins.
- Gates: lint ✓ tsc ✓ unit **837/837** e2e **301/301** build ✓
  (REAL_EXIT).
- S22 boot guard observed working live (refused an AUTH_SECRET-less
  production boot, then booted clean with one).
- Still `main` only; `skills/` still excluded.

---

## Session 60 (continuation 11) — 7th workspace reset; full cold-start rebuild; drift coverage completed

**Context.** The seventh reset wiped the workspace AND `/home/z/ssh-infra/`.
Remote `main` survived at `82cbeb4` (the session-59 chain + the user-side
`docs/session_6.md` transcript — no new asks). Re-cloned per the
delegation and rebuilt everything from scratch.

**Work log.**

1. **Cold-start rebuild.** `npm ci` (install-scripts gated → explicit
   `prisma generate`), `.env` recreated
   (`DATABASE_URL="file:../db/custom.db"`), `db:push` + `db:seed`
   (`db/custom.db`, demo account ready), Playwright chromium binary
   re-downloaded (the wiped browser cache made the first chunk fail 150×
   with "Executable doesn't exist" — infrastructure failure, not source
   debt).
2. **Push infrastructure rebuilt + hardened.** ed25519 key from the
   delegation; paramiko shim re-authored with all three session-56 fixes
   (`-o` value consumed, streamed stdin feed, `recv_ready()` polling).
   Two new traps this time: (a) `pip` targeted the system Python 3.13
   while `python3` is the uv venv 3.12 — paramiko must go in via
   `python3 -m pip`; (b) the ed25519 fingerprint TYPED FROM MEMORY was
   wrong (`…krUUvCO5E` vs the real `…kr4UvCOqU`) — fetched the
   authoritative set from GitHub's docs page (the meta API rate-limited
   again) and cached it. Lesson re-confirmed: NEVER trust remembered
   fingerprints. `ls-remote` verified before any push.
3. **All gates re-certified from scratch** (AP-99): lint ✓ tsc ✓ unit
   **837/837** ✓ build ✓ (REAL_EXIT=0) · e2e cold: **151 + 95 + 55 =
   301/301**.
4. **One spec-hygiene hardening (cold-start race).** S8-G "notebook/tag
   filters" counted the two combobox triggers immediately after the
   theme-var `hydrated` gate — which covers the authed shell + theme but
   NOT the Notes collection round-trip. On a cold server the triggers
   mount a beat later (count 0 → flaky; passed 2-of-3 solo). Added
   `combos.first().waitFor({ state: "visible" })` before the count —
   assertions UNCHANGED (exactly two triggers, exact labels); 3/3 cold
   green after.
5. **Drift coverage completed** — the last three desktop surfaces,
   reference vs clone at 1440×900: Notes, Flashcards, Calendar.
   Calendar matches exactly (both render "October 2026"); Notes and
   Flashcards match structurally (page identity, layout skeleton), with
   content differences purely data-driven (seeded demo vs the
   reference's empty account). No upstream drift. Six `60-*.png`
   captures archived.

**Stage summary.**

- Gates on the fresh clone: lint ✓ tsc ✓ unit 837/837 e2e 301/301
  build ✓ (REAL_EXIT) — everything re-verified, nothing trusted.
- One flaky spec hardened (race removed, no assertion weakened).
- Drift evidence now covers: mobile nav (58) + desktop
  Dashboard/Tasks/Analytics/Settings (59) + desktop
  Notes/Flashcards/Calendar (60) — ALL surfaces, ZERO drift.
- Push infra: rebuilt with the venv-pip and fingerprint lessons; remote
  `main` = local `main` after this entry. Still no branches.

---

## Session 61 (continuation 12) — the first real-audit pass: Lighthouse found (and fixed) five a11y defects

**Context.** The workspace survived again; remote had moved to `de77e22`
(our two session-60 commits, already sync-promoted by the user, plus the
user-side `docs/session_7.md` — no new asks, but its "suggested next
steps" named the one never-done item: **a Lighthouse/perf pass on the
production build**). This session executed that, and the audit engine
found what sixty sessions of spec-driven gates could not.

**Work log.**

1. **Sync + re-certification.** Fast-forwarded to `de77e22`; fast gates
   re-run (lint ✓ tsc ✓ unit **837/837** ✓), build proven current (0
   source files newer than BUILD_ID), e2e cold **301/301**
   (151+95+55) — fourth consecutive session matching the record.
2. **The Lighthouse pass (first ever).** Production standalone on :3200
   (dev DB + scratch AUTH_SECRET), Lighthouse 13.5 desktop preset, the
   authed dashboard measured via cookie injection:
   /login **P93 · A11y 94 · BP 96 · SEO 100**;
   dashboard **P76 · A11y 90 · BP 96 · SEO 100** — with five concrete
   a11y findings: `heading-order` (h1→h3 skips: the overdue banner +
   the four StatCard values), `color-contrast` ×2 (the StatCard hint
   slate-400 on white = 2.56:1; the overdue pills red-600 on red-100 =
   3.95:1), `aria-prohibited-attr` (the roleless toast viewport's
   aria-label), and `landmark-one-main` (the standalone auth surface).
3. **All five fixed TDD-style.** accessibility Family E written first
   (5 pins: no-skip heading walk, the two computed-color pins, the
   named toast region, the one-main auth landmark) — red (4 failed) →
   fix → green. Fixes: banner h3→h2 + StatCard value h3→h2
   (class-identical swaps, zero visual delta); hint slate-400→slate-500
   (4.76:1; dark untouched — was already slate-500) on StatCard +
   GradeTracker; pills red-600→red-700 (5.32:1) on the dashboard badge
   + the shared DuePill; toast viewport `role="region"` (the radix
   pattern); login-surface root + both Suspense fallbacks div→main.
   The three pinned level-3 assertions (parity-session9 ×2, dark-mode
   ×1) updated with justification comments — visually identical tag
   swaps, the S26 p→div precedent.
4. **The landmark fix broke four specs — and the failures lied.** s16/
   s24/s25/s26 waited for `querySelector("main") !== null` after
   signing in through the login UI; the login page's own new `<main>`
   resolved the wait before the post-login redirect, and the next goto
   raced it into `net::ERR_ABORTED` (S16-A twice in chunk runs, S26
   once — both green solo, masquerading as cold-start flake). Root
   cause over flake-call: all four waits now target `main#main-content`
   (the shell's skip-link anchor). AP-102 recorded.
5. **Verified by the audit itself + the full suite.** Lighthouse
   re-audit: /login a11y **94 → 100**, dashboard a11y **90 → 100**
   (perf 75 = run-to-run noise on documented structural debt: LCP
   3.3s, TBT 700ms, CLS 0.00 — the RSC-conversion remedy noted in
   Batch R). Full cold re-run: **156 + 95 + 55 = 306/306** (the 301 +
   the five Family E pins); lint ✓ tsc ✓ unit **837/837** ✓ build
   REAL_EXIT=0 ✓.
6. **Evidence + docs.** `docs/lighthouse/` (before/after pairs, JSON +
   HTML, both surfaces); `61-clone-desktop-Dashboard.png` (the
   remediated dashboard); remediation-plan **Batch R** (R1–R6); README
   Session-61 row; SKILL.md **AP-101** (real audit tooling sees what
   spec suites forget) + **AP-102** (spec waits need semantically
   precise markers).

**Stage summary.**

- Five a11y defects fixed + one indirect spec-proxy regression killed;
  both audited surfaces at **a11y 100**.
- Gates: lint ✓ tsc ✓ unit **837/837** e2e **306/306** build ✓ — all
  on `main`, no branches; `skills/` still excluded.
- Remaining honest debt (documented, not hidden): the dashboard perf
  cost (structural client-bundle weight) and the reference-measured
  muted tokens on non-audited surfaces (calendar/myday/settings empty
  states) — the follow-up checklist is in Batch R.

---

## Session 62 (continuation 13) — the Lighthouse-equivalent sweep: ALL 20 views audited, 35 violations found and fixed

**Context.** The workspace survived; remote had moved to `6748510`
(our session-61 commits + the user-side `docs/session_8.md` — the
transcript of session 61: no new asks, but its suggested next steps
named the two documented debts — the non-audited surfaces' muted tokens
and the structural perf cost). This session executed the first and, in
doing so, extended the a11y-100 achievement from 2 surfaces to ALL 20.

**Work log.**

1. **Sync + re-certification.** Fast-forwarded to `6748510`; fast gates
   re-run (lint ✓ tsc ✓ unit **837/837** ✓), build proven current, e2e
   cold **306/306** (156+95+55) — fifth consecutive session matching
   the record.
2. **Family F — the Lighthouse-equivalent sweep.** Lighthouse's a11y
   category IS axe-core (13.x: tags wcag2a+wcag2aa + a 28-rule overlay,
   mirrored byte-for-byte from the installed 13.5.0 gatherer source).
   The 18 non-audited views are client-switched inside the single-route
   shell — unreachable by URL — so the new `tests/e2e/a11y-sweep.spec.ts`
   runs the SAME axe config on every authed view (20 tests, one per
   view, semantic mount markers per AP-102; axe-core added as an
   explicit devDependency). The Dashboard test doubles as the
   equivalence anchor: it must pass because real Lighthouse certified
   it at 100. First run: **17/20 views failed — 35 violations.**
3. **All 35 fixed TDD-style** (sweep red → source fix → sweep green;
   the full table is remediation-plan **Batch S**, S1–S8): the muted
   `text-slate-400` tokens on seven surfaces (the documented debt);
   heading-order h3→h2 class-identical swaps across ten views + the
   shared EmptyState (Settings alone carried 13); `sf-selected-tint`
   violet-500→violet-600 via `--sf-primary-strong` (white on violet-500
   = 4.23:1; the key insight: SOLID fills are axe-resolvable while the
   violet GRADIENT CTAs report unscored "incomplete" — which is why 61
   sessions of Lighthouse never saw it); exams/calculator badge tokens
   one step darker; `role="img"` on the two aria-labelled decorative
   blocks; the shared Slider's aria-label forwarded from Root to the
   radix THUMB (role="slider" lives there — axe aria-input-field-name
   ×6); the Calculator's two-`<Tabs>`-roots bug merged into one tree
   (every trigger's aria-controls pointed at a never-rendered panel id
   — a genuine screen-reader defect, axe aria-valid-attr-value
   [critical]; radix Tabs.Root renders no DOM, so the merge is
   DOM-identical); three label-content-name-mismatch fixes (Events
   "Create event" vs visible "New Event", dynamic filter labels
   "Filter tasks: All", the calculator key "Clear: AC" — axe STRIPS
   PARENTHETICALS from the name before matching, so "Clear (AC)" still
   fails; AP-104).
4. **Eight pinned values updated in-place with justification comments**
   (the R1/R3 precedent): S8-C ×2 (selected fill), S6-G (today cell +
   amber badge), S5-G (mode-switch tab), S9-F (mode-switch tab), S9-J
   (orange badge), S5-H (clear-key color); plus four locator updates
   where a fix legitimately changed an accessible name ("Filter tasks"
   → prefix-match ×4, the assignments filter ×1, the S8-K clear-icon
   locator, and the S5-B New-Event click now `.first()` — the removed
   mismatched aria-label unmasked the panel's own same-named text
   button).
5. **Verified by the audit itself + the full suite.** Family F 21/21
   green; full cold re-certification **176 + 95 + 55 = 326/326** (the
   306 plus the twenty sweep pins); lint ✓ tsc ✓ unit **837/837** ✓
   build REAL_EXIT=0 ✓. Lighthouse re-audit on the final bundle:
   /login **P100 · A11y 100**, dashboard **P98 · A11y 100** (perf =
   run-to-run variance on the documented structural debt — the RSC
   remedy stays in Batch R).
6. **Evidence + docs.** `docs/lighthouse/62-{dashboard,login}-after.json`;
   `docs/screenshots/62-clone-desktop-{Calendar,Settings,Calculator}.png`
   (the violet-600 selected states + the merged Tabs + the red-700
   clear key, verified visually); remediation-plan Batch S; README
   Session-62 row; SKILL.md **AP-103** (audit engines must cover the
   app's real navigation surface — mirror the auditor's own rule table
   and keep an equivalence anchor) + **AP-104** (axe strips
   parentheticals from accessible names before label-content-name
   matching).

**Stage summary.**

- All 20 authed views + both auth surfaces now certified against the
  Lighthouse rule set: **zero violations, by construction, permanently
  gated.**
- Gates: lint ✓ tsc ✓ unit **837/837** e2e **326/326** (176+95+55)
  build ✓ — all on `main`, no branches; `skills/` still excluded.
- One real functional bug fixed beyond the contrast/heading classes:
  the Calculator tabs' dangling aria-controls (S7) — found only because
  the sweep finally looked at the views Lighthouse couldn't reach.
- Remaining honest debt (unchanged, documented in Batch R): the
  structural perf cost of the client-bundle (RSC conversion of the
  read-only views) — the one candidate the sweep cannot absorb.

---

## Session 63 (continuation 14) — the live-clock greeting fix + the 5-view reference drift sweep

**Context.** The workspace was RESET an 8th time (fresh clone at
`975e251`); the user's new `docs/session_9.md` is the session-62
transcript — no new asks, its suggested next steps naming the RSC perf
conversion "or simply periodic re-certification". With a full environment
rebuild owed, this session executed the re-certification AND moved the
drift matrix to the five views never compared against the live reference
(MyDay, Events, Timetable, Assignments, Exams — s58 mobile, s59 four
desktop views, s60 three more). The reference's evening clock (~19:00
UTC) then exposed what 63 sessions of UTC-morning runs had masked.

**Work log.**

1. **Environment rebuild (8th recovery).** npm ci, prisma generate,
   `.env` from `.env.example` + `db:push`/`db:seed`, production build,
   chromium-1248 (npm ci had bumped Playwright past the cached
   chromium-1200 — the S60 lesson, reproduced), and the SSH-infra venv
   (paramiko 5.1.0; key fingerprint re-verified
   `3ddaNlFhMz1J…U4PU`).
2. **Independent re-certification of the received state.** lint ✓ tsc ✓
   unit 837/837 ✓; the audit confirmed every s62 fix in place
   (`sf-selected-tint` → `--sf-primary-strong`, the single Calculator
   Tabs root, Family F, the s59 `AppUser.name` contract). E2E cold
   326/326 (176+95+55) on the sixth consecutive session — after the
   chromium rebuild; the first chunk-1 attempt died wholesale on the
   missing browser binary (the "1 passed" mass failure decoded in one
   step).
3. **Family G — the greeting is time-of-day aware (T1).** The reference
   at 19:08 rendered "Good evening, sepnetflix2023 👋" and its MyDay
   zero-task state "Good evening!" (captured); the clone rendered "Good
   morning, Demo 👋" at the same clock — both greeting sites fed
   `greetingForHour` the day-anchor `startOfDay(new Date())` whose
   `getHours()` is always 0, since the ORIGINAL implementation. Fixed
   with `currentGreeting()` (live clock) + a new
   `tests/e2e/greeting-clock.spec.ts` pinning all three dashboard
   buckets and the MyDay evening empty state via `page.clock.setFixedTime`
   — deterministic at any wall-clock hour (RED 3 → GREEN 5/5). Live
   verified: "Good evening, Demo 👋" at 19:35.
4. **The 5-view drift sweep, probe-verified.** Every finding was
   measured on the live reference before fixing (the evidence set:
   `63-ref-desktop-*.png` + three interactive probes — the Events
   carousel step, the two selects' options, and a create-probe-delete
   exam cycle for the count semantics; the reference account left
   clean):
   - **T2** Events CW: ISO 42 → the reference's US Sunday-start **43**
     (carousel-verified via Sat → 42) — new `referenceWeekNumber()`.
   - **T3** Events day headings "Tue, Oct 20" → "Tuesday, October 20".
   - **T4** the Timetable grid misaligned weekday labels vs dates
     ("Sunday 12" for a Monday; today-tint on the column labeled
     "Saturday 18") — Monday-anchored `weekStart` under Sunday-first
     labels; ONE root fix (Sunday-anchored week) aligned the range
     ("Oct 18 - Oct 24"), every head date, the tint and the mobile
     accordion's open day; storage `dayOfWeek` semantics untouched.
   - **T5** three clone-invented subtitles replaced with measured copy
     (Timetable "Manage your class schedule", Assignments "Track your
     homework and projects", Exams **"<n> upcoming · <m> this week"**
     live counts — semantics measured: upcoming = daysUntil ≥ 0, week
     = ≤ 6).
   - **T6** the Exams header gained the reference's **All Exams /
     Upcoming / Past** status filter (default Upcoming; `aria-label` on
     the TRIGGER per the Week-filter pattern).
   - **T7** three-dot search placeholders.
   Seven new pins RED-first (7 failed / 56 passed in their chunks) →
   GREEN; the fixes are Batch T in the remediation plan.
5. **Deferred with probes recorded** (Batch T tail): the Events
   DAY-FOCUS carousel (‹ ○ › ∨ — CW + big date track the focused day),
   the Timetable centered month/week banner, the Assignments
   subject-filter select. Structural; the next session can implement
   against the recorded facts.
6. **A trap refined into lesson 9.** The "stale server" that kept
   serving the OLD bundle through two rebuilds: Next renames the
   standalone server's process title to `next-server (vNNN)`, so
   `pkill -f "standalone/server.js"` silently matches NOTHING and the
   new boots die EADDRINUSE in an unread log. `pkill -f next-server` /
   kill by port-owner PID. (Remediation-plan Standing Lessons 9 refined
   + 11/12 added: the day-anchor vs live-clock rule and the
   fake-clock-pin rule; SKILL.md AP-105/AP-106.)
7. **Verified.** lint ✓ tsc ✓ unit **842/842** (839 + the 3
   `referenceWeekNumber` pins); build REAL_EXIT=0; full cold
   re-certification **184 + 98 + 55 = 337/337** on the final bundle.
   Live captures: `63-clone-desktop-{Events,Timetable,Assignments,
   Exams}-fixed.png` + `63-clone-desktop-dashboard-evening-greeting.png`
   + `63-clone-desktop-MyDay.png` vs the `63-ref-desktop-*.png` probe
   set (12 captures). Docs: Batch T + Standing Lessons 9/11/12,
   README Session-63 row, SKILL.md AP-105/106, AGENTS counts
   (842/337 — the first count update since session-56).

**Stage summary.**

- One production-grade behavioral bug fixed (the frozen greeting — the
  app's most visible string was wrong every afternoon and evening since
  the original implementation) + one convention bug (the CW label) +
  one layout-convention bug (the Timetable alignment) + the reference's
  Exams status filter adopted; seven new permanent pins.
- Gates: lint ✓ tsc ✓ unit **842/842** e2e **337/337** (184+98+55)
  build ✓ — all on `main`, no branches; `skills/` still excluded.
- Remaining honest debt: Batch R's structural perf (RSC conversion),
  plus the three probed structural drifts recorded in Batch T's
  deferred section (Events carousel, Timetable banner, Assignments
  subject filter) — each with its measured behavior documented for the
  next session.

## Session 64 (continuation 15) — the three Batch-T deferred structural drifts implemented (Batch U)

**Context.** The workspace was RESET a 9th time (fresh clone at
`38fd29e`); the user's `docs/session_10.md` is the session-63 transcript —
no new asks, its suggested next steps naming "implement the three probed
structural drifts (Events day-focus carousel, Timetable centered week
banner, Assignments subject filter — facts recorded in Batch T)" FIRST,
then the Batch-R RSC conversion. This session executed that first option
against fresh reference measurements.

**Work log.**

1. **Environment rebuild (9th recovery).** npm ci (489 pkgs), prisma,
   `.env` from `.env.example` + `db:push`/`db:seed`, production build,
   chromium re-download (Playwright 1.64.1 outgrew the cached
   chromium-1200 — the S60/S63 lesson, reproduced a third time), and the
   SSH-infra venv (paramiko; key fingerprint re-verified
   `3ddaNlFhMz1J…U4PU`; the runbook's Appendix-A shim deployed to
   `/home/z/ssh-infra/ssh` — ls-remote round-trip green before any work).
2. **Independent re-certification of the received state.** lint ✓ tsc ✓
   unit **842/842** ✓; the audit confirmed every s63 fix in place
   (`currentGreeting()` at both call sites, `referenceWeekNumber()`, the
   Timetable Sunday-start anchor + accordion, the Exams live-count
   subtitle + status filter, the s59 `AppUser.name` contract). E2E cold
   **337/337** (184+98+55) on the seventh consecutive session.
3. **Fresh reference probes (the Batch-T facts re-verified + extended).**
   The carousel step (‹ from Sun Oct 18 → big date 17 / Sat / CW 42; the
   list re-anchors with "Saturday, October 17" first, then "Today" — the
   relative labels belong to the REAL today, not the window index); ○ is
   a jump-home; ∨ shows no observable effect on the empty account (the
   clone implements it as an aria-expanded day-list collapse — the a11y
   superset, invisible by default); the header's measured 3-row strip
   (overline + controls / big-date baseline row / FULL-WIDTH cyan New
   Event, h-9) and the page header carrying NO CTA (the clone's gradient
   button was invented); the Timetable banner's month convention probed
   across a boundary (Sep 27 - Oct 3 → "September 2026": the FIRST day's
   month) and the chevrons' computed 6px radius; the Assignments two-row
   header (search flex-1 604px @1440 | status select w-160 | subject
   select w-160), the status options measured All/Active/Completed in
   that order, and the subject select's options deriving from the
   account's Subject entities (empty account → "All Subjects" alone).
4. **TDD Batch U.** 9 new pins written first (S5-U1 ×4 in
   parity-session5, S5-U2 ×2 in parity-session5, S8-U3 ×3 in
   parity-session8) — **RED 9 failed / 1 setup passed** exactly as
   designed. GREEN: the Events `focused` state + 4 aria-labeled controls +
   `listOpen` collapse + the measured strip + `daysUntil`-based relative
   labels + `referenceWeekNumber(focused)` + the page CTA removal; the
   Timetable `aria-label="Week banner"` group card with the nav moved in
   and the first-day-month h2; the Assignments two-row restructure, the
   status DropdownMenu → Select (keeping the `Filter assignments by
   status: …` label the S9-I prefix pin keys on) and the new Subject
   filter Select filtering by `a.subjectId`.
5. **One committed pin corrected with its measurement (AP-108).** The S8-E
   chevron-radius pin (8px) failed in chunk 2 — the probe showed the
   REFERENCE computes 6px (`rounded-md`); the 8px expectation had encoded
   the clone's own `rounded-lg` drift. Updated 8px → 6px with the probe
   documented in-place (corrected to the measured value, never weakened).
6. **Verified.** lint ✓ tsc ✓ unit **842/842** ✓; build REAL_EXIT=0;
   full cold re-certification **190 + 101 + 55 = 346/346** on the final
   bundle. Live verification on the production standalone: step →
   "17 / Sat / CW 42" + the re-anchored heads, ○ jumps home, the banner
   renders "September 2026 / Sep 27 - Oct 3" across the boundary and
   returns, the subject filter narrows to the 2 seeded math rows and
   restores. Captures: `64-ref-desktop-{Events,Events-banner,Timetable,
   Assignments}.png` + `64-clone-desktop-{Events,Events-carousel,
   Timetable-banner,Assignments-filter}.png` (8). Docs: Batch U in the
   remediation plan, README Session-64 row, SKILL.md AP-107/108, AGENTS
   counts (842/346).

**Stage summary.**

- All three Batch-T deferred structural drifts implemented against their
  recorded probes + fresh measurements; one invented CTA removed; one
  status control converted to the reference's select chrome; one drift-
  encoding pin corrected to the reference-measured value; nine new
  permanent pins.
- Gates: lint ✓ tsc ✓ unit **842/842** e2e **346/346** (190+101+55)
  build ✓ — all on `main`, no branches; `skills/` still excluded.
- Remaining honest debt: Batch R's structural perf (RSC conversion) is
  now the LAST open item from the remediation plan; the drift matrix now
  covers every view checked across s58–s64 with no known visual drift.

## Session 65 (continuation 16) — the zero-state + stat-card drifts (Batch V): the 20-view drift matrix completed

**Context.** The workspace was RESET a 10th time (fresh clone at
`41239bc`); the user's `docs/session_11.md` is the session-64 transcript —
no new asks; the newer remote commit (`41239bc`) was a v2→v5.1 restructure
of `docs/replicate-web-app_SKILL.md` (general methodology, no new asks for
this repo). This cycle's value-add was chosen from the coverage map: the
s58–s64 sweeps had covered 16 of the 20 authed views — My Day, Grade
Tracker, Practice Tests and Study Groups were never probed. This session
probed all four, completing the matrix, and fixed every drift found TDD-
style (Batch V).

**Work log.**

1. **Environment rebuild (10th recovery).** npm ci (489 pkgs), prisma,
   `.env` + `db:push`/`db:seed`, production build (the first build was
   reaped — the S32 `setsid` subshell recipe), chromium-1248 matching
   Playwright 1.64.1 (the version-mismatch lesson, reproduced a 4th
   time), and the SSH-infra shim: the runbook's parse_args had a real
   bug (`else: host = a` overwrote the host with the command string) —
   fixed in `/home/z/ssh-infra/git_ssh_shim.py`; ls-remote round-trip
   green (key fingerprint re-verified) before any work.
2. **Independent re-certification of the received state.** lint ✓ tsc ✓
   unit **842/842** ✓; e2e cold: chunk 1 **189/190 + 1 known first-chunk
   cold-start race** (solo re-run green — not a regression); chunk 2
   first failed on the s22 negative-spawn guard — root cause the S46
   class again: the repo `.env`'s REAL AUTH_SECRET got bundled into
   `.next/standalone/.env` at build time, so the guard CORRECTLY boots;
   `.env` reset to `AUTH_SECRET=""` (dev fallback posture) and the
   bundle rebuilt; chunk 3 first hit the aged-DB class (s23 fixed-id
   envelope) — `rm -f db/e2e.db` and cold re-run → **101/101 + 55/55**;
   effective total **346/346**.
3. **The matrix-completion sweep (4 never-probed surfaces).** Reference
   fingerprints captured (empty account, desktop): My Day, Grade
   Tracker, Practice Tests, Study Groups + Settings control. The
   subtitle sweep found 2 copy drifts (Grade Tracker, Practice Tests);
   the empty-state sweep (fresh registered user, the s17 recipe) found
   the My Day early-return drift and the Study Groups pane-role swap;
   the seeded Grade Tracker needed an authorized gated write probe (the
   s64 precedent: create → measure → delete → verify zero residue) —
   the reference's seeded row is THREE cards with NO sub-captions and
   NO Highest Grade, plus subject progress rows + "Recent Grades". The
   probe's cleanup surfaced a REFERENCE-side dangling record (deleting
   the probe subject cascade-removed its grade but an orphan grade
   persisted; no UI delete path) — an endpoint-learning probe
   (intercepting the UI's own create call) captured the entity API
   (`/api/apps/{id}/entities/{Entity}`, Bearer JWT from localStorage)
   and deleted both records through it; zero residue verified (0
   grades, 0 subjects); the Grade entity schema captured.
4. **TDD Batch V.** 5 new pins written first (S5-V1/V2 in
   parity-session5, S17-V1/V2/V3 in s17-fresh-user) — RED as designed
   (one pin's own locator chain fixed during RED: the CTA button is a
   sibling of the h3, not a child). GREEN: the My Day early return
   removed — the amber greeting block now renders BELOW the header +
   quick-add chrome; the Grade Tracker row re-measured to the
   reference's 3-card `md:grid-cols-3` (Highest Grade deleted, hints
   deleted, `text-4xl` values, emerald-500/blue-500 icons, subtitle
   "Monitor your academic performance"); the Practice Tests subtitle
   ("Test yourself with practice exams"); the Study Groups EmptyState +
   gradient Create Group CTA moved into the LIST panel, the right pane
   rebuilt as the bold hint (`text-xl/600` h3 + `max-w-sm` p, `py-16
   px-4`), + button `rounded-xl` → `rounded-md` (measured).
5. **Verified.** lint ✓ tsc ✓ unit **842/842** ✓; affected files green;
   full cold re-certification **192 + 104 + 55 = 351/351** on the final
   bundle, zero flakes. Live comparison on the production standalone:
   clone fingerprints now match the reference on all four surfaces
   (seeded + empty). Lighthouse re-certified a11y **100** on both
   surfaces (`65-{dashboard,login}-after.json`); the CWV budget audit
   refreshed the Batch-R deferral evidence — the clone ships 183–297KB
   JS with LCP GOOD everywhere while the live reference ships 1232KB
   total / 771KB JS and its login-mobile LCP is POOR (9452ms).
   Captures: `65-ref-desktop-*.png` (6) + `65-clone-desktop-*.png` (9);
   17 probe scripts preserved (`scripts/*-s65.mjs`). Docs: Batch V in
   the remediation plan, README Session-65 row, SKILL.md AP-109, AGENTS
   counts (842/351).

**Stage summary.**

- The 20-view drift matrix is COMPLETE (s58–s65): every authed view has
  now been fingerprint-compared against the live reference on desktop
  (and the high-traffic set on mobile); all four new-surface drifts
  fixed TDD-style; five new permanent pins (S5-V ×2, S17-V ×3).
- Gates: lint ✓ tsc ✓ unit **842/842** e2e **351/351** (192+104+55)
  build ✓ Lighthouse a11y 100×2 — all on `main`, no branches; `skills/`
  still excluded.
- Remaining honest debt: Batch R's structural perf (RSC conversion) —
  now carrying fresh CWV evidence that the clone outperforms the live
  reference on every probed surface (183–297KB vs 771KB JS; ref
  login-mobile LCP POOR at 9452ms) — remains the LAST open item, with
  its deferral evidence refreshed this cycle.
- New AP: **AP-109** — when the reference UI has no path for an
  operation (or a dangling record blocks cleanup), intercept the UI's
  own network calls to learn the entity API + auth scheme, then drive
  the API directly; a reference account is stateful and its residue is
  OURS to clean (zero-residue verification is part of the probe).

## Session 66 (continuation 17) — the reference-unchanged re-sweep + the Events zero-state drift (Batch W) + the register-budget lesson

**Context.** Workspace PRESERVED from s65 (first no-reset cycle); the
user's `docs/session_12.md` is the s65+66 transcript — no new asks; the
new remote commit (`b65e454`) added the transcript plus a `skills/`
restructure (new `full-page-screenshot` skill, rewritten
`agent-browser` SKILL — excluded from checks). This cycle: re-certify
the received state, re-sweep the reference for upstream drift, fix any
gap TDD-style.

**Work log.**

1. **Sync + decode.** `git pull --ff-only` → `b65e454` (session_12.md +
   skills/ only); `docs/session_12.md` read — state: Batch V pushed as
   `8b84dae`, 351/351 + 842/842, its suggested next step = gate re-run +
   reference re-scan (or Batch R).
2. **Environment verified preserved.** node_modules, chromium-1248,
   build fresh per AP-70 (`find src prisma -newer .next/BUILD_ID`
   empty), dbs present, the paramiko shim green (`GIT_SSH_COMMAND=
   /home/z/ssh-infra/ssh` — the `git_ssh_shim.py` PATH wrapper is the
   WRONG recipe; the direct paramiko shim is the working one).
3. **Independent re-certification of the received state.** lint ✓ tsc ✓
   unit **842/842** ✓; e2e cold on fresh servers: **192 + 104 + 55 =
   351/351** zero flakes — chunk 1 green first try this cycle (no
   cold-start race), `.env` verified at the dev posture
   (`AUTH_SECRET=""`, length-2 guard).
4. **The reference re-sweep (new probe class).**
   `scripts/ref-resweep-s66.mjs` — logs into BOTH hosts, fingerprints 7
   desktop surfaces (dashboard/myday/gradetracker/practicetests/
   studygroups/events/settings) and evaluates the s63–s65 measured
   invariants IN-SCRIPT (18 checks: 9 reference + 9 clone via a fresh
   registered user). First run: reference **9/9 UNCHANGED since s65**;
   clone 8/9 — the clone's EMPTY Events page rendered NO day-focus
   strip at all.
5. **Isolation + reference measurement.** `clone-events-check-s66.mjs`
   (no strip, no CW, no controls at zero) + `ref-events-zero-s66.mjs`
   (the reference at zero: "EVENTS" overline + 4 controls, big date 19
   / Mon, "Oct 2026 CW 43", Today/Tomorrow + 5 dated heads each "No
   events.", full-width New Event — NO empty card). Root cause: the
   S17-era `events.length === 0 ? EmptyState : panel` early return —
   Batch U rebuilt the strip inside the NON-zero branch, so the seeded
   pins never walked the zero path. The strip is DATE-driven, not
   data-driven.
6. **TDD Batch W.** S17-W pins written RED (2 failed as split), the
   early return removed (the panel now renders unconditionally; the
   day list already prints "No events." per empty day; the EmptyState
   branch + its import deleted), GREEN; affected files re-run green.
   The W family then merged into ONE test/ONE registration after the
   budget finding (below); final pin: strip chrome + CW + 7×"No
   events." + New Event AND the invented card absent.
7. **The register-budget finding.** The full chunk-2 first failed its
   LAST test with `register failed: 429`. Isolation: solo runs green;
   curl experiment on a fresh server = 10×201 then 429 (the limiter is
   exactly 10/IP/15min); the failed chunk run's DB holds exactly 9
   successful registrations — the suite had ZERO headroom (S9's 2 +
   s17's 8 = 10/10). Fix: one merged W registration → chunk 2 spends
   9/10 (documented in the spec's design comment); standing rule —
   never design a suite to exactly exhaust a shared time-windowed
   budget.
8. **Verified.** lint ✓ tsc ✓ unit **842/842** ✓; build REAL_EXIT=0
   (fresh bundle); full cold re-certification **192 + 105 + 55 =
   352/352** on fresh servers (pkill before each chunk — the
   reuseExistingServer bucket-inheritance class); the re-sweep then
   reports **18/18 invariants green**. Captures: `66-ref-desktop-*.png`
   ×8 (incl. events-zero) + `66-clone-desktop-*.png` ×7 + mobile pair;
   probe scripts `ref-resweep-s66.mjs`, `clone-events-check-s66.mjs`,
   `ref-events-zero-s66.mjs`. Docs: Batch W in the remediation plan,
   README Session-66 row, SKILL.md AP-110, AGENTS counts (842/352).

**Stage summary.**

- The reference is UNCHANGED since s65 on every measured dimension; the
  one new gap (Events zero-state — the last unknown the matrix left)
  found and fixed TDD-style with one permanent pin (S17-W).
- Gates: lint ✓ tsc ✓ unit **842/842** e2e **352/352** (192+105+55)
  build ✓ — all on `main`, no branches; `skills/` still excluded.
- New AP-110: a shared time-windowed rate limiter is a SUITE-WIDE
  budget — count every consumer across chunks, keep ≥1 slot of
  headroom, and boot each chunk against a fresh server
  (reuseExistingServer inherits partially-spent buckets).
- Remaining honest debt: Batch R's structural perf (RSC conversion) —
  the clone already outperforms the live reference on the CWV evidence
  (183–297KB vs 771KB JS; ref login-mobile LCP POOR 9452ms).

---

## Session 67 (continuation 18) — the 11th workspace reset; the brand-header typography drift (Batch X) + the mobile-nav probe-resolution lesson

**Context.** The workspace was reset an 11th time (everything under
`/home/z/my-project` wiped — repo, ssh-infra, playwright cache). The
user's `docs/session_13.md` is the s66 transcript — no new asks; its
suggested next step = repeat the gate+re-sweep rhythm (or Batch R).
This cycle: rebuild the environment from scratch, re-certify the
received state, re-sweep the reference, deep-dive the user-flagged
mobile navigation.

**Work log.**

1. **Environment rebuilt from zero.** Fresh clone at `bb729e4` (the
   s66 docs commit); `bun install` (489 pkgs); paramiko 5.1.0 +
   chromium-1243; the paramiko ssh shim re-extracted BYTE-EXACT from
   the how-to doc's Appendix A into `/home/z/ssh-infra/ssh` (shebang →
   the venv python) — `ls-remote` pre-flight green against the SSH
   remote; `.env` restored from `.env.example` (dev posture,
   `AUTH_SECRET=""`); `db/custom.db` pushed + seeded; build
   REAL_EXIT=0.
2. **Independent re-certification of the received state.** lint ✓
   tsc ✓ unit **842/842** ✓; e2e cold across all 30 spec files in a
   re-derived 3-chunk/5-sub-run map (chunk 1 split a/b/c to stay under
   the shell timeout, no day boundary crossed between sub-runs):
   **64 + 85 + 91 + 56 + 58 = 354/354** zero flakes, zero retries —
   chunk 2's register spend 9/10 (the AP-110 census re-verified: s9=2
   call sites, s17=7 after the W merge).
3. **The reference re-sweep (s66 probe class, s67 tag).**
   `scripts/ref-resweep-s67.mjs` — **18/18 invariants green** (9 ref +
   9 clone): the reference UNCHANGED since s65 on every measured
   dimension; the clone matching everywhere incl. the Batch-W Events
   zero state. Generic mobile-drawer probe fails identically on both
   sites (documented heuristic weakness).
4. **The mobile-nav deep-dive (user-flagged surface).** The generic
   probe's failure root-caused with a diagnostic probe: the reference
   hamburger is an UNLABELED icon button (`aria-label` absent) in a
   fixed glass header, and its drawer mounts neither `role="dialog"`
   nor `data-state` — the clone's "Open navigation menu" aria-labels
   and Radix-style dialog semantics are the documented a11y superset.
   A REAL Playwright click opens the reference drawer fine (screenshot
   `67-ref-mobile-drawer-open.png`); the probe's own selectors were
   the weakness. Tailwind v4 trap check: no `color-mix` serialization
   on either site's drawer surfaces.
5. **The brand-header drift found + measured.** Side-by-side drawer
   screenshots exposed a wrap difference: the clone's "Your study
   companion" subtitle broke onto TWO lines. Escalated to a
   TreeWalker node dump (`brand-node-dump-s67.mjs` — every matching
   text node with computed styles + DOM path + class string):
   reference desktop brand = `h1.text-lg` (18/28), app-bar brand =
   `span` text-base (16/24), drawer = text-base/text-xs. Clone had
   `text-lg leading-tight` on the desktop title (right size, crushed
   lh 22.5 vs 28), `text-xs leading-tight` subtitle (15 vs 16), and
   text-lg/text-sm on the mobile surfaces (18/22.5 + 14/wrapped where
   the reference renders 16/24 + 12/one-line). An earlier probe's
   16px desktop read was a MIS-MEASUREMENT (unscoped `.pop()` of a
   two-node query) — caught by probe-vs-probe disagreement BEFORE
   pinning, resolved by the node dump (AP-111).
6. **TDD Batch X.** S3-H (desktop sidebar brand typography) + S3-I
   (drawer brand typography incl. the single-line subtitle box +
   app-bar brand as part 1) written RED — the S3-G name collision
   with the existing Start-My-Day CTA pin caught during RED and
   renamed. GREEN: size+lh corrected on all three surfaces
   (`mobile-chrome.tsx` drawer + app bar, `sidebar.tsx`) — every
   value byte-equal to the node dump. Affected files re-run green.
7. **Verified.** lint ✓ tsc ✓ unit **842/842** ✓; build REAL_EXIT=0
   (fresh bundle); full cold re-certification **64 + 86 + 92 + 56 +
   58 = 356/356** on fresh servers (the earlier 85/1b read was a
   tail-truncation artifact — re-run measured 86); the node dump
   re-run post-fix shows clone == reference on every surface; the
   fixed drawer captured (`67-clone-drawer-brand-fixed.png`).
   Captures: `67-ref-*` ×7 desktop + `67-clone-*` ×7 desktop + mobile
   pairs + drawer-open + brand-fixed + diagnostics (21 files).
   Probe scripts: `ref-resweep-s67.mjs`, `mobile-nav-compare-s67.mjs`,
   `ref-mobile-diag-s67.mjs`, `drawer-brand-compare-s67.mjs`,
   `sidebar-brand-compare-s67.mjs`, `brand-node-dump-s67.mjs`,
   `captures-s67-final.mjs`. Docs: Batch X in the remediation plan,
   README Session-67 row, SKILL.md AP-111, AGENTS counts (842/356).

**Stage summary.**

- The reference remains UNCHANGED since s65; the one new gap (the
  brand-header typography across sidebar + app bar + drawer — found by
  the mobile-nav deep-dive the user keeps flagging) fixed TDD-style
  with two permanent pins (S3-H, S3-I).
- Gates: lint ✓ tsc ✓ unit **842/842** e2e **356/356**
  (64+86+92+56+58) build ✓ — all on `main`, no branches; `skills/`
  still excluded.
- New AP-111: when probes disagree, dump ALL candidate nodes with DOM
  paths and pin from the path-identified node — never from an
  unscoped `.pop()`; a mis-measurement caught pre-landing (AP-108)
  never becomes a pin.
- Remaining honest debt: Batch R's structural perf (RSC conversion) —
  the s65 CWV evidence still stands (clone 183–297KB JS / LCP GOOD
  everywhere vs reference 771KB JS / login-mobile LCP POOR 9452ms).

## Session 68 (continuation 19) — the preserved-workspace cycle; the nav-chrome + dashboard drifts found by the extended invariant sweep (Batch Y)

**Context.** The user's `docs/session_14.md` is the s67 transcript —
no new asks; its suggested next step = repeat the gate+re-sweep rhythm
(or Batch R). This cycle: refresh, re-certify, re-sweep — and the
sweep, EXTENDED with the Batch-X brand invariants, caught the next
drift layer. First preserved-workspace cycle since s66 (no reset).

**Work log.**

1. **Workspace refreshed.** `git pull --ff-only` fast-forwarded
   `5211468..1ad5b89` (the session_14.md transcript commit). The
   environment survived intact (deps, chromium-1243, `.env` posture,
   fresh build, db) — only the SSH deploy key needed re-provisioning
   (shredded post-push last cycle); `ls-remote` pre-flight green.
2. **Alignment validated.** Batch X in-tree (sidebar/mobile-chrome +
   S3-H/S3-I pins); doc chain (session_14 + remediation-plan Batch W/X
   + worklog Session 67 + AGENTS/CLAUDE/README/SKILL) consistent with
   the codebase.
3. **Batch X audited** via the repo's code-review-checklist skill
   (Standards + Spec axes on the `bb729e4..5211468` diff): zero
   findings — the diff matches the node-dump truth table, pins RED-first
   with exact-token locators, docs synced.
4. **Gates re-certified cold on the received state.** lint ✓ tsc ✓
   unit 842/842 ✓; e2e across the 5-sub-run map (fresh `db/e2e.db` +
   fresh server per chunk): 74+72+96+56+58 = **356/356** zero flakes.
5. **The reference re-sweep, extended (s68 tag).** The s67 sweep class
   + the Batch-X brand table as standing invariants (desktop sidebar
   18/28 + 12/16 via TreeWalker; app-bar 16/24; drawer brand + one-line
   subtitle). The mobile probe initially reported drawers CLOSED on
   both sites — two probe-logic bugs (AP-112: `.find()` grabbed the
   hidden sidebar's link; `.fixed button` matched the hidden aside's
   chevron), fixed with visibility-scoped evaluateAll + a DOM-click
   route. 18/18 original invariants green; desktop brand table green
   on both hosts — and the side-by-side drawers exposed the next layer.
6. **Batch Y found + fixed TDD** (pins first, RED confirmed: 5 failed /
   54 passed):
   - Y1 six nav icons (NAV_ICONS re-dumped; the Practice Tests glyph
     path-identical under the lucide rename) — S8-Y pins the full
     20-entry map;
   - Y2 the active pill is the FULL 48px row (padding moved from the
     `<a>` onto the chip span) — S3-J;
   - Y3 nav rows FLUSH 48px (the reference's `space-y-1` class is dead
     on its markup; the clone's `gap-1` modeled the string, not the
     render) — S3-J/K/L pitch pins;
   - Y4 desktop header `p-6 border-b` 109px (subtitle wraps) +
     collapsed 85px left-aligned chevron — S3-J/S3-K;
   - Y5 drawer brand block `p-6 border-b` 89px, rows start y=105 —
     S3-L;
   - Y6 footer `border-t p-4` + the 24px/700 statement clock — S3-J;
   - Y7 app-bar clock 500/slate-600 — S3-L part 1;
   - Y8 dashboard stat hints/icons/gradients + the Focus Time semantic
     (month-hours via the new `formatFocusHours`/`isSameMonth` seams,
     unit-pinned) — S4-K + date.test.ts;
   - Y9 the hero CTA is an anchor with a sparkles icon (Button asChild;
     4 button-locator pins corrected per AP-108).
   - The a11y-vs-parity call documented: the reference's slate-400
     subtitle (2.56:1) stays slate-500 (4.76:1) in the clone — the
     Batch-R/S seven-surface family's own call.
7. **Verified.** lint ✓ tsc ✓ unit **844/844** ✓; build REAL_EXIT=0;
   full cold re-certification **74 + 76 + 97 + 56 + 58 = 361/361** on
   fresh servers (chunk-2 register spend 9/10 unchanged); the s68 sweep
   reports **ok:true** (18 invariants + desktop brand + drawer-open +
   bar/drawer brand green on BOTH hosts); post-fix node dumps:
   desktop/drawer pitch 48/48, drawer rows start 105/153/201
   (byte-equal); corrected dashboard + drawer captured.

**Stage summary.** HEAD = the Batch-Y commit. Baselines: e2e **361/361**
(74+76+97+56+58, 30 spec files), unit **844/844**, Lighthouse a11y
anchor green via the Lighthouse-equivalent sweep (21/21). New pins:
S8-Y, S3-J, S3-K, S3-L, S4-K (+2 unit seams). New lesson AP-112 (probe
visibility scoping). Remaining honest debt: Batch R's structural perf
(RSC conversion) — the s65 CWV evidence still stands (clone 183–297KB
JS / LCP GOOD everywhere vs reference 771KB JS / login-mobile LCP POOR
9452ms).

## Session 69 (continuation 20) — the 13th workspace reset; the screenshot-sweep drift layer (Batch Z): dashboard sections, My Day column, view-header icons, Events bands, the Settings Appearance card

**Context.** The user's `docs/session_15.md` is the s68 transcript —
its suggested next step = repeat the gate+re-sweep rhythm (or Batch R).
This cycle: the workspace came back RESET (fresh clone), so the cycle
re-provisioned everything, re-certified the received state, ran the
s69 sweep, and the side-by-side screenshot pairs exposed the next
drift layer (Batch Z).

**Work log.**

1. **Workspace refreshed from scratch.** Fresh clone → HEAD `f0d01b1`
   (the session_15 transcript commit on top of Batch Y `7f24fe7`).
   Environment re-provisioned: bun install (489 pkgs), `.env`
   (`DATABASE_URL="file:../db/custom.db"`, `AUTH_SECRET=""` — the s46
   posture), `db/custom.db` pushed + seeded, chromium-1243,
   production build fresh. The reset shredded the SSH infra — the
   paramiko shim rebuilt at `/home/z/ssh-infra/ssh` (+ key 0600 +
   config), `ls-remote` pre-flight green.
2. **Alignment validated.** session_15 (the s68 transcript) + the doc
   chain read; Batch Y verified in-tree (NAV_ICONS map, sidebar
   header/footer chrome, dashboard stat hints/icons/gradients + the
   month-hours seams, S4-K). Doc chain consistent with the codebase.
3. **Gates re-certified cold on the received state.** lint ✓ tsc ✓
   unit **844/844** ✓; e2e across the re-derived 5-sub-run map —
   chunk 1 split 3 ways by weight (12 zero-register files), chunk 2 =
   the s9+s17+tasks/resilience/s16/s14 register family (fresh server),
   chunk 3 = auth + s18–s26 + greeting: **105+100+42+56+58 = 361/361**
   zero flakes.
4. **The s69 sweep + the screenshot pairs.** The s68 sweep class
   re-tagged (`ref-resweep-s69.mjs`): **ok:true** — 9/9 invariants per
   host, the brand tables byte-matched, drawers open + bar/drawer
   typography green on both. The side-by-side `69-ref-*` vs
   `69-clone-*` pairs then exposed the next layer; five DOM probes
   (`z-probe{,2,3,4,5}-s69.mjs`) turned 12 screenshot hypotheses into a
   measured truth table (AP-111 discipline; the ref dashboard needed a
   broader structure dump — its section heads are h2 but the first
   probe's selectors missed).
5. **The discriminator probe (AP-113).** The ref Appearance card
   renders black with the account in dark mode; clicking the ref's own
   "Light" option changes NOTHING (the Base44 picker is a hard no-op) —
   the mode is frozen state, so the pins target mode-independent
   structure and the clone's dark contract owns mode-dependent values.
   Zero residue: the account stayed dark-selected throughout.
6. **Batch Z implemented TDD** (16 pins RED-first: 15 e2e + 1 unit):
   Z1 dashboard 3-track section row + col-span-2 (S4-L); Z2 section
   header icon map (S4-M); Z3 the Exams "All → /Exams" neutral anchor
   (S4-N); Z4 empty copy at 16px + SimpleEmptyState text-base (S4-O);
   Z5 My Day max-w-3xl + leading plus + the Button `neutral` variant
   (S9-R2 ×3 — the first draft's unpinned `bg-neutral-950` serialized
   lab(), v4 trap 10 re-hit → arbitrary hexes); Z6 ViewHeader icons
   trending-up/file-question (S3-M); Z7 the PT bare empty state (S7-P);
   Z8 the SG right-pane icon EmptyState, top-anchored (S8-Z — the s65
   reading re-measured, AP-108); Z9 the Events band chrome + the
   left-aligned calendar New Event row + "No events" without the
   period (S5-V2 ×2 + the S17-W period pin re-pinned; "No events" stays
   slate-400 — the ref's slate-500 is 3.48:1, a11y wins); Z10 the
   Settings subtitle (S4-P); Z11 the Appearance single-card rework
   (S11-7 ×2); Z12 the 22-emoji vocabulary (unit pin).
7. **Pin hardening during GREEN.** The zero-state pins (S4-O/S7-P/S8-Z)
   failed against the demo seed (which ships exams/assignments/PT/
   groups) → the fresh-account pattern inline (clearCookies +
   register/verify; `test.use` inside a test body is illegal — AP-114);
   the centering pins became viewport-aware (the e2e viewport is 1280,
   not the probe's 1440); the band-bg pin accepts both serializations
   (trap 7); the avatar dark pin recovered `sf-chip-dark` (the S11-2..5
   wash contract).
8. **Verified.** lint ✓ tsc ✓ unit **844/844** ✓; build REAL_EXIT=0
   fresh; full cold re-certification **108+107+44+59+58 = 376/376**
   zero flakes; the final s69 sweep **ok:true** post-fix; the standing
   dark-sweep clean of NEW findings — the pre-existing `sf-clock-date`
   gradient-bg artifact verified identical pre/post by stashing the
   batch and re-running the sweep on the received bundle.

**Stage summary.** HEAD = the Batch-Z commit. Baselines: e2e **376/376**
(108+107+44+59+58, 30 spec files), unit **844/844**. New pins: S4-L/M/
N/O/P, S3-M, S9-R2 ×3, S7-P, S8-Z, S5-V2 ×2, S11-7 ×2 (+ the
AVATAR_EMOJIS unit pin; S17-W re-pinned). New lessons AP-113 (the
reference's frozen mode — measure mode-independent structure) and
AP-114 (zero-state pins need a fresh account; the seed's data
inventory is part of the pin's environment contract). New Button
variant: `neutral`. Honest debt: Batch R (RSC structural perf — the
s65 CWV evidence stands); the pre-existing sf-clock-date dark-sweep
artifact (the sweep's effective-bg resolver skips gradient
backgrounds) — recorded for a future audit-tools cycle.

## Session 70 (continuation 21) — the preserved-workspace cycle; the probe re-measure layer (Batch AA): the dashboard section actions' true anatomy, the assignments card placement, the root rhythm, the bordered section headers, the 24-emoji avatar list

**Context.** The user's `docs/session_16.md` is the s69 transcript —
its suggested next step = repeat the gate+re-sweep rhythm (or Batch R).
This cycle: refresh, re-certify, re-sweep — and the s70 sweep's
side-by-side pairs exposed the next drift layer, which the DOM probes
turn into a truth table that also OVERTURNED one of Batch Z's own
readings (the 22-emoji list).

**Work log.**

1. **Workspace refreshed.** `git pull --ff-only` fast-forwarded
   `095a022..5fcbea6` (the session_16 transcript commit). Preserved
   workspace — deps, chromium-1243, `.env` posture, fresh build, and
   `db/custom.db` all survived; only the post-push-shredded deploy key
   needed re-provisioning (`/home/z/ssh-infra/key` 0600 + `ls-remote`
   pre-flight green against `5fcbea6`).
2. **Alignment validated.** session_16 (the s69 transcript) + the doc
   chain read; Batch Z verified in-tree (the 3-track grid + col-span-2,
   My Day max-w-3xl + leading plus + the neutral variant, ViewHeader
   icons, the Events band rework, the single-card Appearance + the
   22-emoji list, S4-L..P/S3-M/S9-R2/S7-P/S8-Z/S5-V2/S11-7 pins).
3. **Batch Z audited** via the repo's code-review-checklist skill
   (Standards + Spec axes on the `f0d01b1..095a022` diff, 47 files):
   zero findings — measured values documented in comments, the v4 traps
   handled (arbitrary hexes on the neutral variant, oklab-tolerant band
   pins, raw-rgb gradients), the dead `UserAvatar` import removed, the
   immediate-PATCH contract preserved, the a11y-wins calls justified.
4. **Gates re-certified cold on the received state.** lint ✓ tsc ✓
   unit 844/844 ✓; e2e across the 5-sub-run map (fresh `db/e2e.db` +
   fresh server per chunk): **109+108+42+59+58 = 376/376** zero flakes
   (chunk 1b's single first-pass failure = the documented
   accessibility.spec cold-boot race, green on the solo re-run).
5. **The s70 sweep + the screenshot pairs.** The s69 sweep class
   re-tagged (`ref-resweep-s70.mjs`): **ok:true** — 9/9 invariants per
   host, brand tables byte-matched, drawers open + bar/drawer typography
   green on both. The dashboard pair then exposed the layer: the ref's
   Upcoming Assignments card renders FULL-WIDTH with a "View All"
   action; the clone's sat in one grid track, actionless.
6. **Six DOM probes** (`scripts/z-probe{,2,3,4,5,6}-s70.mjs`) turned the
   screenshot hypotheses into the measured truth table (AP-111
   discipline):
   - probe #1: assignments card x=292 w=1116 (full 3-track span) + an
     action read that CONTRADICTED the screenshot;
   - probe #2 (scoped visible-node re-dump): 24 avatar tiles (⭐ at
     index 6, ⚽ at 19) — the Z12 22-read was a filter-drop mis-measure;
   - probe #3 (the AP-111 full-path dump): ALL THREE section actions =
     `<a href="/MyDay|/Exams|/Assignments">` wrapping a BUTTON at
     12px/500 violet-600 rgb(124,58,237) h-32 — the s69 probe had read
     the anchor's inherited 16px neutral-950 (probe #1's "a/16px/gray"
     vs probe #2's "button/12px/violet" disagreement resolved by the
     path dump: the anchor's parentFs/parentColor matched probe #1
     EXACTLY, the text-parent button matched probe #2);
   - probe #4 (both hosts): root rhythm 32px (stats y=128 vs 120 — the
     exact gap-6/gap-8 delta), stats 4×267×134 byte-equal, the section
     grid `lg:grid-cols-3` re-confirmed, the assignments card y=557;
   - probe #5: the ref header = outer `p-6 border-b border-slate-100`
     (24/24, h=81) + inner gap-less row (h=32); the clone = single
     `p-6 pb-4` (24/16, h=68, no divider, card 218 vs 231);
   - probe #6: the other SectionCard consumers (calculator/mathsolver/
     analytics/gradetracker) render NO titled cards at zero on the ref —
     their header anatomy is UNMEASURABLE this cycle → the opt-in prop.
7. **Batch AA implemented TDD** (7 pins RED-first: S4-N rewritten to
   the button's values, S4-Q the 3-case action table, S4-R the
   outside-the-grid placement + full-width, S4-S the 32px root rhythm,
   S4-T the bordered header block, S11-7c the 24-emoji list + the unit
   pin; RED verified 6 e2e failed + the unit RED). GREEN:
   `dashboard-view.tsx` (root gap-8, the module-scope SectionLink —
   the static-components lint rule caught the first in-render draft —
   the assignments card moved out of the grid), `shared.tsx`
   (borderedHeader opt-in), `theme.ts` (the 24-list).
8. **Verified.** lint ✓ tsc ✓ unit **844/844** ✓; build REAL_EXIT=0
   fresh; full cold re-certification **113+109+42+59+58 = 381/381**
   (376 + 5 new pins, accounting exact); the post-fix s70 sweep
   **ok:true** on both hosts — after the s63 EADDRINUSE lesson re-bit
   (the stale pre-fix standalone held :3200 through `pkill -f
   next-server`; killed by the port-owner PID, rebooted fresh); the
   fixed dashboard captured (`70-clone-dashboard.png` — the full-width
   assignments card + the violet anchor>button actions + the bordered
   headers, matching `70-ref-dashboard.png`).

**Stage summary.** HEAD = the Batch-AA commit. Baselines: e2e **381/381**
(113+109+42+59+58, 30 spec files), unit **844/844**. New pins: S4-Q/R/S/T,
S11-7c (+ the AVATAR_EMOJIS unit pin re-pinned to 24; S4-N re-pinned to
the button anatomy). New lesson AP-115 (probe-vs-probe disagreement →
full-path node dumps with parent chains; filtered scans scoped to
visible nodes). The reference remains UNCHANGED on every standing
invariant. Honest debt: Batch R (RSC structural perf — the s65 CWV
evidence stands); the pre-existing sf-clock-date dark-sweep artifact;
the other SectionCard consumers' ref header anatomy (unmeasurable at
zero — a populated-account probe could settle it).

## Session 71 (continuation 22) — the reset-workspace re-certification cycle: all gates green, zero drift candidates, the chunk-map census lesson (AP-116)

**Context.** The user's `docs/session_17.md` is the s70 transcript (Batch
AA) — its suggested next step = repeat the gate + extended-sweep rhythm
(or Batch R). This cycle ran on a RESET workspace (fresh clone at the
session_17 transcript `2d04221`): the full environment re-provisioning
path, then the standing rhythm. Result: a clean zero-drift
re-certification — no new batch, no new pins; the baselines hold.

**Work log.**

1. **Workspace refreshed (reset path).** `git clone` at `2d04221` (the
   Batch-AA commit `e161e70` + the session_17 transcript). Full env
   re-provision: `bun install` (489 pkgs), `.env` from `.env.example`
   (the `DATABASE_URL="file:../db/custom.db"` + `AUTH_SECRET=""`
   posture), `db/custom.db` push + seed, chromium-1243, and the
   paramiko ssh shim REBUILT at `/home/z/ssh-infra/ssh` (the reset
   shredded it) — this time as a full BIDIRECTIONAL PUMP (select-based
   stdin/stdout/stderr relay against the exec channel): the first
   draft's buffered `stdout.read()` DEADLOCKED git's upload-pack
   handshake (git waits for the ref advertisement; the shim waited for
   channel EOF); `ls-remote` preflight green against `2d04221`.
2. **Alignment validated.** session_17 (the s70 transcript) + the doc
   chain read (README Session-70 row, SKILL AP-110…115, AGENTS
   381/844, the remediation-plan Batch AA section); Batch AA verified
   in-tree (the SectionLink module-scope component, the assignments
   card outside the grid, the gap-8 root, the borderedHeader opt-in,
   the 24-emoji list with ⭐ at 6 / ⚽ at 19).
3. **Batch AA audited** via the repo's code-review-checklist skill
   (Standards + Spec axes on the `5fcbea6..e161e70` source diff, 3
   files + 3 spec files): zero findings — measured values documented
   at every pin site, the v4 traps handled (`text-sf-primary-strong`
   carries no opacity modifier; the s70 pins avoided the oklab
   serialization), the DRY 3-case action table, the opt-in prop
   defaulting to zero behavior change for the other 4 SectionCard
   consumers, the anchor>button anatomy documented as the ref's own
   markup (nested-interactive already disabled in the sweep rule set).
4. **Gates re-certified cold on the received state.** lint ✓ tsc ✓
   unit **844/844** ✓; build REAL_EXIT=0 fresh (`find src prisma
   -newer BUILD_ID` empty; the bundled `.env` carries the empty-string
   AUTH_SECRET posture); e2e across the 5-sub-run map (fresh
   `db/e2e.db` + killed stale server per chunk): **113 + 109 + 42 +
   59 + 58 = 381/381** — the s70 baseline byte-matched. Chunk 1b's
   single first-pass failure = the calculator S15 keyboard test, the
   documented cold-boot race family (solo re-run green 1.1s, clean
   109/109 on the chunk re-run). **AP-116 (the chunk-map census
   lesson): the first chunk-3 run reported 53, not the expected 58 —
   the map line "auth" in the s70 transcript's compressed notation
   meant BOTH auth.spec.ts AND auth-flows.spec.ts; the compressed
   file lists in a transcript are NOT a census. Rule: before running a
   re-derived chunk map, enumerate `tests/e2e/*.spec.ts` and diff
   against the map's file set (30 spec files here, exactly once each).
5. **The s71 sweep + the screenshot pairs.** The s70 sweep class
   re-tagged (`scripts/ref-resweep-s71.mjs`): **ok:true** — 9/9
   invariants per host, the brand tables byte-matched (desktop
   sidebar 18/28 + 12/16, app-bar 16/24, drawer 16/24 + 12/16
   one-line), mobile drawers OPEN + typography green on both hosts
   (the user-flagged standing surface). Nine side-by-side pairs
   captured and compared (`71-ref-*` / `71-clone-*` ×7 desktop + ×2
   mobile): **ZERO drift candidates** — dashboard (the full-width
   assignments card + the violet anchor>button actions + the bordered
   headers, post-AA), My Day, Grade Tracker, Practice Tests, Study
   Groups, Events (band anatomy), Settings (the ref's black panel =
   the documented AP-113 frozen-dark artifact; the 24-tile avatar grid
   with ⭐/⚽ present on BOTH hosts), mobile dashboard, mobile drawer
   byte-matched.
6. **Lighthouse refreshed.** login a11y **100** (score 1.0, verified
   on /login directly and via the / and /Dashboard unauth redirects —
   all three postures render the login surface for a fresh profile).
   Honest posture note: the s65 `65-dashboard-after.json` captured
   finalDisplayedUrl `/` (pre-redirect), so the standing "dashboard
   100×2" evidence measured the same unauth shell; the AUTHED
   surfaces' a11y evidence is the axe sweep + accessibility spec pair
   (green in chunk 1b this cycle) — recorded so the ledger stays
   accurate.

**Stage summary.** HEAD = the session_17 transcript commit (`2d04221`
+ this cycle's doc/evidence commit). Baselines unchanged: e2e
**381/381** (113+109+42+59+58, 30 spec files), unit **844/844**. New
lesson AP-116 (chunk-map census: enumerate + diff the spec directory
against any re-derived chunk map before running; compressed map
notation is not a file list). The reference remains UNCHANGED on every
standing invariant — the clone holds measured parity across the full
s71 pair set. Honest debt (standing): Batch R (RSC structural perf —
the s65 CWV evidence still supports deferring: the clone's all-surface
LCP is GOOD where the reference's mobile login LCP is POOR); the
pre-existing sf-clock-date dark-sweep artifact; the other SectionCard
consumers' ref header anatomy (a populated-account probe could settle
it).

## Session 73 (continuations 23–24) — the s72 populated-account probe cycle completed: Batch AB (the populated-surface drift layer) fixed, baselines 389/389 + 844/844

**Context.** The user's `docs/session_18.md` is the s71 transcript; the
suggested next-cycle options included settling the populated-account
probe for the other SectionCard consumers' ref header anatomy. The
continuation-23 session ran the probes, wrote the 8 RED pins, and was
stopped prematurely mid-implementation; this session resumed the
workspace exactly there (HEAD `8332270`, the pins uncommitted, zero
source edits yet) and completed the cycle.

**Work log.**

1. **Resume-state verified.** `git status` clean-vs-`8332270` except the
   8 uncommitted AB pins in `parity-session5.spec.ts` + the s72 sweep
   screenshots + 4 probe scripts (untracked). No pull needed (already
   up to date with origin/main). The s72 evidence re-read: the
   populated-headers probe v1/v2 dumps + screenshots, the residue-zero
   cleanup, and the settled question (NONE of the four SectionCard
   consumers uses the bordered header — Batch AA's dashboard-only
   opt-in correct) + the NEW populated-surface drift layer it surfaced
   (calculator history panel, solver Recent Problems, GT subject cards).
2. **Batch AB implemented TDD.** RED was confirmed pre-stop (8/8 failed
   vs the pre-fix bundle). Amended AB7's chemistry line pre-commit
   (AP-117: Chemistry has ONE seeded grade → avg and pill both "78%" →
   `getByText` strict-mode collision; the ref dodges it by FORMAT
   (1dp avg) while the clone's integer convention cannot — asserted
   through the `gt-subject-avg` hook instead) and AB4 (residue-tolerant:
   the e2e db is a living scratch db, so the entry assertion scopes to
   the NEWEST listitem). Then the source fixes: `calculator-view.tsx`
   (the measured subtitle; the black aria-expanded History toggle; the
   slide-in `aside` "Calculation History" panel mounted ONLY while
   toggled — h2 title per the R1 heading-order contract; the
   spacedExpression display helper; the zero-era bottom "History"
   SectionCard + relativeTime helper removed),
   `mathsolver-view.tsx` (measured subtitle; free-standing h2 "Recent
   Problems" replacing the SectionCard), `gradetracker-view.tsx` (the
   measured per-subject card grid — chip + ramp-colored avg + "Progress
   to A (90%)" with progress=avg/90 clamped + Recent Grades pills,
   `sm:grid-cols-2`; grade rows kept below as the documented superset).
3. **GREEN + gates.** 8/8 AB pins green on the first post-fix run;
   parity-session5 cold **42/42**; lint ✓ tsc ✓ unit **844/844** ✓;
   rebuild REAL_EXIT=0 fresh (`find src prisma -newer BUILD_ID` empty).
4. **Full cold re-certification — AP-116 census first.** Per-file
   `--list` counts re-derived the 5-chunk map byte-consistent with the
   prior totals (chunk 3 = auth + auth-flows + greeting + s18–s26 = 57+1
   = 58 exact; all 30 spec files exactly once): **113 + 109 + 50 + 59 +
   58 = 389/389** zero flakes, first pass on every chunk (chunk 1c grew
   by the 8 AB pins: 42 → 50).
5. **Evidence.** `scripts/capture-s73-populated.mjs` captured the
   populated clone surfaces on the seeded demo account
   (`73-clone-gradetracker-populated.png` — the 4-card grid matching the
   s72 ref anatomy; `73-clone-mathsolver.png` — measured subtitle +
   free-standing h2; `73-clone-calculator-history-open.png` — the
   slide-in panel with the `2 + 3` / `= 5` entry + black Clear History).
   The s73 sweep (`ref-resweep-s73.mjs`, the standing class re-tagged):
   **ok:true** — 9/9 invariants both hosts, brand tables byte-matched,
   mobile drawers green on both (the user-flagged surface).

**Stage summary.** HEAD = `8332270` + this cycle's commit (Batch AB
source + pins + s72/s73 evidence + doc chain). Baselines: e2e
**389/389** (113+109+50+59+58, 30 spec files censused), unit **844/844**,
lint/tsc clean, build fresh. New lesson AP-117 (avg==pill text
collisions on single-grade subjects — assert populated aggregates
through role hooks; RED cannot catch the class, it bites at GREEN).
The open SectionCard question is CLOSED (measured, not assumed). The
reference remains UNCHANGED on every standing invariant. Honest debt
(standing): Batch R (RSC structural perf — the clone's all-surface LCP
GOOD vs the reference's mobile-login POOR still supports deferring);
the pre-existing sf-clock-date dark-sweep artifact; the analytics
dark-rendering titles (AP-113 class) are documented, not fixable
through the light-mode UI.

---

## Session 74 (continuation 25) — the 14th workspace reset; the post-AB re-certification cycle: full cold re-cert 389/389 + 844/844, s74 sweep ok, zero drift, zero source changes needed

**Context.** The user's `docs/session_19.md` is the s73 transcript (Batch
AB delivered end-to-end and pushed as `3fb9b79`). This cycle's directive
re-pointed the doc chain at `session_19.md` with the standing rhythm
(audit recent changes → gate re-certification → sweep → evidence → docs →
push). The workspace had been reset AGAIN between cycles (fresh clone at
`61e593a`; `bea1b92`/`61e593a` are docs-only session-log commits), so the
cycle doubled as a from-scratch provisioning validation.

**Work log.**

1. **Workspace + infrastructure rebuilt from zero.** Fresh clone at
   `61e593a` (remote main == local HEAD, nothing to pull). Full
   provisioning: `bun install` (489 packages); `paramiko` 5.1.0 into the
   venv; `/home/z/ssh-infra/` restored (the shim copied from the repo's
   own `docs/ssh.sh` — the field-tested implementation now carried
   in-repo — with the shebang re-pointed at the paramiko venv python; the
   delegated ed25519 key materialized 0600; fingerprint verified
   `3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU`; auth preflight via
   `git ls-remote` green). `.env` = `DATABASE_URL="file:../db/custom.db"`
   + `AUTH_SECRET=""`; `db/` at repo root; schema pushed; seed
   (demo@studyflow.app) green; production build fresh.
2. **Playwright browser cache ALSO wiped this reset** — first e2e attempt
   failed every test in ~1–9 ms with `browserType.launch: Executable
   doesn't exist … chromium_headless_shell-1243`. `bunx playwright
   install chromium` restored the pinned build; the cold block then ran
   clean. (Provisioning checklist item, not a code lesson: on a reset,
   browsers go with the cache.)
3. **Audit of the recent code changes (the `3fb9b79` Batch AB bundle).**
   Two-axis review of the three view diffs against the s72 measured
   anatomy: Standards — unused `SectionCard`/`History`/`ListChecks`
   imports removed everywhere, the slide-in panel gated behind
   `aria-controls` only while mounted (aria-valid-attr-value stays clean
   at zero), role hooks (`gt-subject-avg`) per AP-117, `spacedExpression`
   documented against the engine's compact token stream; Spec — subtitle
   copy, panel anatomy (`2 + 3` / `= 5` / black Clear History), the
   free-standing Recent-Problems h2, and the per-subject card grid all
   byte-match the probe measurements. One display-phantom scare: the diff
   tooling showed `const istoryOpen, setHistoryOpen]` (a seemingly eaten
   `[h`), but `od -c` confirmed the file bytes are `const [historyOpen…`
   — lesson 10 re-confirmed, NO fix applied. No drift found; the commit
   is clean.
4. **Gates + full cold re-certification.** lint ✓ tsc ✓ unit **844/844**
   ✓ build fresh (`find src prisma -newer BUILD_ID` empty). AP-116 census
   re-derived per file: 1a = 57+43+12 (+1 setup) = **113**; 1b =
   28+18+14+15+20+6+7 (+1) = **109**; 1c = 41+5+3 (+1) = **50**; 2 =
   20+11+10+9+8 (+1) = **59**; 3 = 6+5+4+5+4+4+5+2+5+5+5+7 (+1) = **58**
   — byte-consistent with the session-73 map, 389 total, all 30 spec
   files exactly once. Cold run after `rm -f db/e2e.db` + stale-server
   kill: **389/389, zero failures, first pass on every chunk**.
5. **Evidence.** s74 sweep (`ref-resweep-s74.mjs`, the standing class
   re-tagged): **ok:true** — 9/9 invariants both hosts, brand tables
   byte-matched, mobile drawers green on both (the user-flagged surface;
   drawerOpened/barOk/brandOk all true). `capture-s74-populated.mjs`
   re-captured the Batch AB surfaces on the seeded demo account
   (`74-clone-gradetracker-populated.png` — the 4-card grid with the
   ramp math visible: 95→100%, 78→87%, 88→98%, 89→99%;
   `74-clone-mathsolver.png` — measured subtitle + free-standing h2;
   `74-clone-calculator-history-open.png` — the slide-in panel with the
   spaced `2 + 3` / bold `= 5` entry + black full-width Clear History).
   The `73-*` ref-side populated evidence from s72/s73 remains the
   measurement record.

**Stage summary.** HEAD = `61e593a` + this cycle's commit (s74 sweep +
capture scripts, 74-* screenshots, this worklog entry). Baselines
unchanged: e2e **389/389** (113+109+50+59+58, 30 spec files censused),
unit **844/844**, lint/tsc/build clean, s74 sweep ok:true. Zero source
changes this cycle — the re-certification found no drift and the audit
found no defects, which is itself the result: Batch AB is stable across
a from-scratch rebuild. Honest debt (standing): Batch R (RSC structural
perf — the clone's all-surface LCP GOOD vs the reference's mobile-login
POOR still supports deferring); the pre-existing sf-clock-date
dark-sweep artifact; the analytics dark-rendering titles (AP-113 class)
are documented, not fixable through the light-mode UI.

---

## Session 75 (continuation 26) — the 15th workspace reset; re-certification 389/389 + 844/844; the CWV re-audit strengthened the Batch R deferral; the populated S6-family probe measured Batch AC (pending), 2 new probe lessons (AP-118/119), zero source changes

**Context.** The user's `docs/session_20.md` is the s74 transcript. The
suggested next-cycle options: Batch R (deferred RSC perf) or the
gate+sweep rhythm. This cycle ran the rhythm AND added a new evidence
layer — the populated S6-family re-measure on the reference — which
surfaced the next drift layer (Batch AC) exactly as the s72 probe
surfaced Batch AB.

**Work log.**

1. **Workspace rebuilt from zero (15th reset).** Fresh clone at
   `ef0ed0a` (`f701a53` + the docs-only session_20 commit). Full
   provisioning: bun install, paramiko 5.1.0, `/home/z/ssh-infra/`
   restored (shim from the repo's own `docs/ssh.sh`, delegated key
   0600, fingerprint verified, ls-remote auth green), `.env`
   (`file:../db/custom.db` + empty `AUTH_SECRET`), db push + seed,
   build fresh, chromium-1243 restored (`bunx playwright install` —
   the browser cache does not survive resets; the first-run failure
   signature is `browserType.launch: Executable doesn't exist`).
2. **Audit of the recent changes:** `f701a53..ef0ed0a` is docs-only —
   the audited Batch AB state stands unchanged.
3. **Gates + full cold re-certification.** lint ✓ tsc ✓ unit
   **844/844** ✓ build fresh. AP-116 census re-derived per file (each
   chunk = chromium sum + 1 setup): **113+109+50+59+58 = 389/389**
   cold, zero failures, first pass on every chunk — baseline
   byte-matched again.
4. **s75 standing sweep** (`ref-resweep-s75.mjs`, the class re-tagged):
   **ok:true** — 9/9 invariants both hosts, brand tables byte-matched,
   mobile drawers green on both (the user-flagged surface).
5. **CWV re-audit** (`cwv-audit-s16.mjs`): the clone GOOD on every
   measured surface (dashboard mobile-throttled LCP 2308ms ≤ 2500,
   CLS 0; login mobile 1884ms; desktops sub-500ms); the reference
   login-mobile LCP **8032ms POOR**, dashboard-mobile LCP **4296ms**
   and **CLS 0.254 POOR**. The Batch R deferral (RSC structural perf)
   is re-validated on stronger evidence — the clone now outperforms
   the reference on every anchor.
6. **The populated S6-family probe (the cycle's new layer).** Five
   iterations against the live reference: v1 (UI drivers missed:
   calculator keypad, solver click+type — the s72 lessons held), v2
   (added dialog-closure verification; exposed the REAL blockers — the
   ref's date fields are popover pickers and the account has ZERO
   subjects so subject-bearing dialogs could not validate), v3 (the
   v1-proven Settings→Subjects chain first; discovered the event
   Start/End are `datetime-local` inputs → EVENT SUBMITTED), v4 (the
   pickers' day-15 was in the past — future day 28 + popover
   instrumentation; the picks registered but submits still failed), v5
   (AP-119: popovers are modal dialogs too — form-title-scoped
   locators + popover-close → ASSIGNMENT AND EXAM SUBMITS TRUE).
   Populated: Subject, Task (My Day quick-add), Event
   (datetime-local), Assignment (subject combobox + due-date picker),
   Exam (subject combobox + date picker). Notes: the New Note editor
   is an inline pane, never persisted — unmeasured positive case.
7. **RESIDUE ZERO — twice.** The v5 delta cleanup deleted 4 objects
   (Task/Subject/Assignment/Event, all 200). The cross-check against
   the measured UI (5 probe rows visible, 4 deletions) exposed the
   surviving exam (AP-118: `Exam` missing from the inherited candidate
   list); the follow-up cleanup deleted it (200) and re-verified ZERO
   across the extended list. The reference account is clean.
8. **Measurements → Batch AC (measured, PENDING).** 7 populated views
   dumped (widened leaf dump) + screenshotted on the ref, and the same
   7 captured on the seeded clone (`75-clone-populated-*.png`) for the
   apples-to-apples comparison. New drift layer (full table in
   remediation-plan): AC1 assignment due pill (ref INLINE+violet+"7
   days" vs clone own-line+blue+"Due in N days"), AC2 assignment
   subject chip + amber bell priority (clone: neither), AC3 exam date
   FULL format, AC4 exam subject chip, AC5 exam location
   end-to-end (`Exam.location` missing from schema/dialog/card — the
   S8 "no location row" pin's rationale was a data artifact), AC6
   topics-row conditionality, AC7 exam pill copy, AC8 task pill date
   form. Measured-and-matching recorded alongside (headers, pill
   placements that DO match, duration suffix, type pills, dashboard
   cards, calendar day-detail, My Day row).
9. **Docs.** remediation-plan: the Cycle-25 record + the Batch AC
   table + AP-118 (probe candidate completeness) + AP-119 (popover
   layering). No source changes this cycle — AC is documented for the
   next cycle's TDD implementation per the established
   probe→implement rhythm (the Batch AB pattern: probed s72,
   implemented s73).

**Stage summary.** HEAD = `ef0ed0a` + this cycle's commit (probe
scripts v1–v5 + the exam-residue cleanup + capture-s75-clone-populated
+ the s75 sweep + 75-* screenshots + docs + worklog). Baselines
unchanged: e2e **389/389**, unit **844/844**, lint/tsc/build clean,
s75 sweep ok:true. Batch AC is the next cycle's implementation work;
Batch R stays deferred (strengthened CWV evidence). The reference
remains UNCHANGED on every standing zero-state invariant; the
populated S6-family surfaces are now MEASURED territory with a
committed evidence trail.

## Session 76 (continuation 27) — the Batch AC re-measure + the populated-row drift layer fixed

**Context.** Ran on a RESET workspace (16th reset — fresh clone at
`77a4326` = Session-75 + the session_21 transcript, the directive for
this cycle). The directive: implement Batch AC TDD in the Batch AB
rhythm, starting with the `Exam.location` schema→dialog→card chain and
the assignment row anatomy; re-measure AC6/AC8 before pinning.

**Work log.**

1. **Workspace rebuilt from zero (16th reset).** Full provisioning:
   bun install (489 pkgs), `.env` (`file:../db/custom.db` + empty
   AUTH_SECRET), db push + seed, build, chromium-1243 restored
   (`bunx playwright install chromium`). Baseline re-certified BEFORE
   any change: lint ✓ tsc ✓ unit **844/844**; e2e cold across the
   re-derived 5-chunk map **389/389** (113+109+50+59+58). Two
   environment findings re-confirmed: a single-process FULL e2e run
   trips the register limiter by design (18 local-IP registrations vs
   the 10/IP/15-min budget — the chunked map exists precisely to
   re-boot the limiter per chunk; the run failures were the 8
   register-429s, not flaky specs), and the S12-B skip-link timeout
   was a one-off flake (green in every chunked run after).
2. **The s76 re-measure (the cycle's new evidence layer).** Four probe
   iterations against the live reference (login → populate through the
   ref's own UI → computed-style measure → residue-zero cleanup, the
   AP-118/119 protocol — `scripts/ref-ac-remeasure{,3,4}-s76.mjs`):
   settled BOTH S75 open questions and corrected THREE prose
   transcription errors in the S75 table — AC8's task pill is the
   DATE form for EVERY bucket ("Oct 20"/"Oct 22"/"Oct 28", calendar
   glyph, red today/past + slate future — no relative labels); AC6's
   topics positive case is the "Topics to study:" label + neutral-800
   chips (#262626/#fafafa, rounded-md); AC1's assignment due pill is
   BLUE (blue-50/blue-600 — the S75 "violet tint" was a misread);
   AC3's month is SHORT ("Wednesday, Oct 28, 2026", not "October");
   AC7's ≥2 bucket is the YELLOW family (yellow-100/yellow-700, not
   amber — Tailwind v4 lesson 12 re-hit); NEW: AC9 the exam title is
   text-lg 18px + the pill `px-2.5 py-1 font-semibold`; AC10 the seed
   ships type "worksheet" outside the assignmentSchema enum (editing
   "Problem set 6" 400s). The exam dialog anatomy fully measured
   (title/duration/LOCATION "e.g., Room 101, Hall A"/TOPICS "Add a
   topic..."/notes + subject/type combos + "Pick" popover). All probes
   cleaned to FINAL-RESIDUE: 0.
3. **Remediation plan written first** (docs/remediation-plan.md Cycle
   26): the corrected evidence table + the 10-item TDD todo list + the
   honest-deviations ledger (the ref's due-today slot reads "Tomorrow"
   [its own off-by-one] and its +1 slot reads "1 days" — the clone
   ships honest "Today" amber / "Tomorrow" blue in the same tint
   slots, per the superset-not-clone-of-quirks doctrine).
4. **Batch AC implemented TDD.** RED first: 3 unit pins
   (examSchema.location default+bound; "worksheet" enum;
   formatDueDateShort month-short+day) + 10 e2e pins (S8-AC blocks)
   — the e2e pins ran 10/10 RED against the pre-change standalone
   build. GREEN source: `prisma/schema.prisma` `Exam.location String?`
   (+ db push, + one seeded location on "Physics Final" so the 📍 row
   renders while the FIRST card keeps none — the amended S8 pin stays
   valid); validation examSchema.location + the worksheet enum;
   `formatDueDateShort` in date.ts; `SubjectTagChip` (the accent-aware
   `sf-subject-chip` utility — 8% tint/19% border/strength text via
   the raw-triplet pattern); `DuePill` withIcon; the assignment row
   rebuilt (inline "N days" blue pill on the title line, meta row =
   chip + bell priority yellow-50 + slate type, dialog Subject
   select); the exam card rebuilt (text-lg title, full weekday date,
   slate-500 "· N min" suffix, 📍 row, topics chip block, "N days"
   yellow urgency); the task pill's date form; the seed location.
5. **Three post-GREEN repairs, each caught by a standing gate:**
   (a) the axe sweep flagged the chip's violet-500-on-tint text
   (3.9:1) and the "· N min" slate-400 (2.56:1) — both fixed with the
   documented one-step-darker text precedent (violet-600 / slate-500),
   pins updated with the deviation comments; (b) TWO v4 lab()
   serialization gaps closed by pinning yellow-50/yellow-950 +
   neutral-50/100/700/800 (trap 10 — unpinned palette classes read
   back lab()); (c) the S8-U3 row-count pin was a pre-existing AP-96
   flake (bare count after a pre-paint-satisfiable gate) — hardened
   with wait-for-row-first.
6. **Full cold re-certification.** lint ✓ tsc ✓ unit **847/847** ✓
   build REAL_EXIT=0 fresh. AP-116 census re-derived (parity-session8
   43→53 chromium with the 10 S8-AC pins; all 30 spec files exactly
   once): **123+109+50+59+58 = 399/399** cold, zero failures, first
   pass on every chunk.
7. **The s76 sweep** (`ref-resweep-s76.mjs`, the standing class
   re-tagged): **ok:true** — 9/9 invariants both hosts, brand tables
   byte-matched, mobile drawers green on BOTH (drawerOpened/barOk/
   brandOk all true — the user-flagged surface; no Tailwind v4
   mobile-nav bug, traps 4/7/9 verified live yet again).
8. **Evidence.** Dev-server screenshots captured on :3000
   (`76-clone-{dashboard,assignments,exams,tasks}.png`, the exam
   dialog with the Location field, `76-clone-mobile-{dashboard,drawer,
   assignments}.png` at 390×844) + the ref probe pairs
   (`76-ref-*.png`) + the sweep's clone set — VLM-verified: the
   inline pills, chips with dots, bell priorities, "Wednesday, Oct N,
   2026" dates, the location row, the topics chips, the mobile drawer
   all render as measured.
9. **Docs.** README (badge 1246, counts 847/399, S74/S75 rows
   backfilled + the S76 row); AGENTS/CLAUDE counts; remediation-plan
   header refreshed + Batch AC → DONE + the Cycle-26 execution record;
   this entry. `.env.example` verified current (the DATABASE_URL/
   AUTH_SECRET/NEXT_PUBLIC_SITE_URL contract unchanged).

**Stage summary.** HEAD = `77a4326` + this cycle's commit (Batch AC
source + pins + probes + sweep + screenshots + docs + worklog).
Baselines: e2e **399/399** (123+109+50+59+58, 30 spec files censused),
unit **847/847**, lint/tsc clean, build fresh, s76 sweep ok:true.
Batch AC DONE. Standing debt unchanged: Batch R (RSC structural perf —
deferred on the strengthened S75 CWV evidence); the pre-existing
sf-clock-date dark-sweep artifact (recorded for a future audit-tools
cycle).

## Session 77 (continuation 28) — the Batch AD probe + the Notes inline editor + the Flashcards study mode

**Context.** Ran on a RESET workspace (17th reset — fresh clone at
`08b2986` = Session-76 + the session_22 transcript, the directive for
this cycle). The directive: the standing rhythm + the two remaining
unmeasured populated surfaces (the S76 record's suggested next steps) —
the Notes inline editor and the Flashcards study mode.

**Work log.**

1. **Workspace rebuilt from zero (17th reset).** Full provisioning: bun
   install (489 pkgs), `.env` (`file:../db/custom.db` + empty
   AUTH_SECRET), db push + seed, chromium-1243 restored, build. Baseline
   re-certified BEFORE any change: lint ✓ tsc ✓ unit **847/847**; e2e
   cold across the documented 5-chunk map **399/399** (123+109+50+59+58,
   first pass every chunk — the earlier single nohup `bun install` died
   silently; the foreground re-run was clean).
2. **The Batch AD probe (the cycle's new evidence layer).** Seven probe
   iterations against the live reference (login → drive the ref's own UI
   → computed-style measure → residue-zero cleanup, the AP-118/119
   protocol): v1 recon (entity discovery: Notebook/Note/FlashcardDeck/
   Flashcard exist; the orphan Flashcard pre-existing, untouched) + the
   first editor dump; v2 the editor-chain walk (the white rounded-2xl
   card + the Quill snow structure + the Font/tag rows) — VLM
   cross-checks exposed the ref's invisible-typed-text bug (white
   rgb(250,250,250) on white — confirmed at the `<p>` level in v3);
   v3 the SAVE FLOW (title + body + bold → the entity persists content
   as HTML `"<p><strong>…</strong></p>"` — the toolbar is FUNCTIONAL);
   v4 the tag flow (Add tag → Enter → `tags:["probe-tag"]`, editor pill
   neutral-800/neutral-50 radius-6 12px; the list pill white-on-slate =
   another invisible quirk; "Attach File" NOT in the DOM — a VLM
   hallucination, corrected); v5-v7 the flashcards flow (Create Deck
   dialog anatomy → select deck → Add Flashcard dialog (2 textareas +
   difficulty) → Study → the study surface measured: IN-PAGE (no
   overlay), black Exit Study, "1 / 2" slate-500 counter, the
   gradient front + white 24px/500 text, the white 2px-violet-200 back
   + 20px/400 slate-700 text, "Click card to flip" hint, the Wrong
   (neutral-950/red-600) / Correct (green-500) rating pair, no
   completion screen; the card grid rows + yellow-100/yellow-700
   difficulty pill + the deck sidebar button anatomy). Every run
   cleaned to FINAL-RESIDUE: 0.
3. **Remediation plan written first** (docs/remediation-plan.md Cycle
   27): the AD1-AD12 measured table + the 10-item TDD todo + the honest
   deviations ledger.
4. **Batch AD implemented TDD.** RED first: 7 unit pins
   (`stripHtmlPreview` in the new src/lib/text.ts — the module did not
   exist) + 10 e2e pins (the S7-AD blocks in parity-session7: Notes
   editor ×7, study mode ×3) — **10/10 RED** against the pre-change
   standalone build. GREEN source: `quill@2.0.3` (the ref's own engine)
   behind a new `QuillEditor` client wrapper (dynamic import, the
   measured 20-control snow toolbar, a custom `hr` blot, debounced
   autosave, aria-labeled toolbar buttons); the notes editor chrome
   (14px/700 title, Font row + black Divider button, tag authoring row
   on the already-modeled Note.tags, gradient Save + autosave superset);
   the list-row rework (violet-50/2px violet-200/p-3, 16px/600 title,
   HTML-stripped 12px preview, readable tag pill, no notebook/date
   line); the flashcards study rework (in-page, black Exit Study, "N / M"
   counter, max-w-2xl, 24px/500 front + 20px/400 back, the flip hint,
   the Wrong/Correct rating replacing Prev/Next — Correct marks
   mastered). neutral-950 pinned (the v4 lab() trap 10).
5. **Three post-GREEN repairs, each caught by a standing gate:**
   (a) the axe sweep flagged the h1→h3 heading-order skip in the new
   list rows — shipped the a11y-clean H2 with the ref's identical
   computed styling (the ref's own H3 laxity, documented); (b) Quill's
   snow stylesheet out-cascaded the bare `.ql-editor` pad-24 override —
   scoped under `.sf-note-editor`; (c) pin calibrations (the
   transition-race border alpha → settle-then-measure; the max-w-2xl
   assertion → the button's computed maxWidth).
6. **Full cold re-certification.** lint ✓ tsc ✓ unit **854/854** ✓
   build REAL_EXIT=0 fresh. AP-116 census re-derived (parity-session7
   grew 19→29 chromium): **123+119+50+59+58 = 409/409** cold, zero
   failures, first pass every chunk.
7. **The s77 sweep** (ref-resweep-s77.mjs, the standing class
   re-tagged): **ok:true** — 9/9 invariants both hosts, brand tables
   byte-matched, mobile drawers green on BOTH (drawerOpened/barOk/
   brandOk all true — the user-flagged surface; no Tailwind v4
   mobile-nav bug, traps 4/7/9 verified live yet again).
8. **Evidence.** Dev-server screenshots captured on :3000
   (`77-clone-{notes-editor,notes-tagged,flashcards-deck,flashcards-
   study,flashcards-rating,mobile-notes,mobile-flashcards}.png`) + the
   sweep's set + the probe pairs (`77-ref-*.png`) — VLM-verified: the
   Quill toolbar renders in the white rounded card, the Font/tag rows,
   the gradient Save, the readable dark note content, the in-page study
   mode with the rating pair all render as measured.
9. **Docs.** README (badge 1263, counts 854/409, the feature-table
   rows, the S77 session row); AGENTS/CLAUDE counts; remediation-plan
   header + the Cycle-27 execution record; this entry; the
   docs/session_23.md transcript. `.env.example` verified current (the
   DATABASE_URL/AUTH_SECRET/NEXT_PUBLIC_SITE_URL contract unchanged —
   quill is a bundled dependency, no env surface).

**Stage summary.** HEAD = `08b2986` + this cycle's commit (Batch AD
source + pins + probes + sweep + screenshots + docs + worklog).
Baselines: e2e **409/409** (123+119+50+59+58, 30 spec files censused),
unit **854/854**, lint/tsc clean, build fresh, s77 sweep ok:true.
Batch AD DONE. Standing debt unchanged: Batch R (RSC structural perf —
deferred on the strengthened S75 CWV evidence); the pre-existing
sf-clock-date dark-sweep artifact (recorded for a future audit-tools
cycle).

## Session 78 (continuation 29) — the Batch AD post-audit hardening + the mobile two-pane parity fix (Batch AE)

**Context.** Ran on a RESET workspace (19th reset — fresh clone at
`d9b289e` = Session-77 + the session_23/session_24 transcripts, this
cycle's directive). The directive: the standing rhythm — baseline
re-certification, the Batch AD diff audit, the reference parity re-check
(agent-browser + the sweep), the mobile navigation menu verification,
and the Tailwind v4 watch.

**Work log.**

1. **Workspace rebuilt from zero.** Full provisioning: bun install
   (497 pkgs), `.env` (`file:../db/custom.db` + empty AUTH_SECRET — the
   documented dev posture), db push + seed, chromium-1243 restored,
   build. Baseline re-certified BEFORE any change: lint ✓ tsc ✓ unit
   **854/854**; e2e cold across the documented 5-chunk map **409/409**
   (123+119+50+59+58, first pass every chunk).
2. **The Batch AD code audit (Mode C).** Security/XSS clean (no
   dangerouslySetInnerHTML of note content; Quill 2.0.3 sanitizes link
   protocols; previews React-escaped), React-clean (no
   set-state-in-effect; StrictMode-safe), conventions clean (all v4
   traps respected). Findings: 2 Medium (the saveNow empty-overwrite
   window — `getContent()` returned `""` during the dynamic-import
   window so Save PATCHed `content:""` over a populated note; the
   silent autosave `.catch(() => {})` swallow), 4 Low, 7 Informational.
3. **The parity evidence layers.** The s78 reference re-sweep
   (`scripts/ref-resweep-s78.mjs`, the s77 class re-tagged): **ok:true**
   — 9/9 invariants both hosts, brand tables byte-matched, **mobile
   drawers green on BOTH** (the user-flagged surface; no Tailwind v4
   mobile-nav bug, traps 4/7/9 verified live yet again). An
   agent-browser walkthrough of the clone (login → dashboard → drawer
   open/navigate/close → the Quill editor → the study flip/rating flow;
   zero console errors). A VLM pairwise pass raised two hypotheses —
   both DISPROVEN by DOM probes (the "stat-card decorative circles"
   claim: identical child structure both hosts; the "Grade Tracker
   missing" claim: 20/20 labels byte-matched) — the AP-115 doctrine
   (DOM probes are the authority) applied.
4. **The mobile two-pane discovery (the cycle's headline).** A targeted
   probe measured the reference at 390×844: the ref renders the Notes
   list pane (w-80 @320px + a 14px right sliver, its own 416px overflow)
   and the Flashcards deck list (239px + 112px) — the CLONE hid both
   asides below md, so a 390px user could not browse or select existing
   notes/decks at all (a functional SUBSET of the reference). Tasks
   correctly matches the ref's single-pane mobile shape; StudyGroups
   already rendered its list.
5. **The standing mobile sweep re-run surfaced five MORE overflow
   findings** (audit-tools rot — the sweep had not been re-run since the
   header rows grew): Timetable 402 / Exams 584 / Files 499 / Calculator
   427 / StudyGroups 393 — element-attributed by a new probe (the
   nowrap header rows + the StudyGroups shrink-0/min-w-0 starvation);
   the ref itself overflows on Timetable (395) + Calculator (429) — its
   own bug family — while Exams/Files/StudyGroups are clone-only gaps.
6. **Remediation plan written first** (docs/remediation-plan.md Cycle
   28): the AE1-AE13 measured table + the 7-item TDD todo + the honest
   deviations ledger.
7. **Batch AE implemented TDD.** RED first: 5 unit pins
   (`stripHtmlPreview` entity/surrogate hardening) + 7 e2e pins (the
   AE6 mobile two-pane pair, the AE9-13 five-view overflow guard, the
   AE1 save-race pin with the route-delayed quill chunk, the AE2
   autosave-failure toast, the AE4 study-index reset, the AE3 dark
   placeholder) — **7/7 RED** against the pre-change build. GREEN:
   the asides render at ALL widths (≥md byte-identical by construction),
   `getContent(): string | null`, the toast-once-per-streak autosave,
   the `switchDeck` reset, the dark placeholder rule, the entity-cap
   hardening, the five overflow fixes (flex-wrap / scrollable tabs /
   the ref's own shrinkable StudyGroups negotiation), and AE8
   (`createNote` returns the created id — the never-selected-note
   papercut the AE3 pin surfaced live). Two pin calibrations (the
   deck-order-agnostic heading; the exact:true menuitem) + one
   audit-tools repair (the capture script's rotted login selectors).
8. **Full cold re-certification.** lint ✓ tsc ✓ unit **859/859** ✓
   build REAL_EXIT=0 fresh; cold e2e **416/416** (126+122+50+60+58,
   first pass every chunk); the mobile sweep re-run: **findings []** —
   all 20 views ≤ 390; the s78 resweep re-run: ok:true.
9. **Evidence + docs.** The standard 31 refreshed
   (`capture-studyflow.mjs`) + the S78 evidence set
   (`capture-s78-clone.mjs`: the mobile two-pane surfaces, the
   overflow-fixed five, the hardened editor + study mode — VLM-verified);
   README (badge 1275, counts 859/416, the S78 session row);
   AGENTS/CLAUDE counts; the remediation-plan Cycle 28 record; this
   entry; the `docs/session_25.md` transcript. `.env.example` verified
   current (no env surface changed this cycle).

**Stage summary.** HEAD = `d9b289e` + this cycle's commit (Batch AE
source + pins + probes + sweeps + screenshots + docs + worklog).
Baselines: e2e **416/416** (126+122+50+60+58, 30 spec files censused),
unit **859/859**, lint/tsc clean, build fresh, mobile sweep findings [],
s78 resweep ok:true. Batch AE DONE. Standing debt unchanged: Batch R
(RSC structural perf — deferred on the S75 CWV evidence); the
pre-existing sf-clock-date dark-sweep artifact (a future audit-tools
cycle).

## Session 79 (continuation 30) — the study-mode full-replacement parity fix + the mid-band/landscape sweep layer + the standing-artifact closure (Batch AF)

The 20th workspace reset (a scaffold repo only) — cloned fresh at
`6a7245e` (Session-78/Batch AE + the session_25/session_26 transcripts,
this cycle's directive). Provisioned per the documented order (bun
install 497 pkgs, `.env` at the dev posture `DATABASE_URL="file:../db/custom.db"`
with the repo-root `db/`, db push + seed, chromium-1243 restored, build)
while the operational docs were absorbed (AGENTS/CLAUDE for the gates
and doctrines, README/PAD/SKILL for the inventory, the session_25/26
transcripts + remediation-plan + worklog for the cycle shape,
skills-catalog for the tooling — the `skills/` folder excluded from
checking/testing/compilation per the standing contract).

1. **Baseline re-certified cold, first.** lint ✓, tsc ✓, unit
   **859/859**, build REAL_EXIT=0, cold e2e **416/416**
   (126+122+50+60+58, first pass every chunk) — the received state
   verified clean against the documented baseline.

2. **Two evidence layers before any source change.** (a) A Mode-C
   audit of the Batch AE diff (`2cce898..38510aa`, delegated deep-read):
   0 Critical / 0 High / 2 Medium / 5 Low / 4 Informational — the two
   Medium: the surrogate-cap unit pins are non-discriminating (a
   regression to a bare UTF-16 slice would pass the suite) and the
   autosave streak flag latches across note switches (note B's first
   failure is silently swallowed). (b) The parity layers: the s79
   reference re-sweep (the s78 class re-tagged) — **ok:true**, 9/9
   invariants both hosts, brand tables byte-matched, mobile drawers
   green on both (the user-flagged surface; no Tailwind v4 mobile-nav
   bug, traps verified live yet again); an agent-browser walkthrough
   (login → dashboard → the drawer open/navigate/close cycle → Notes →
   Flashcards — zero console errors, zero page errors); the standing
   rhythm re-run: mobile sweep findings [], **the mid-band (768×1024)
   and landscape (844×390) sweeps re-run for the first time since the
   AE overflow family — both flagged the SAME single finding** (the
   Tasks aside's scaffold `<h2>Lists</h2>`: the ref renders NO heading
   there, measured), and the dark sweep showed the standing
   `sf-clock-date` artifact live on all 20 views (violet-950 @1.78:1).

3. **The headline discovery (AF1).** A directed reference probe (the
   ref account's decks were since reset — a probe deck + card created
   to re-measure the populated state) found the ref's Flashcards study
   mode is a **FULL VIEW REPLACEMENT at both viewports**: desktop
   innerText during study is exactly "Exit Study 1 / 1 [card] Click
   card to flip" (no h1, no deck list, no search), the study column
   (`w-full max-w-2xl`) centers in the content area (Exit x=434 @1280,
   counter x=1070 on the same justify-between row), and at 390×844 the
   study pane renders FULL WIDTH (Exit x=16, scrollWidth 390, deck list
   absent) — mobile study is clean and usable on the reference. The
   clone rendered the study pane INSIDE the two-pane right pane: at 390
   the Study button sat clipped at x=360..432 (an agent-browser tap
   silently missed) and the study chrome was unusable — **a mobile
   functional subset of the reference's working study surface.**

4. **The second discovery (AF2/AF2b).** The clone's Tasks aside
   rendered an extra `<h2>Lists</h2>` (original scaffold, survived every
   parity batch — the mid-band sweep is the only standing probe that
   reads the first visible heading through the band). Removing it
   UNMASKED a pre-existing collapse: at 768 the Tasks h1's `sm:min-w-0`
   flex container collapsed to width 0 when the actions row consumed
   the full line (invisible heading; previously hidden behind the
   "Lists" h2). Fixed by dropping `sm:min-w-0` — the header wraps (the
   ref's own shape; the ref itself overflows to 826 there, its own bug
   family), the h1 stays visible through the band, desktop
   byte-identical.

5. **The third discovery (AF5).** The `sf-clock-date` standing artifact
   root-caused: the utility's `.dark &` rule resolved
   `--sf-primary-soft-dark` = violet-950 for the sidebar clock date
   (1.78:1, unreadable on all 20 views). The theme system's own token
   comments name strong/strongDark as the clock-date pair; the ref's
   dark mode is its own half-broken family (its sidebar stays fully
   light-themed — measured through its own Settings Theme→Dark), so the
   clone's full dark theme remains the documented superset and the fix
   is a readability correction: the date moves to the accent-aware
   `--sf-primary-avatar-from` (400) — one step dimmer than the time's
   300, mirroring light's 700/600 hierarchy, ~5.8:1.

6. **Remediation plan written first** (docs/remediation-plan.md Cycle
   29: the AF1-AF7 measured table + the TDD todo + the honest-deviations
   ledger, including the AF7 recalibration recorded when the planned
   flex negotiation could not engage — the right pane's overflow-y-auto
   collapses the CSS automatic min-size, and the aside's own content
   floor exceeds any useful detail floor at 390).

7. **Batch AF implemented TDD.** RED first: 2 unit pins + 6 e2e pin
   behaviors — **6/6 RED** against the pre-change build. GREEN: the
   study pane replaces the whole view when studying (the studyDeckId
   guard kills the s78 audit's F3 deck-deletion latch structurally;
   `selectDeck` lands every selection in deck-detail from card 1); the
   below-md in-row Study affordance keeps the mobile entry one tap away
   (the ref's own mobile deck-detail is its 451/836px overflow family);
   the Tasks h2 removed + the h1 collapse fixed; the autosave streak
   flag resets on selection change (+ the note-agnostic wording, + the
   FAB comment); the discriminating surrogate-cap pin + the `&copy;`
   deviation pin; the dark clock date reads violet-400. Three pin
   calibrations out of the GREEN runs (the row-tap targets the h2; the
   exact:true row-button locator; the AD10 max-w-2xl read site).

8. **Full cold re-certification.** lint ✓ tsc ✓ unit **861/861** ✓
   build REAL_EXIT=0 fresh; cold e2e **421/421** (127+124+50+62+58,
   first pass every chunk; the census re-derived per-file); mobile,
   mid-band, and landscape sweeps: **findings [] each**; the dark sweep:
   **the sf-clock-date artifact CLEARED** (0 of 20 views); the s79
   resweep: **ok:true**.

9. **Evidence + docs.** The standard 31 refreshed + the S79 evidence
   set (`capture-s79-clone.mjs`: the mobile study flow, the desktop
   full-replacement study, the Tasks 768 aside, the dark clock chip) +
   the reference probe set (the AF1 measurement basis); README (badge
   1282, counts 861/421, the S79 session row); AGENTS/CLAUDE counts;
   the remediation-plan Cycle 29 execution record; this entry; the
   `docs/session_27.md` transcript. `.env.example` verified current
   (no env surface changed this cycle).

**Stage summary.** HEAD = `6a7245e` + this cycle's commit (Batch AF
source + pins + probes + sweeps + screenshots + docs + worklog).
Baselines: e2e **421/421** (127+124+50+62+58, 30 spec files censused),
unit **861/861**, lint/tsc clean, build fresh, mobile + mid-band +
landscape sweeps findings [], dark sweep artifact-free, s79 resweep
ok:true. Batch AF DONE. Standing debt reduced to ONE item: Batch R (RSC
structural perf — deferred on the S75 CWV evidence).

## Session 80 (continuation 31) — the dark-canvas flashbulb family + the Batch AF post-audit hardening (Batch AG)

**Context.** 21st workspace reset; cloned fresh at `23501d8`
(Session-79/Batch AF + the session_27/session_28 transcripts).
Provisioned per the documented order (bun 497 pkgs, `.env` dev posture
`DATABASE_URL="file:../db/custom.db"` + empty AUTH_SECRET, db push +
seed, chromium-1243 re-provisioned — the reset wiped
`~/.cache/ms-playwright/chromium_headless_shell-1243` and every
chromium test failed `browserType.launch` until
`bunx playwright install chromium`, build). Baseline re-certified COLD
first: lint ✓ tsc ✓ unit 861/861, build REAL_EXIT=0, cold e2e 421/421
(127+124+50+62+58, first pass every chunk).

**Work log.**

1. Two evidence layers before any source change: (a) the Mode-C audit
   of the Batch AF diff (`6a7245e..ed89609`) — 0 Critical / 0 High /
   2 Medium / 7 Low / 4 Informational (M1 the AF3 streak-reset racing
   an in-flight autosave from the PREVIOUS note; M2 the AF2b 768px
   Tasks-h1 fix with NO e2e pin); (b) the s80 reference re-sweep (the
   s79 class re-tagged) — ok:true, 9/9 invariants both hosts, brand
   tables byte-matched, mobile drawers green on BOTH (the
   user-flagged surface; no Tailwind v4 mobile-nav bug).
2. The standing rhythm: mobile + mid-band + landscape sweeps findings
   []. The dark sweep: **7 standing flashbulb findings** — the
   detector's `green: hits === 0` classifier says the received state's
   dark canvas was never clean through the AE/AF certifications (the
   S79 narrative recorded only the *unreadable* family). Root-caused
   each surface against the LIVE reference measured in dark mode
   through its own Settings UI (the ref's Light control is a measured
   no-op in the Light-from-dark direction — cold fresh-context logins
   render dark, the account is stuck): the ref does NOT re-theme the
   More Options button or the Calculator History toggle (both stay
   neutral-950 + light text — the clone's s69/s72-era "invert the
   ramp" inversions were drift); its Clear key is near-black + red-600
   inside its own white-digit keypad family; its Tasks aside KEEPS the
   violet-50 light pill (its own half-broken family — the clone's full
   dark theme re-themes per the AF5 clock precedent).
3. Wrote the Cycle-30 (Batch AG) plan into docs/remediation-plan.md
   BEFORE any source change (AG1-AG12 measured table + TDD todo +
   deferred-with-rationale ledger).
4. TDD, RED first: 7 mutation-target pins **7/7 RED** against the
   pre-change build (AG1-AG5 dark computed-style pins, AG6's
   note-switch ordering pin — its first draft taught the toast-retry
   trap: a `toHaveCount(0)` retries past the 5s auto-dismiss and hides
   the symptom; the executed pin reads the count instantly — AG9's
   region pin). GREEN source: the neutral variant + both Calculator
   History buttons match the ref's measured dark; the AC key + the
   GradeTracker score pills take the house dark-pill family (FIVE
   palette steps newly pinned in `@theme` — the AG3 first draft hit
   trap 10: `bg-red-950` serialized as lab() until pinned; the AG4
   first draft hit the SubjectChip locator collision); the Tasks aside
   active row moved from the inline style to the new `sf-aside-active`
   utility (light byte-identical — S6-A pins green; dark = the
   sf-today-tint token pair); the autosave streak scoped to the note
   (`selectedIdRef`; late rejections from departed notes ignored;
   successful Save resets the streak); `role="region"` on the study
   wrapper; keydown stopPropagation on the in-row Study affordance.
   Guards: AG7 mutation-proven (re-add `sm:min-w-0` → the pin fails
   "Expected: visible, Received: hidden" → reverted), AG10/AG11
   hardening pins green-verified.
5. Full cold re-certification: lint ✓ tsc ✓ unit **861/861** ✓ build
   fresh; cold e2e **431/431** (127+127+50+69+58, first pass every
   chunk; census re-derived: dark-mode 13→20, parity-session7 32→34,
   parity-session6 16→17); the dark sweep re-run: **findings 0/20
   views — the first clean dark canvas in the sweep's history**; the
   dark-mobile sweep ok; mobile + mid-band + landscape sweeps findings
   []; the s80 resweep re-run after the final build: **ok:true**.
   Environment lesson re-earned mid-verification: the resweep failures
   were a POISONED :3200 standalone (the port-owner survived a
   name-pattern kill; EADDRINUSE killed the new spawn; the old server
   served the half-replaced build's chunks as 500s) — kill by
   PORT-OWNER PID (`ss -tlnp`), never by process-name grep.
6. Evidence: `80-ref-dark-*` anchors (myday/calculator/tasks/settings
   + mobile), `80-clone-dark-*-before/after` pairs, the standard 31
   refreshed, `80-clone-mobile-*` + the resweep sweep set; agent-browser
   walkthroughs of BOTH hosts (the ref's mobile drawer navigation
   round-trip + the clone's — 20 links, drawer closes on navigate,
   scrollWidth 390 vs the ref's own 429 overflow family).
7. Docs chain: README (badge 1292, counts 861/431, the S80 session
   row), AGENTS/CLAUDE counts, the remediation-plan Cycle-30 record +
   header, vitest.config.ts stale-header fix (834 → 861), the
   flashcards-view header + the AF2b comment + the theme.ts
   avatarFrom cross-consumer note (AG12); `.env.example` verified
   current (no env surface changed this cycle).

**Stage summary.** HEAD = `23501d8` + this cycle's commit (Batch AG
source + pins + sweeps + screenshots + docs + worklog). Baselines:
e2e **431/431** (127+127+50+69+58, 30 spec files censused), unit
**861/861**, lint/tsc clean, build fresh, **dark sweep findings 0/20
(first clean dark canvas)**, dark-mobile sweep ok, mobile + mid-band +
landscape sweeps findings [], s80 resweep ok:true. Batch AG DONE.
Standing debt unchanged: Batch R (RSC structural perf — deferred on
the S75 CWV evidence); documented deferrals: the s80 audit's L1/L4 +
I2's dedicated text token.

## Session 81 (continuation 32) — the departed-settlement family + the standing-suite orchestrator seam + the Zod4 partial-defaults data-loss fix + the audit-tools rot repair (Batch AH)

**The cycle (Cycle 31).** The received state: `8ea4642` (Session-80 /
Batch AG). The 23rd workspace reset wiped the uncommitted first attempt
at this cycle mid-flight (twice — the interrupted session's log was the
blueprint; the work was redone from scratch on a fresh clone).

1. Environment re-provisioned (bun 497 pkgs, `.env`
   DATABASE_URL="file:../db/custom.db" with the db/ at the repo root —
   the Prisma CLI's first push landed one level high and was moved to
   the documented schema-anchored location; chromium-1243
   re-provisioned after the reset wiped it). Baseline re-certified
   COLD: lint ✓ tsc ✓ unit **861/861**, build green, cold e2e
   **431/431** (127+127+50+69+58, first pass every chunk).
2. Evidence layers: the Mode-C audit of the Batch AG diff (0 Critical /
   0 High / **1 Medium** — M1: the selection-mirror invariant enforced
   only by a comment; `removeNote` never settles `selectedIdRef`, so a
   deleted note's late PATCH rejection passes the AG6 guard, toasts
   the "still open" lie and re-latches the streak flag — verified in
   source against the QuillEditor unmount-flush path); the s81
   reference re-sweep (ok:true, 9/9 invariants both hosts, mobile
   drawers green on both); agent-browser mobile-nav verification on
   BOTH hosts (ref 20 links / navigates / closes / its own 416
   overflow; clone 20 links / scrollWidth 390 — no Tailwind v4
   mobile-nav bug).
3. The Cycle-31 plan written into docs/remediation-plan.md BEFORE any
   source change (AH1–AH7 + the mid-cycle amendments AH8/AH9–AH13
   recorded as they were discovered). TDD: 8 mutation-target e2e pins +
   3 data-loss pins RED at their designed assertions (incl. AH3b's
   exact trap-10 `lab(90.2247 -31.039 9.47084)`), 5 hardening pins +
   2 AH7 unit pins (one RED, the truncated-LOUD guard green-on-arrival).
   GREEN: the mirror-settlement effect, the saveNow guards on BOTH
   settle branches, the flashcards row target check, the emerald-200
   @theme pin, the preflight stderr line + the parser's trailing-prose
   tolerance, the AH8 factory fix, the AH9 data-accent restoration, the
   AH13 files-list metadata strip. Two mutation proofs run (the
   emerald-200 un-pin; the row target-check removal).
4. **The CRITICAL mid-cycle find (AH8)**: zod@4's `.partial()` does not
   suppress create-time `.default()` — every partial PATCH on every
   owned entity reset every defaulted field (a title keystroke wiped
   the note's content AND tags; every autosave wiped the tags; a task
   toggle wiped notes/subtasks/priority) — invisible to every prior
   certification through chunk isolation + file order. Fixed at
   `makeOwnedDelegate.update` (keep only the sent keys — one site
   covers all sixteen delegates). The lesson pair is in AGENTS.md's
   new lessons section.
5. **The audit-tools rot repair (AH9–AH13 + the checker fallback)**:
   the orchestrator's first end-to-end attempt surfaced four latent
   rot families (data-accent dropped from both theme application
   sites; 8 stage audits' racy pre-auth login waits; the register-409
   expectation rot; the dead `pinned` seeding field) plus the
   AI/connectivity/upload probes' rotted DOM contracts (the `<Input>`
   composer, the div transcript bubbles, the Toaster's button items,
   the dual chat+messages mocks, the amber role=status connectivity
   pill) plus the files-list base64 leak (AH13, RED-pinned and fixed
   with a select) plus the light-family checker's transparent-body
   fallback bug (parse() returns a truthy {0,0,0,a:0} — the white
   fallback never fired and glass-backed text measured against phantom
   black; fixed across all 13 checker embeddings).
6. Full cold re-certification: lint ✓ tsc ✓ unit **863/863** ✓ build
   fresh; cold e2e **444/444** (127+135+51+73+58, first pass every
   chunk; the S12-B focus-poll ceiling bumped to 15s). The standing
   suite: the orchestrator's stage-0 preflight parse PASSES (the AH7
   integration proof — the suite had never been runnable), and its
   live run took stages 0–12 green in sequence; the remaining stages
   verified individually (accent-light, dark, the 8-sweep volume
   family, the landscape-seed sweep, the desktop/midband/landscape
   accent sweeps, cwv ×2, ai-error, ai-a11y, pre15, dep-audit — all
   findings []/exit 0). The 23rd-reset environment reaps long-lived
   daemons, so the 17-minute accent-dark sweep and a single-process
   full orchestration cannot complete — recorded honestly (its
   dark-family siblings all ran green with the same checker).
7. Docs chain: README (badge 1307, counts 863/444, the S81 session
   row), AGENTS/CLAUDE counts + the S81 lessons section,
   vitest.config.ts header, the remediation-plan Cycle-31 plan +
   execution record + header, this worklog, docs/session_32.md.
   Evidence: the resweep set `81-{ref|clone}-*.png` (23 captures) +
   the AH surface captures (`81-clone-ah*.png`). `.env.example`
   verified current (no env surface changed this cycle).

**Stage summary.** Batch AH DONE: the departed-settlement family
(AH1/AH2), the flashcards keyboard guard (AH6), the emerald-200 pin
(AH3), the orchestrator seam (AH7), the Zod4 partial-defaults
data-loss fix (AH8), the audit-tools rot repair (AH9–AH13 + the
checker fallback), the files-list payload fix (AH13). Baselines: e2e
**444/444**, unit **863/863**, lint/tsc/build clean, s81 resweep
ok:true, mobile nav verified on both hosts. Standing debt unchanged:
Batch R + the documented deferrals.

## Session 82 (continuation 34) — the sixteenth delegate + the settlement self-heal + the parser single-line seam (Batch AI)

**The cycle (Cycle 32).** The received state: `b7c662f` (Batch AH
`7144e71` + the operator's session-log commit adding
`docs/session_33.md`). The 24th workspace reset wiped the workspace
(chromium-1243 re-provisioned — the standing gotcha); the repo
re-cloned clean.

1. **Baseline re-certified cold**: lint ✓ tsc ✓ unit 863/863, build
   green, cold e2e 444/444 first-pass every chunk (127+135+51+73+58).
2. **Three evidence layers** (before any source change): a Mode-C
   audit of the Batch AH diff — 0 Critical / **1 High** / 0 Medium /
   4 Low / 2 Info. The High (**H1/AI1**): the AH8 sent-keys filter
   lived ONLY in `makeOwnedDelegate.update` — the sixteenth,
   hand-written `flashcardCardDelegate` (Flashcard carries no userId;
   ownership rides the deck join) still wrote the FULL parsed object,
   so every study-mode "Correct" rating (`{mastered:true}`) silently
   reverted a hard card's difficulty to "medium" and every card-edit
   save (`{front,back,difficulty}`) silently un-mastered a mastered
   card — verified empirically through the live delegate AND in
   source at both UI call sites. The Lows: L1 (the AH1 settlement
   effect's one-directional clear never heals a stale clear that lands
   after a newer handler write — the next note's toasts swallowed),
   L2 (the parser's shrink loop skips the single-line slice — the AH7
   failure class latent), L3 (the AH4b pin's tautological `w ≥ w−1`
   assertion), L4 (the new pins' fixed sleeps — deferred, matching the
   file's standing patterns); the Infos: I1 (the upload POST's 201
   echoes the base64 `data` column), I2 (the sent-keys filter's
   unknown-key safety rests on Prisma's implicit skip-undefined).
   Plus: the s82 reference re-sweep (ok:true — 9/9 invariants both
   hosts, brand tables byte-matched, mobile drawers green on both) and
   agent-browser mobile-nav verification on BOTH hosts (ref 20
   links/navigates/closes with its own 416 overflow; clone 20 links +
   the superset skip-link at scrollWidth 390 — no Tailwind v4
   mobile-nav bug).
3. **Cycle-32 plan written into the remediation plan BEFORE any
   source change** (the doctrine), then TDD: 5 pins RED at their
   designed assertions (AI1a/AI1b/AI1c — `Expected "hard" /
   Received "medium"` and `Expected true / Received false`; AI3 the
   single-line-envelope parse; AI6 `dataAbsent`) + the AI4 sibling
   measurement green-on-arrival by design. GREEN: the shared
   `sentKeysPatch` helper at BOTH write sites (factory + card
   delegate, the deckId move-check re-based, the empty patch
   short-circuited, sent keys intersected with parsed keys), the
   unconditional settlement (AI2 — the AH1a/AH2a/AH2b family
   re-verified green as the behavioral-preservation proof), the
   parser's `end > start` bound, and the `FILE_METADATA` select on
   both create responses. One mutation proof (AI4: col-span-2 →
   col-span-1 turned the pin red at exactly the sibling assertion —
   233px vs ≥464px); the RED-first pins are their own mutation
   proofs.
4. **Full cold re-cert**: lint ✓ tsc ✓ unit **864/864** ✓ build
   fresh; cold e2e **448/448** (127+138+52+73+58 first-pass every
   chunk; the census re-derived per AP-116 — 443 real specs + 5
   chunk setups). The standing suite: the orchestrator's stage 0 +
   stages 1–12 green in sequence; the settings-roundtrip stage's one
   live finding re-ran GREEN standalone (the environmental save-wait
   flake); the remaining stages verified individually (upload-edge
   0/10, data-volume 0/10, ai-error 0/10 after a fresh limiter — the
   documented 429 test-pollution class, ai-a11y 0/4, dark-sweep 20
   views 0 dirty, accent-light + the volume family spot-checks green,
   pre15 + dep GREEN, cwv-s16 clone all GOOD, cwv-volume-stress 0 on
   the re-run — the first run's 2010ms-vs-2000ms Tasks longTaskTotal
   was throttled-median noise, recorded honestly). The s82 resweep
   re-ran after the final build: ok:true.
5. **Docs chain**: README (badge 1312, counts 864/448, the S82
   session row), AGENTS/CLAUDE counts (the AGENTS e2e row's stale
   431/old-map caught and fixed too) + the S82 lessons section
   (coverage-claim verification per write site; tautological
   assertions; the degenerate slice), vitest.config.ts header, the
   remediation-plan Cycle-32 plan + execution record + header, this
   worklog, docs/session_34.md. Evidence: `82-{ref|clone}-*.png` (18
   resweep captures) + `82-clone-ai*.png` (5 surface captures).
   `.env.example` verified current (no env surface changed this
   cycle).

**Stage summary.** Batch AI DONE: the sixteenth delegate (AI1 — the
flashcard card partial-PATCH data loss, the AH8 fix's one-site
coverage claim corrected at the hand-written delegate), the settlement
self-heal (AI2), the parser single-line seam (AI3), the AH4b tautology
replaced with the mutation-proven sibling measurement (AI4), the
schema-validated-keys intersection (AI5), and the create-response
metadata shape (AI6). Baselines: e2e **448/448**, unit **864/864**,
lint/tsc/build clean, s82 resweep ok:true, mobile nav verified on both
hosts. Standing debt unchanged: Batch R + the documented deferrals.

---
Task ID: 5-a
Agent: general-purpose (Mode-C audit)
Task: Read-only Mode-C audit of the Batch AI diff (7144e71..4ec3db2)

Work Log:
- Read the S81/S82 worklog entries + AGENTS.md's "Zod4 + certification-isolation
  lessons (S81)" and "Coverage-claim + assertion-quality lessons (S82)" sections
  first (the documented failure classes this audit hunts).
- Extracted the full diff (src: 4 files / 225 lines; tests+scripts+vitest.config:
  606 lines) and read every hunk; then read each changed source file IN FULL:
  files/route.ts (139), entities.ts (377), notes-view.tsx (791),
  suite-verdict.ts (parseAuditStdout + header), plus the surrounding context:
  http.ts (route factories + parseWith/readJson), validation.ts (every schema),
  files/[id] + files/folders/[id] + settings/preferences + flashcards cards/decks
  routes, ai/generate-cards, import/data, lib/api.ts, data.ts mutation region,
  files-view.tsx + flashcards-view.tsx consumer regions.
- AI1/AI5 verified empirically (node -e, repo's zod@4.6.5, pure logic — no
  build/test runs): flashcardSchema.partial().parse({mastered:true}) materializes
  difficulty:"medium"; strip mode drops unknown sent keys; nullableId transforms
  ""→null only when sent. Confirmed sentKeysPatch output = sent ∩ schema keys,
  the deckId move-check re-base (data.deckId is sent-only — identical condition
  to the old parsed.deckId since deckId carries no default), the empty-patch
  short-circuit shapes (factory: normalize(existing); card: the full `card` row —
  both consistent with their update paths, updatedAt correctly NOT bumped on a
  no-op).
- Write-site census (the "any OTHER site that bypasses it?" question): grep of
  every db.*.update across src → factory (15 delegates) + card delegate +
  files/folders/[id] folderDelegate (hand-written, safe — folderUpdateSchema has
  NO .default() and its own !== undefined filter) + preferences (manual filter,
  no defaults) + auth user/token updates (fixed columns) + import/data
  (full-row RESTORE semantics — intended bypass, no zod partial). Every schema
  with .default() enumerated against its update path: all land in
  sentKeysPatch or a no-default manual filter. No .partial() parse exists
  outside entities.ts.
- AI6 consumer sweep: FILE_METADATA = every FileItem column except `data`;
  all consumers verified (view GET/POST upload uses res.ok only, link create
  discards the body via apiSend, resilience C3/AH13/AI6 + s14-hardening +
  upload-edge audit read only record.id/status/error). Both create paths still
  persist the full row (select affects the response only). Authz unchanged:
  withUser on GET/POST, folder ownership 404-checked on both branches,
  userId from session, link URL regex-validated (no javascript: href).
- AI2 traced through every selectedIdRef write site (effect + selectNote +
  create submit) and every guard consumer (onContentChange both branches,
  saveNow both branches): the unconditional settle is a strict superset of the
  S81 conditional clear — the delete-departs clear is preserved (dep → null)
  and any stale clear is healed on the next dep change; handler writes can no
  longer be permanently clobbered because every dep change re-syncs. createNote
  adds the row to the store before setSelectedId, so no transient clear window.
- AI3 verified by pure-logic old-vs-new loop repro over 6 shapes: single-line +
  prose old=LOUD→new=parses (the fix); multi-line+prose unchanged; truncated
  single line and stack traces stay LOUD both forms (anti-phantom preserved);
  residual behavior change: two consecutive one-line JSON objects now returns
  the first where the old form errored (classifyAudit's shape guard backstops).
- Test quality per the S82 lessons: AI1a/b (response + LIST round-trip — not
  response-echo-only), AI1c (UI path, waitForResponse-gated, no fixed sleeps),
  AI4's sibling assertion is cross-element and algebraically genuine (the
  tautology is gone), AI6 asserts dataAbsent + listed + download, AI3 pins the
  N=1 boundary. Counts re-derived: parity-session7 45, resilience 7, 22 unit
  files / 864 its (matches the new vitest header exactly), chunk arithmetic
  127+138+52+73+58=448 with 30 spec files listed exactly once.
- Findings triaged: 0 Critical / 0 High / 0 Medium / 3 Low / 3 Informational
  (see the audit report for the ledger). Documented non-findings honored (not
  re-reported): Batch R, the s80 L1 study zombie, the AG pinned-hue sites,
  I2's text token, the deferred fixed-sleep class.

Stage Summary:
- 0 Critical / 0 High / 0 Medium / 3 Low / 3 Informational. The batch's six
  claims all verified correct: AI1 (sentKeysPatch at both partial-PATCH write
  sites, exhaustive write-site census, deckId re-base + empty-patch shapes
  correct), AI2 (converging settlement — strict superset, clear semantics
  preserved), AI3 (single-line seam fixed, anti-phantom guard intact), AI6
  (FILE_METADATA complete for every consumer, both creates persist fully),
  AI4 (the tautology genuinely replaced), AI5 (intersection is contract
  hardening with identical observable behavior). The Lows: L1 AI2's heal
  behavior is unpinned (AH1/AH2 re-runs prove preservation, not the heal);
  L2 the parser bound now returns the first line alone for multi-envelope
  stdout where the old form failed LOUD (shape-guard backstopped, contrived);
  L3 a seventeenth hand-written write site (files/folders/[id] folderDelegate)
  is safe today but outside the sentKeysPatch convention — a future .default()
  there would silently reintroduce the AH8 class. Infos: the parser's
  post-loop try is now dead-in-effect; AI5 has no pin (unverifiable through
  the API — strip mode already drops unknown keys); the card delegate's
  no-op short-circuit returns the pre-update snapshot (correct, consistent).
  No code changes made (read-only audit).

## Session 83 (continuation 35) — the convention closure + the verified-behavior accuracy + the print/focus remediation + the security bump (Batch AJ)

**The cycle (Cycle 33).** The received state: `4e070d4` (Batch AI
`4ec3db2` + the operator's session-log commits adding
`docs/session_34.md`/`session_35.md`). The 25th workspace reset wiped
the workspace (chromium-1243 re-provisioned — the standing gotcha);
the repo re-cloned clean.

1. **Baseline re-certified cold**: lint ✓ tsc ✓ unit 864/864, build
   green, cold e2e 448/448 first-pass every chunk (127+138+52+73+58).
2. **Three evidence layers** (before any source change): a Mode-C
   audit of the Batch AI diff (Task 5-a, appended below) — 0 Critical
   / 0 High / 0 Medium / 3 Low / 3 Info, all six AI claims verified
   correct in source AND empirically. The Lows: L1 (the AI2 heal
   unpinned), L2 (the parser's first-envelope-wins unpinned), L3 (the
   folder delegate — a 17th hand-written PATCH site outside the
   sentKeysPatch convention, safe today only because its schema
   carries no defaults). Plus: the s83 reference re-sweep (ok:true —
   9/9 invariants both hosts, 18 captures) and agent-browser
   mobile-nav verification on BOTH hosts (ref 20 links + its own 416
   overflow; clone 20 links + the superset skip-link at scrollWidth
   390 — no Tailwind v4 mobile-nav bug).
3. **The cycle's empirical discovery** (probed BEFORE planning): the
   S82-era comment "a Prisma update with an empty data object is
   rejected" is FALSE on Prisma 6.11 — empty PATCHes answer 200 with
   the row unchanged, and a direct client-level
   `db.user.update({data:{}})` is accepted as a no-op with
   `@updatedAt` NOT bumped. Both short-circuit comments corrected.
4. **Cycle-33 plan written into the remediation plan BEFORE any
   source change**, then TDD: AJ1's pin green-on-arrival by design
   with its protective value proven by the three-step mutation
   (add `.default(null)` + the OLD hand-filter → RED at
   `renamedParentPreserved` — the exact AH8 class detected; keep the
   default + the sentKeysPatch routing → GREEN — the routing defeats
   the class; then the mutant removed). AJ3's pin green-on-arrival,
   mutation-proven (last-envelope-wins flips it red). GREEN: the
   folder delegate routed through the exported `sentKeysPatch` (the
   17th site joins the convention), the parser's dead post-loop try
   removed, the AI2 heal acceptance + the preferences-route
   defaults-free filter certified in comments.
5. **The standing-suite layer expanded the cycle**: the orchestrator
   took stages 0–16 in sequence (killed at 17 — the environmental
   cap); stages 9–12/14–15 produced empty envelopes (the AJ7 dev-
   portal class + one dependency-reload abort). Individual re-runs:
   security 0/7, settings-roundtrip 0/5, connectivity 0/7,
   upload-edge 0/10, data-volume 0/10, ai-error 0/10, ai-a11y 0/4 —
   and TWO genuine received-tree defect families (both A/B-verified
   against the clean `4e070d4` tree, correcting the S82 record's
   "print, focus-order green in sequence" claim): **AJ5** — five
   active-state white-text surfaces with no `print-color-adjust:
   exact` (Calendar segmented tab, Timetable today badge, Exams topic
   chips, Calculator History pill, Settings theme tile — print drops
   the fills, the text goes invisible; +5 RED pins, fixed via the
   `sf-selected-tint` utility + `sf-print-exact`, all GREEN, the
   print audit 0/0 from 5/5) and **AJ6** — the Dashboard SectionLink's
   nested button tab stop with no focus indicator (+1 RED pin with
   REAL keyboard traversal, fixed with its own focus-visible ring,
   the focus audit clean). **AJ7** — the Next.js dev overlay's
   `<nextjs-portal>` intercepted drawer-bottom clicks (six sweeps,
   identical crash on the clean tree); suppressed via an init-script
   CSS rule (dev-only by construction) — mobile/midband/landscape/
   dark-mobile all 0 findings / 20 views after the patch. **AJ8** —
   the security headline: next 16.4.0 carried TWO CRITICAL
   unauthenticated RCE advisories (GHSA-2464-fhr4-w9xw +
   GHSA-673q-mjm6-r5xr, both runtime-reachable) + a Server-Actions
   DoS; bumped to 16.4.2 via `bun add` with the FULL re-verification
   ladder: rebuild green, lint/tsc clean, unit 865/865, **full cold
   re-cert 455/455** (127+138+53+79+58 first-pass every chunk), every
   API audit re-run green under the patched server, dep-audit **GREEN
   — 0 runtime-reachable** (quill 2.0.3 is the latest upstream; its
   low XSS advisory tracked, no fix available).
6. **Docs chain**: README (badge 1320, counts 865/455, the S83
   session row), AGENTS/CLAUDE counts + the S83 lessons section (the
   comment-as-hypothesis, the raw-envelope re-derivability, the
   dev-portal suppression, the nested focusable, the per-SURFACE
   print contract), vitest.config.ts header, the remediation-plan
   Cycle-33 plan + three amendments + execution record + header, this
   worklog, docs/session_36.md. Evidence: the resweep set
   `83-{ref|clone}-*.png` (18 captures) + the AJ surface captures
   (`83-clone-aj-*.png`). `.env.example` verified current (no env
   surface changed this cycle).

**Stage summary.** Batch AJ DONE: the convention closure (AJ1 — the
17th write site routed through sentKeysPatch, mutation-proven), the
verified-behavior accuracy (AJ2 — the Prisma empty-data comment
disproval), the parser documentation pin + dead-code removal (AJ3),
the certification comments (AJ4), the print-fill family (AJ5 — five
surfaces, five pins), the focus indicator (AJ6), the dev-portal sweep
repair (AJ7), and the critical-RCE security bump (AJ8 — next 16.4.2).
Baselines: e2e **455/455**, unit **865/865**, lint/tsc/build clean,
dep-audit 0 runtime-reachable, print audit 0/0, s83 resweep ok:true,
mobile nav verified on both hosts. Standing debt unchanged: Batch R +
the documented deferrals.

## Session-84 / Batch AK (Cycle 34) — the folder-tree integrity + the print-enumeration closure

**Received state**: `b0d903b` (Batch AJ `f9eacd5` + the operator's
session-log commit adding `docs/session_37.md` — both transcripts record
the completed S83/BJ cycle; this is the next cycle). Workspace reset
(26th), fresh clone, chromium-1243 re-provisioned, `.env` +
`db/custom.db` + seed restored, production build green.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit
**865/865** ✓; cold e2e **455/455** (127+138+53+79+58, first-pass every
chunk).

**Evidence layers (all pre-change)**: the Mode-C audit of the Batch AJ
diff (`4e070d4..f9eacd5`, delegated) — **0C/0H/0M/4L/5I**, all eight AJ
claims verified; the s84 reference re-sweep re-tagged and run (ok:true —
9/9 invariants both hosts, brand tables byte-matched, 18 captures); and
agent-browser mobile-nav verification on BOTH hosts (reference 20 links /
navigates / closes / its own 416 overflow; clone 20 links / navigates /
closes / scrollWidth 390 — **no Tailwind v4 mobile-nav bug**).

**The cycle's empirical headline (probed live before planning)**: the
audit's L4 — the folder PATCH cycle hole — verified END-TO-END:
`PATCH {parentId: <own id>}` answered **200** and persisted a
self-referencing row; a two-step A→B→A cycle likewise; with the user
inside the cycled folder, a folders refresh fed the cycle into the
files-view breadcrumb `while` walk — **the renderer wedged permanently**
(agent-browser `eval "1+1"` timed out, exit 124). One authenticated API
call froze the tab. Probe rows deleted after the repro.

**TDD execution** (plan written into the remediation plan BEFORE any
source change; mid-cycle amendments recorded when discovered):

- **AK1 (the headline)**: the four e2e pins written FIRST — verified RED
  on the pre-fix build at their designed assertions (self-parent
  200-with-self-reference-stored; the cycle's second PATCH 200 with the
  cycle persisted). GREEN: the server-side folder-tree integrity guard
  (self-parent → 400; the descendant-cycle walk — one userId-scoped
  query, the ancestor chain walked in memory with a visited set that
  also terminates on a pre-existing cycled/imported row set; the
  bogus-parent 404 contract unchanged and now pinned — the audit's L3
  coverage gap closed) + the client defense-in-depth (the breadcrumb walk
  extracted to `src/lib/folder-tree.ts` with the visited-set guard —
  EIGHT unit termination pins; MUTATION-PROVEN: the guard removed → the
  test runner itself wedges, no verdict in 120 s). Resilience file 12/12.
- **AK2**: the print-enumeration closure — the PT result circles + the
  Math Solver remove chip gain `sf-print-exact`; the My Day gradient
  block + the Flashcards deck swatch + the UserAvatar gain the inline
  property. The honest mid-cycle discovery (the AK2a RED): the deck list
  lives inside a print-hidden `<aside>` — its swatch never prints; AK2a
  reframed to pin the REAL contract (the aside-hiding rule). Four pins,
  three at the `printColorAdjust: "economy"` assertion on the pre-fix
  build → all GREEN. Accessibility file 31/31.
- **AK4**: the sentKeysPatch contract pinned at the unit seam — a
  10-shape table, green-on-arrival BY DESIGN, MUTATION-PROVEN (the
  AH8-class mutant failed 7/10 pins).
- **AK3/AK5/AK6**: the cert-header census arithmetic corrected; the
  "Prisma 6.11" comments re-labeled to the resolved runtime (6.19.3);
  eslint-config-next aligned to ^16.4.2 via `bun add -D` (lint/tsc clean,
  no rule churn).

**Re-certification**: rebuild green; lint ✓ tsc ✓ unit **883/883**
(865 + 8 folder-tree + 10 sentKeysPatch); full cold re-cert **463/463**
(127+138+57+83+58; ONE chunk-4 skip-link flake — the documented S81
late-hydration environmental class — chunk-4 cold re-run 83/83
first-pass). The s84 resweep re-run on the final build: **ok:true**. The
standing audits: security 0 (after the fresh-boot re-run — the first
"limiter shape wrong" was the failed-restart stale-server artifact),
print 0/0, focus clean (the dev-only NEXTJS-PORTAL artifact excepted),
settings-roundtrip 0, connectivity 0, data-volume 0, ai-error 0 (fresh
budget), ai-a11y 0. Mobile nav re-verified on the final build (20 links,
navigates, closes, scrollWidth 390).

**Operational lessons (recorded in AGENTS.md)**: two silent restart
failures (kill-by-wrapper-PID leaves `next-server` serving; `bun
server.js`'s bare command line defeats path-shaped greps) → the
stale-server served replaced chunks → the fresh-login wedge-at-Splash
red herring; the standing audits share the demo user's AI budget (the
security audit's spam → the ai-error audit's 429-phantom findings —
cleared on a fresh boot); the tool-result display eats `[m` sequences
(`transition-[margin]` rendered as `transition-argin]` — the hex dump
is the authority).

**Docs chain**: README (badge 1346, counts 883/463, the Session-84 row),
AGENTS/CLAUDE counts + the S84 lessons section, vitest.config.ts header,
the remediation-plan header + Cycle-34 plan + amendments + execution
record + DONE marker, this worklog, `docs/session_38.md`. Evidence:
`s84-resweep` 18 captures + 8 AK-surface captures (`84-clone-ak-*.png`).
`.env.example` verified current (no env surface changed this cycle).

**Stage summary.** Batch AK DONE: the folder-tree integrity guard (the
verified live self-DoS class closed at BOTH layers, 4 e2e pins + 8 unit
pins + 2 mutation proofs), the print-enumeration closure (3 print-visible
surfaces fixed + 2 print-hidden surfaces certified + the aside contract
pinned), the sentKeysPatch contract pinned (10 shapes, mutation-proven),
and the audit's hygiene findings (census arithmetic, comment accuracy,
eslint-config alignment). Baselines: e2e **463/463**, unit **883/883**,
lint/tsc/build clean, every standing audit green, s84 resweep ok:true,
mobile nav verified on both hosts. Standing debt unchanged: Batch R, the
study zombie, the ~27 hue consumers, I2's text token.

---

## Session-85 — Batch AL (Cycle 35): the study-groups members resurrection + the lying-type seam closure + the server-walk seam

**Received state**: `5383bb7` (Batch AK `86d11dd` + the operator's session-log commit adding `docs/session_39.md`). Provisioning: bun install (497 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db"), db push + seed, chromium-1243 re-provisioned (the 27th workspace reset), production build green.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 883/883 ✓; e2e 463/463 (127+138+57+83+58, first-pass every chunk).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AK diff (`b0d903b..86d11dd`): **0 Critical / 0 High / 0 Medium / 4 Low / 4 Info** — all nine AK claims verified (the auditor re-ran the unit seams green). The Lows: L1 the one avatar-gradient print surface AK2 missed (the Study Groups member chip), L2 the sentKeysPatch value-source mutation gap, L3 the folder-guard TOCTOU (accept-and-documented), L4 the server walk's unpinned termination.
- The s85 reference re-sweep: **ok:true** (9/9 invariants both hosts, brand tables byte-matched, 18 captures).
- agent-browser mobile-nav on BOTH hosts: the reference drawer (20 LABELED links with the sidebar expanded — the icon-only collapsed state re-confirmed live via `sidebarOpen:false`, the S52 shared-state contract) and the clone drawer (26 labeled links — the superset skip-link + 20 nav + 5 content; icon-only with `title`+`aria-label` when collapsed). Both navigate + close; the reference's own 416 overflow vs the clone's 390. **No Tailwind v4 mobile-nav bug.** Collapsed-state captures saved for both hosts.

**The cycle's empirical discovery — AL1, the headline**: the Study Groups members surface has been DEAD since the initial implementation. The API ships `members` as an ARRAY (`membersFromRow`), the client's `parseMembers` ran `JSON.parse` on it (the array coerces to "[object Object]", throws, the catch returns []) — every group rendered "0 members", **addMember WIPED the existing members**, and every edit-dialog save sent `members: []` (the wipe again). Found live by the AL2 print pin's locator resolving NOTHING (a presence-failure; the page snapshot showed "0 members" against a DB row carrying [{Ari},{Sam}]). The store's own TYPE (`members: string`) had lied about the boundary for 84 sessions.

**Implemented TDD RED→GREEN**:
- **AL1**: the 3-pin e2e family (seeded-members-render / add-member-preserves / edit-save-preserves) verified RED at their designed assertions, then the pure `src/lib/group-members.ts` seam (`normalizeMembers`, 7 unit pins) + the store type corrected to `GroupMember[]` + the view wired through the seam.
- **AL2**: the member chip's inline `printColorAdjust: "exact"` (+1 e2e pin under print emulation — RED at the designed assertion post-AL1, GREEN under the property).
- **AL3**: the server cycle-walk extracted to `wouldCreateCycle` (src/lib/folder-tree.ts), consumed by the PATCH delegate — EIGHT unit pins, MUTATION-PROVEN (the guard-removal mutant WEDGES the runner, exit 124).
- **AL4**: the sentKeysPatch value-source pins (+2) — MUTATION-PROVEN (the source-substitution mutant failed exactly the two new pins; the original ten survived).
- **AL5**: the s85 resweep's probe-user cleanup (the closing delete-account POST; `probeCleanup: ok` verified on the final-build re-run).

**Re-certification**: rebuild green; lint ✓ tsc ✓ unit **900/900** (883+7+8+2); full cold re-cert **467/467** (130+138+57+84+58, first-pass every chunk, zero flakes). The s85 resweep on the final build: ok:true. The standing audits: security 0 (the first run's limiter finding was the documented S84 ordering artifact — the audit had run twice back-to-back; fresh boot + single re-run: 0), print 0/0, focus-order 0, settings-roundtrip 0, connectivity 0, data-volume 0, ai-error 0 (fresh budget), ai-a11y 0. Mobile nav re-verified on the final build.

**Operational lessons (recorded in AGENTS.md)**: a client type that disagrees with the API boundary hides live data loss (the type was the seam that knew); a pin failing at PRESENCE (not its assertion) is a discovery signal — read the page snapshot before reframing; agent-browser's `--viewport` flag does not persist across `open` calls (use `set viewport`), and a geometry-based "first button" probe at desktop width resolves the sidebar's collapse chevron, not the hamburger — its persisted state changes the drawer's rendering (the S52 shared-state behavior).

**Docs chain**: README (badge 1367, counts 900/467, the Session-85 row), AGENTS/CLAUDE counts + the S85 lessons section, vitest.config.ts header, the e2e-chunked-cert.sh header (130+138+57+84+58=467), the remediation-plan header + Cycle-35 plan + the mid-cycle discovery amendment + execution record + DONE marker, this worklog, `docs/session_40.md`. Evidence: the s85 resweep 18 captures + 4 mobile-nav captures (both hosts, both sidebar states) + 6 AL-surface captures (`85-clone-al-*.png`). `.env.example` verified current (no env surface changed this cycle).

**Stage summary.** Batch AL DONE: the members resurrection (a live data-loss defect closed at the pure seam + the corrected store type, 3 e2e + 7 unit pins), the print-closure completion (the one missed avatar-gradient surface, +1 pin), the server-walk seam (8 unit pins + the wedge mutation proof), the value-source pins (2 pins + the precise mutation proof), and the resweep probe cleanup. Baselines: e2e **467/467**, unit **900/900**, lint/tsc/build clean, every standing audit green, s85 resweep ok:true, mobile nav verified on both hosts. Standing debt unchanged: Batch R, the study zombie, the ~27 hue consumers, I2's text token.

---

## Session-86 — Batch AM (Cycle 36): the members boundary alignment + the evidence-hygiene closure

**Received state**: `f725f28` (Batch AL `16f15d7` + the operator's session-log commit adding `docs/session_41.md`). The workspace was PRESERVED this cycle (no reset — the 28 resets' streak broken). Anchors read: session_40/session_41 (both record the completed Session-85/Batch AL), the remediation plan's Cycle-35 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-85/Batch AL (Cycle 35) at `16f15d7`; baselines unit 900/900, cold e2e 467/467; standing debt Batch R, the study zombie, the ~27 hue consumers, I2's text token.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 900/900 ✓; e2e 467/467 (130+138+57+84+58, first-pass every chunk, zero flakes — run chunk-by-chunk in the foreground after the detached cert died to the reaper).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AL diff (`5383bb7..16f15d7`, subagent, read-only): **0 Critical / 0 High / 0 Medium / 2 Low / 5 Info** — all five AL claims verified (the auditor re-ran the unit layer green, 900/900; the API round-trip checked symmetric; no tautologies in the 17 new pins). The Lows: L1 the byte-identical s85 evidence pair (the "row" capture == the "members" capture, md5-verified, while the record claimed "does not duplicate frames"), L2 the seam/server divergence (normalizeMembers drops blank-after-trim names; studyGroupSchema's length-based min(1) ACCEPTED them — a direct-API write persisted an invisible member whose row the next member write permanently deleted). The Infos: the five→six consumer count, the AL-numbering collision in the print pin's title, the duplicated GroupMember type, the AL1c sleep-sync + happy-path-only cleanup, the script/structure nits.
- The s86 resweep (re-tagged from s85 with the I5a fix): **ok:true** (9/9 both hosts, brand tables byte-matched, probeCleanup ok — AL5 holding live, 18 captures).
- agent-browser mobile-nav on BOTH hosts: reference 24 labeled links expanded / 20 icon-only collapsed via `sidebarOpen:false` (the S52 contract re-confirmed live) / navigates / closes / scrollWidth 416; clone 26 labeled links (the skip-link superset) / 20 icon-only collapsed ALL with `title`+`aria-label` via `sf-sidebar-collapsed` / navigates / closes / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, re-confirmed**.

**Implemented TDD RED→GREEN** (the Cycle-36 plan written into the remediation plan BEFORE any source change):
- **AM1** the headline: the members boundary alignment — the pin family written FIRST — 3 unit pins verified RED at their designed assertions + 2 green-by-design regression guards + the e2e API pin RED (the S87/AN2 accuracy fix: this bullet originally overclaimed "all RED") (two mid-cycle pin corrections recorded honestly: the first blank-name pin was GREEN for the wrong reason [its a@b.c email fails zod4's .email() — 1-char TLDs; every other field in a pin's payload must be unimpeachable], and the e2e pin's relative-URL fetch needed a loaded page first), then the server schema fix: studyGroupSchema members[].name/.email `.trim()`-first — blank writes rejected 400, padded values stored trimmed; the seam comment documents the alignment (the drop is defense-in-depth for legacy rows only).
- **AM2**: the byte-identical redundant capture dropped; the record's false claim corrected in place; the s86 capture script drives an interaction (a group switch) between its frames — all three captures distinct md5 (the exemplar).
- **AM3**: the "all five consumer sites" corrected to six; the print pin re-titled "AL2:" (the numbering collision resolved).
- **AM4**: the GroupMember type dedup (entities.ts imports the seam's interface).
- **AM5**: AL1c's waitForTimeout(800) → the "Study group updated" toast await; the AL1b/c cleanups in try/finally.
- **AM6**: accepted-and-documented (the two-pass PATCH scan, the resweep credentials convention).

**Re-certification**: rebuild green; lint ✓ tsc ✓ unit **905/905** (900 + 5); full cold re-cert **468/468** (131+138+57+84+58, first-pass every chunk, zero flakes). Standing audits: preflight GREEN; security 0 (fresh-boot single re-run — the first finding was the documented S84 double-run ordering artifact, cleared per the playbook); settings-roundtrip 0; connectivity 0; print 0/0; focus-order ok; data-volume 0 (300/200/250 rows); ai-error 0 (fresh budget); ai-a11y 0.

**Operational lessons (recorded in AGENTS.md as the S86 section)**: a defensive client seam stricter than the server schema is a silent-deletion edge (fix the server boundary); a pin green for the wrong reason verifies nothing (isolate the discriminating field); the daemon spawn form is the first suspect when it dies (the S32 subshell recipe is load-bearing — re-learned at the cost of the detached cert + two :3200 restarts + one mid-audit dev-server death); a relative-URL fetch inside page.evaluate needs a loaded page.

**Docs chain**: README (badge 1373, counts 905/468, the Session-86 row), AGENTS/CLAUDE counts + the S86 lessons section, vitest.config.ts header (905), the e2e-chunked-cert.sh header (131+138+57+84+58=468), the remediation-plan header + Cycle-36 plan + execution record + DONE marker, this worklog, `docs/session_42.md`. `.env.example` verified current (no env surface changed this cycle).

**Stage summary.** Batch AM DONE: the members boundary alignment (the silent-deletion edge closed at the server; the pin family accurately split: 3 RED unit pins + 2 green-by-design regression guards + 1 RED e2e pin, with the wrong-reason-green correction recorded — the "both RED-first" phrasing corrected S88/AO1, the AN2 class's fourth site), the duplicate evidence frame dropped + the claim corrected + the interaction-driving capture exemplar, the record/pin accuracy fixes, the type dedup, and the pin hygiene. New baselines: unit **905/905**, e2e **468/468**, every standing audit green, mobile nav verified on both hosts. Standing debt unchanged: Batch R, the study zombie, the ~27 hue consumers, I2's text token (the documented Session-87 candidates).

---

## Session-87 — Batch AN (Cycle 37): the pin-hygiene completion + the record-accuracy closure + the duplicate-evidence sweep

**Received state**: `0493503` (Batch AM `75d5af6` + the operator's session-log commit adding `docs/session_43.md` and `skills/pdf-old-*`; src/ untouched by the operator commit — verified by diff stat). The workspace was RESET (the 29th reset; fresh clone) — full re-provision: bun install (497 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db"), db push + seed, chromium-1243 re-provisioned (186.8 MiB), production build green. Anchors read: session_42/session_43 (both record the completed Session-86/Batch AM), the remediation plan's Cycle-36 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-86/Batch AM (Cycle 36) at `75d5af6`; baselines unit 905/905, cold e2e 468/468; standing debt Batch R, the study zombie, the ~27 hue consumers, I2's text token.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 905/905 ✓; e2e 468/468 (131+138+57+84+58, first-pass every chunk, zero flakes — the detached cert ran the S32 subshell recipe and survived to completion this time).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AM diff (`f725f28..75d5af6`, subagent, read-only): **0 Critical / 0 High / 0 Medium / 2 Low / 5 Info** — all six AM claims verified (the auditor re-ran the unit layer green, 905/905; the AM1 schema verified empirically against zod4; the AM2 blob-hash census confirmed the s85 pair eliminated; the six parseMembers call sites counted). The Lows: L1 the "all RED-first" summary overclaim (the AM1 records said all-RED while pins 4-5 are green-by-design regression guards — the record contradicts its own execution record), L2 the new AM1 e2e pin lacks the try/finally cleanup AM5 established in the same batch. The Infos: I1 the plan's L2 illustration email is zod4-invalid (wrong-reason illustration), I2 the s86 capture script's fixed sleeps + the trimmed screenshot's non-discrimination, I3 four OLDER byte-identical screenshot pairs survive (the AM2 class outside the audit's diff window), I4 normalizeMembers does not trim on read (the AM1 write-side asymmetry), I5 the resweep credentials embedded in committed source (the accepted s67+ convention, residual risk).
- The s87 resweep (re-tagged from s86): **ok:true** (9/9 both hosts, brand tables byte-matched, probeCleanup ok — AL5 holding live, 18 captures).
- agent-browser mobile-nav on BOTH hosts: reference 24 labeled links expanded / 20 icon-only collapsed via `sidebarOpen:"false"` with ZERO title/aria (the S52 contract re-confirmed live — with the mid-cycle discovery that the agent-browser profile PERSISTS localStorage across sessions: the drawer's first open rendered icon-only because a previous session's probe left `sidebarOpen:"false"`; read the key before interpreting the rendering, restore after — recorded as the S87 lesson 5) / navigates to /Notes / closes / scrollWidth 416; clone 26 labeled links (the skip-link superset) / 20 icon-only collapsed ALL with `title`+`aria-label` via `sf-sidebar-collapsed` / navigates / closes / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, re-confirmed for s87**.

**Implemented TDD RED→GREEN** (the Cycle-37 plan written into the remediation plan BEFORE any source change):
- **AN1** the AM1 e2e pin's own stamped-row cleanup: the evaluate returns the created id alongside the status, the assertions ride a try/finally that deletes the row on every path — the AM5 convention applied to the pin AM5 itself shipped in the same batch (the same-batch hygiene inconsistency closed; the parity-session8 family re-verified 58/58).
- **AN2** the record-accuracy closure: the three AM1 summary records corrected to "3 RED + 2 green-by-design regression guards + 1 RED e2e API pin" (README's Session-86 row, session_42's DONE bullet, the worklog's AM1 bullet — each correction self-labeling S87/AN2 so the trail stays auditable).
- **AN3** the duplicate-evidence sweep: the four older pairs re-verified byte-identical in-cycle (md5), the second name of each dropped (11-mobile-navigation, 77-ref-notes-populated, 77-ref-flashcards-with-cards, 84-clone-ak-files-guard; the first retains each frame); verified pre-drop that no spec/standing-audit/doc references the session-numbered names — the frozen historical capture scripts only WRITE them.
- **AN4** the read-side trim symmetry: 2 unit pins written FIRST and verified RED at their designed assertions (a padded member name/email returned verbatim pre-fix), then the one-line seam fix (`name.trim(), email.trim()` on the return) — both sides of the members boundary now normalize identically; the capture script's header records the honest evidence posture (HTML collapses whitespace; the unit pins carry the proof — the accepted I2 posture, stated at the script site).
- **AN5** the plan's L2 illustration annotated (the zod4-invalid example email; the valid-payload pointer).
- **AN6** accepted-and-documented (the resweep credentials — the s67+ convention, the git-history exposure makes source-only removal cosmetic; the capture script's fixed sleeps + screenshot non-discrimination — the "visible surface" claim is accurate).

**Re-certification**: rebuild green; lint ✓ tsc ✓ unit **907/907** (905 + 2 AN4 pins); full cold re-cert **468/468** (131+138+57+84+58, first-pass every chunk, zero flakes — census unchanged: AN1 modifies a pin in place). Standing audits: preflight GREEN; security 0 findings on a fresh-boot single re-run (the first finding — the AI-route limiter shape, cutoffAt=1 — was the documented S84 ordering artifact, reproduced by the auditor's OWN triple back-to-back run; kill-by-PID + fresh boot + single re-run cleared it per the playbook); settings-roundtrip 0; connectivity 0; print 0/0 (light + dark); focus-order 0; data-volume 0; ai-error 0 (10 nonGaps, fresh budget); ai-a11y 0 (4 nonGaps).

**Docs chain**: README (badge 1375, counts 907/468, the Session-87 row), AGENTS/CLAUDE counts + the S87 lessons section (the summary-overclaim lesson; the same-batch hygiene-convention lesson; the whole-directory duplicate-frame census lesson; the read-side symmetry lesson; the agent-browser persisted-localStorage lesson), vitest.config.ts header (907), the e2e-chunked-cert.sh header (the S87 census-unchanged note), the remediation-plan header + Cycle-37 plan + execution record + DONE marker, this worklog, `docs/session_44.md`. `.env.example` verified current (no env surface changed this cycle).

**Stage summary.** Batch AN DONE: the pin-hygiene completion (the AM1 pin's own cleanup), the record-accuracy closure (three overclaiming summaries corrected), the duplicate-evidence sweep (four historical byte-identical pairs dropped after in-cycle md5 verification), the read-side trim symmetry (2 RED-first unit pins + the one-line seam fix), and the accepted-and-documented residuals. New baselines: unit **907/907**, e2e **468/468**, every standing audit green, mobile nav verified on both hosts, the s87 interaction-driven captures all distinct. Standing debt unchanged: Batch R, the study zombie, the ~27 hue consumers, I2's text token (the documented Session-88 candidates).

---

## Session-88 — Batch AO (Cycle 38): the zombie kill + the token decoupling + the symmetry completion

**Received state**: `4402e4c` (Batch AN `db9acb4` + the operator's session-log commit adding `docs/session_45.md`; src/ untouched by the operator commit — verified by diff stat). The workspace was PRESERVED (provisioning intact: node_modules, db, chromium-1243). Anchors read: session_44/session_45 (both record the completed Session-87/Batch AN), the remediation plan's Cycle-37 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-87/Batch AN (Cycle 37) at `db9acb4`; baselines unit 907/907, cold e2e 468/468; standing debt Batch R, the study zombie (s80 L1), the ~27 hue consumers, I2's text token.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 907/907 ✓; production build green; full cold 5-chunk e2e **468/468** (131+138+57+84+58, first-pass every chunk, zero flakes — the S32 subshell recipe).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AN diff (`0493503..db9acb4`, delegated read-only): **0 Critical / 0 High / 0 Medium / 2 Low / 5 Info** — all six AN claims verified; AN3's closure empirically exceeded (an independent whole-directory md5 census over all 701 captures: zero duplicate pairs remain). The Lows: L1 the worklog's own AM stage summary still overclaims "both RED-first" (the AN2 class's fourth site — 13 lines below the corrected AM1 bullet), L2 parity-session7.spec.ts has ZERO finally (its four stamped pins — AH8c, AI1a/b/c — clean up on the happy path only).
- The AO-candidate evaluation (pre-plan): the study zombie's render-phase fix verified probe-first (an inline ESLint probe passes the repo's config verbatim for the React-documented render-phase state adjustment); the zombie's deterministic driver confirmed (rate's own PATCH→GET refresh carrying an external deletion between its legs, via page.route); the store's reload semantics verified (flashcards refills are atomic — no transient empty that would false-kill a session on refresh); the mobile in-row Study path verified (selectDeck + startStudy batch in one event).

**Implemented TDD RED→GREEN** (the Cycle-38 plan written into the remediation plan BEFORE any source change):
- **AO4** the headline — the study-zombie structural kill (the s80 audit's L1, deferred three cycles because the obvious fix is an effect + setState, which the repo's lint gate forbids): the pin written FIRST, verified RED on the pre-fix build at the designed discriminator (the latched `studying` resurrects study mode on the refilled card — the card grid never returns; the RED snapshot captured "1 / 1" restored on the refill), then the fix: the React-documented render-phase state adjustment in flashcards-view.tsx (setState during render of the same component, guarded to terminate — NO effect). GREEN on the rebuilt server.
- **AO3** the API read-boundary symmetry completion (the audit's Info 1 — AN4 stopped one layer short): `membersFromRow` exported (the sentKeysPatch pure-seam precedent) and routed through `normalizeMembers` in entities.ts — the API GET boundary no longer ships legacy padded members verbatim. 2 RED-first unit pins (the array-tolerance assertion rides inside the first RED pin) + 1 error-semantics guard family (corrupt JSON → [], a non-row value passes verbatim, null/absent → [] — the third `it`'s actual content; corrected S89/AP4, the AN2 class's fifth site) (restructured mid-cycle to RED at the designed assertions — the S87 lesson 1 applied). Unit layer green at 910/910.
- **AO5** the dedicated clock-date token (the standing I2 debt — the cross-consumer coupling closed): `clockDateDark` added to AccentToken + all 7 accents (carrying the SAME 400-step values — computed colors byte-identical), emitted as `--sf-primary-clock-date-dark` (accentCssVars 15 → 16 entries), the S3-J var-count pin RED at 16 pre-token / GREEN post, the boot script's seven TOKENS name-lists extended at the SAME index (the VALUES insertion-order sync contract), the `:root` default + `.sf-clock-date`'s dark branch switched in globals.css, the AF5 comments updated (globals.css + dark-mode.spec.ts). Every AF5/AG11a pin green — the avatar gradient and the clock-date text retunable independently.
- **AO2** the four stamped pins in parity-session7.spec.ts (AH8c task, AI1a/AI1b/AI1c decks — the audit's L2, the AN1/AM5 class in the file that never got it) wrapped in try/finally: the stamped rows delete on EVERY path, not just the happy one. Test-only; cold-cert immune (db/e2e.db re-created per chunk).
- **AO1** the record-accuracy fourth site (the audit's L1 — the AN2 class): the worklog's own AM stage summary corrected to the accurate pin split ("3 RED unit pins + 2 green-by-design regression guards + 1 RED e2e pin"), self-labeling S88/AO1.
- **AO6** accepted-and-documented (the fresh-user probe stranding — cold-cert re-creates the db; the frozen historical capture scripts — re-running them would resurrect the AN3-dropped duplicates).

**Operational incident, root-caused and recorded as the S88 lesson 1**: the post-AO5 rebuild was run as `npx next build` — which BYPASSES the package.json postbuild static copy (`cp -r .next/static .next/standalone/.next/`), producing a standalone that serves SSR green (health 200) while every static chunk 404s. The entire e2e family then hung at hydration-waits (45.1s timeouts) with nothing pointing at the assets; the AO source was NEVER broken. Diagnosed by curling one static chunk; the canonical `bun run build` + re-run verified 85/85 on the affected family. Lesson: build with the package-manager script; when a whole e2e family times out at once, check one static chunk before suspecting source.

**Re-certification**: canonical rebuild green; lint ✓ tsc ✓ unit **910/910** (907 + 3 AO3 tests); full cold re-cert **469/469** (131+139+57+84+58, first-pass every chunk, zero flakes — parity-session7 +1 for the AO4 pin). The standing suite **34/35** (preflight GREEN; every sweep family green; ai-error 0 with 10 nonGaps; ai-a11y 0 with 4 nonGaps; the ONE finding: cwv-volume-stress's Tasks longTaskTotal 2098–2288ms vs the 2000ms budget — root-caused as the S82 throttled-median noise-floor class, NOT a cycle regression: a stash-A/B against the received AN tree measured the SAME tree at 1978 green / 2073 red, no AO diff touches the Tasks load path, and the db counts verified clean (12 seed tasks, no accumulation); recorded honestly, the budget NOT weakened, the re-anchoring named as future-cycle standing debt).

**The s88 resweep** (re-tagged from s87): **ok:true** (9/9 both hosts, brand tables byte-matched, probeCleanup ok — AL5 holding live, 18 captures).

**agent-browser mobile-nav on BOTH hosts**: reference 24 labeled links expanded / 20 icon-only collapsed via `sidebarOpen:"false"` with ZERO title/aria (the S52 contract re-confirmed live; the persisted key READ before interpreting the rendering and restored after — the S87 lesson 5 applied) / navigates to /Notes / closes / scrollWidth 416 (the reference's own overflow); clone 26 labeled links (the superset skip-link) / 20 icon-only collapsed ALL with `title`+`aria-label` via `sf-sidebar-collapsed` / navigates to /Notes / closes (only the off-screen x=-9999 skip-link remains — by design) / Escape closes / scrollWidth 390 — **no TailwindCSS v4 mobile-nav bug, re-confirmed for s88**.

**The s88 evidence captures** (4 frames, all md5-DISTINCT): the AO4 zombie surface pair (the emptied deck's guard fall-through + the refilled card grid with study mode NOT resurrected) + the AO5 clock chip in violet/teal dark (the dedicated token retuning with the accent). The probe deck cleaned in the finally; the demo surface restored (accent violet, mode light).

**Docs chain**: README (badge 1379, counts 910/469, the Session-88 row), AGENTS/CLAUDE counts + the S88 lessons section (the standalone-static-copy lesson; the noise-floor-budget A/B discriminator; the render-phase zombie kill; the token deduplication), vitest.config.ts header (910), the e2e-chunked-cert.sh header (131+139+57+84+58=469), the remediation-plan Cycle-38 plan + execution record + DONE marker, this worklog, `docs/session_46.md`. `.env.example` verified current (no env surface changed this cycle).

**Stage summary.** Batch AO DONE: the study-zombie killed structurally at last (the render-phase adjustment — three cycles deferred, now closed without the forbidden effect), the API read-boundary symmetry completed one layer deeper (membersFromRow through normalizeMembers), the clock-date token decoupled from the avatar gradient (the I2 standing debt closed), the parity-session7 pin hygiene closed (the four stamped pins finally-wrapped), and the record-accuracy fourth site corrected. New baselines: unit **910/910**, e2e **469/469**, the standing suite 34/35 (the cwv noise-floor finding recorded honestly, the budget unchanged), mobile nav verified on both hosts. Standing debt after AO: Batch R (RSC structural perf), the ~27 AG-pinned-hue consumers (L4, unchanged), the cwv-volume-stress budget re-anchoring (named this cycle).

---

## Session-89 — Batch AP (Cycle 39): the partial-empty zombie variant + the spec environment-immunity + the boot-list mechanical pin

**Received state**: `70bd199` (Batch AO `8e3b9d0` + the operator's two commits: `9846a69` adding `docs/session_47.md` [the full S88 transcript, 172 lines] + `skills/web-application/` [the four-sibling distillation skill + its evaluation report — assessed as reference material, not a directive], and `70bd199` batch-expanding skills/ [animate-expo, apple-design, and ~130 more; src/ untouched by both — verified by diff stat]). The workspace was RESET (the 30th reset; fresh clone) — full re-provision: bun install (497 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db"), db push + seed, chromium-1243 re-provisioned (114.3 MiB), canonical production build green. Anchors read: session_46 (the S88 short transcript) + session_47 (the operator-committed full S88 transcript), the remediation plan's Cycle-38 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-88/Batch AO (Cycle 38) at `8e3b9d0`; baselines unit 910/910, cold e2e 469/469, the standing suite 34/35 (the cwv noise-floor finding documented, budget unchanged). Standing debt: Batch R, the ~27 AG-pinned-hue consumers, the cwv-volume-stress budget re-anchoring.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 910/910 ✓; the 5-chunk cold cert's chunk-5 first pass carried **1 failed** — root-caused as a PROVISIONING deviation, not a source regression: the s22-boot-guard negative spawn omits AUTH_SECRET, but the standalone server's Next loadEnvConfig auto-loads the repo-root `.env`, and this workspace's provisioning had generated a REAL secret (a legal posture per `.env.example`'s own guidance) — the guard saw a valid boot and never exited (the spec's 20s exit-wait). The empty-secret posture restored, the chunk re-run green at 58/58 → **469/469** confirmed. The discovery named as the AP2 candidate (a spec environment-immunity hardening, not a source fix).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AO diff (`4402e4c..8e3b9d0`, delegated read-only, against skills/web-app-foundation + the operator's new skills/web-application): **0 Critical / 0 High / 0 Medium / 1 Low / 4 Info** — all six AO claims verified TRUE (the auditor re-ran the unit layer green 910/910, verified the AO4 render-phase termination + the mobile in-row batching path, the AO5 three-site index alignment per accent, the AO3 single-caller blast radius, and the e2e finally completeness). The Low: **L1** the partial-empty zombie variant — AO4's unlatch covered only the all-gone case; the Infos: I1 the AO3 pin-classification wording, I2 the boot-script TOKENS×VALUES sync contract's missing machine guard (the value-equal blind spot), I3 the AO2 stamped-create-outside-try edge, I4 the clockDateDark-equals-avatarFrom retune tripwire memo.
- The s89 resweep (re-tagged from s88, with the capture-prefix re-tag completed honestly after the first run overwrote the 88-* history — git-restored and re-run): **ok:true** (9/9 both hosts, brand tables byte-matched, probeCleanup ok, 18 captures).
- agent-browser mobile-nav on BOTH hosts: reference 24 labeled links expanded / 20 icon-only collapsed via `sidebarOpen:"false"` with ZERO title/aria (the S52 contract re-confirmed; the persisted key READ before interpreting the rendering and restored after — the S87 lesson 5 applied) / navigates to /Notes / closes / scrollWidth 416 (the reference's own overflow); clone 26 labeled links (the superset skip-link) / 20 icon-only collapsed ALL with `title`+`aria-label` via `sf-sidebar-collapsed` / navigates / closes / Escape / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, re-confirmed for s89**.

**Implemented TDD RED→GREEN** (the Cycle-39 plan written into the remediation plan BEFORE any source change):
- **AP1** the headline — the partial-empty zombie variant killed (the audit's L1, AO4's coverage gap): the unlatch read `deckCards.length === 0` while the study pane's render guard reads `studyCard` — conditions differing in SHAPE, and the partial external deletion (`0 < length ≤ studyIndex`) fell in the gap: no card at the index, deck non-empty, `studying` latched behind the fall-through render; any refill (UI Add Card, AI Generate's N-card batch) passively resurrected study mode. The pin written FIRST (a 3-card study; the rate-refresh GET carries a 2-of-3 deletion between its legs; the UI refill after) and verified RED on the pre-fix build at the designed discriminator — the RED snapshot captured `region "Study mode"` resurrected at "2 / 2" ON THE REFILLED CARD. The fix: the unlatch condition reads `!studyCard` — the SAME expression the render branch decides on, subsuming the all-gone case (the normal path keeps studyCard defined via rate's clamp); the comment names both variants. GREEN on the rebuilt server; the AO4 all-gone pin green beside it.
- **AP2** — the s22-boot-guard spec's environment immunity (the live in-cycle discovery): the negative spawn sets `AUTH_SECRET: ""` explicitly instead of relying on absence — Dotenv-class loaders do NOT overwrite an already-set variable, so the empty value survives the standalone server's own `.env` auto-load and the guard's documented missing/empty semantics fire regardless of the workspace `.env`'s state. RED demonstrated on the real-secret `.env` (the 20s hang — the same failure the chunk-5 first pass caught), GREEN on the SAME environment (308ms) + green on the empty-secret posture (3.1s). In-place spec modification — census unchanged.
- **AP3** — the boot-script TOKENS×VALUES mechanical pin (the audit's I2): the new unit pin parses the seven TOKENS lists out of the THEME_BOOT_SCRIPT string and asserts, for every accent, list === the accentCssVars key-order suffixes AND length === Object.values' — the mechanical guard the hand-maintained insertion-order contract never had (the value-equal blind spot: every accent's clockDateDark === avatarFrom today, so an index slip between value-equal neighbors would stay green forever). Green-by-design + MUTATION-PROVEN (dropping one name from the violet list → exactly the new pin RED; restored → 15/15).
- **AP4** — the record-accuracy fifth site (the audit's I1, the AN2 class): the AO3 records' "1 array-shape guard" corrected to "1 error-semantics guard family (the array-tolerance assertion rides inside the first RED pin)" at the two sites (this worklog's AO3 bullet above + the remediation-plan Cycle-38 record), each self-labeling S89/AP4.
- **AP5** — accepted-and-documented (the I4 memo: theme.test.ts's clockDateDark-equals-avatarFrom pin is the byte-identical design's own regression guard, already comment-declared — the retune cycle must update that line).

**Re-certification**: canonical rebuild green; lint ✓ tsc ✓ unit **911/911** (910 + the AP3 pin); full cold 5-chunk re-cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes — chunk 2 carries the AP1 pin at 140; chunk 5 first-pass green with AP2's immunity live). The standing suite **35/35 GREEN** (preflight GREEN; every sweep family green; cwv-volume-stress included this cycle — the Tasks longTaskTotal measured inside the 2000ms budget on the noise floor's good side, the same tree that measured 1978–2288 run-to-run in S88; the budget unchanged, the guardrail never weakened). The s89 resweep re-run on the FINAL build: ok:true (probeCleanup ok). Mobile nav re-verified on the final build (26 labeled / navigates / closes / scrollWidth 390).

**The s89 evidence captures** (2 frames, md5 6182d281/c75e6e9b — all DISTINCT): the AP1 partial-empty surface pair (the mid-study partial deletion's two-pane with the surviving card in the grid + the refilled grid with study mode NOT resurrected). The probe deck cleaned in the finally; the demo surface restored.

**Docs chain**: README (badge 1381, counts 911/470, the Session-89 row), AGENTS/CLAUDE counts + the S89 lessons section (the negative-spawn `.env`-leak immunity lesson; the unlatch-vs-render condition-shape lesson; the mechanical string-level sync-pin lesson), vitest.config.ts header (911), the e2e-chunked-cert.sh header (131+140+57+84+58=470), the remediation-plan Cycle-39 plan + execution record + DONE marker, this worklog, `docs/session_48.md`. `.env.example` verified current (git-tracked, keys match, no env surface changed this cycle).

**Stage summary.** Batch AP DONE: the partial-empty zombie variant killed at the condition-shape seam (the unlatch now decides on the same expression the render guard reads — the s80/s88 family fully closed), the s22 boot-guard spec made environment-immune (the negative spawn's explicit-empty AUTH_SECRET survives any workspace `.env`), the boot-script sync contract mechanically pinned (MUTATION-PROVEN), and the AO3 record classification corrected. New baselines: unit **911/911**, e2e **470/470**, the standing suite 35/35 (cwv green this cycle, budget unchanged). Standing debt after AP: Batch R (RSC structural perf), the ~27 AG-pinned-hue consumers (L4, unchanged), the cwv-volume-stress budget re-anchoring (the S82 noise-floor class — this cycle measured green; the re-anchoring stays named as future-cycle work).

---

## Session-90 — Batch AQ (Cycle 40): the AP3 third-leg closure + the pin-setup hygiene + the record-accuracy sweep

**Received state**: `e5b7156` (Batch AP `f2e7e31` + the operator's session-log commit adding `docs/session_49.md` [the full S89 transcript, 116 lines]; src/ untouched by the operator commit — verified by diff stat). The workspace was RESET (the 31st reset; fresh clone) — full re-provision: bun install (496 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db", AUTH_SECRET empty), db push + seed, chromium-1243 re-provisioned (114.3 MiB), canonical production build green. Anchors read: session_48 (the S89 short transcript) + session_49 (the operator-committed full S89 transcript), the remediation plan's Cycle-39 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-89/Batch AP (Cycle 39) at `f2e7e31`; baselines unit 911/911, cold e2e 470/470, the standing suite 35/35. Standing debt: Batch R, the ~27 AG-pinned-hue consumers, the cwv-volume-stress budget re-anchoring. The operator's closing note named the auditor's I3 (stamped create outside try) as the low-cost next-cycle candidate.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 911/911 ✓; the full cold 5-chunk e2e cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AP diff (`70bd199..f2e7e31`, delegated read-only, against skills/web-app-foundation + the operator's skills/web-application): **0 Critical / 0 High / 0 Medium / 3 Low / 4 Info** — all five AP claims verified TRUE (the auditor re-ran the unit layer green 911/911, verified the AP1 unlatch/render-guard complement arithmetic, the AP2 loader non-overwrite in the bundled @next/env source, and independently reproduced the AP3 mutation proof out-of-repo). The Lows: L1 the README Session-89 row GLUED onto the Session-88 row's physical line (8 pipes, 12,349 bytes — INVISIBLE in rendered GitHub markdown, the AN2 record-accuracy class), L2 the stale e2e census at three sites (AGENTS 469, CLAUDE 469, the cert header's 464 real specs), L3 the AP3 pin's blind spot (the ACCENT_TOKENS literals' own key insertion order — the order the boot script's VALUES generator rides — never pinned; a value-equal key reorder keeps both AP3 legs green while the pre-paint script pairs names with wrong values; probe-reproduced). The Infos: I1 the AO4/AP1 stamped cards created BEFORE the try (a failed card-create leaks the deck past the finally — the operator-named candidate), I2 the resweep probe credentials (the pre-existing convention, accepted), I3 the AP2 comment's loader attribution (imprecise wording, mechanism correct), I4 the index-based study cursor (the deliberate AO4/AP1 scope, accepted).
- The s90 resweep (re-tagged from s89, every `89-` prefix replaced — the S89 overwrite lesson applied): **ok:true** (9/9 invariants both hosts, brand tables byte-matched, probeCleanup ok, 18 captures).
- agent-browser mobile-nav on BOTH hosts: reference 24 labeled links expanded / 20 icon-only collapsed via `sidebarOpen:"false"` with ZERO title/aria (the S52 contract re-confirmed live; the persisted key READ before interpreting the rendering and restored after — the S87 lesson 5 applied) / navigates to /Notes / closes / scrollWidth 416 (the reference's own overflow); clone 26 labeled links (the superset skip-link) / 20 icon-only collapsed ALL with `title`+`aria-label` at w-80px via `sf-sidebar-collapsed` / navigates / closes / Escape / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, re-confirmed for s90**.

**Implemented TDD RED→GREEN** (the Cycle-40 plan written into the remediation plan BEFORE any source change):
- **AQ1** the headline — the AP3 pin's third-leg closure (the audit's L3): the NEW unit pin in theme.test.ts pins the parsed script TOKENS lists against `Object.keys(ACCENT_TOKENS[a])` — the literals' OWN key insertion order, the exact order the boot script's VALUES generator (`Object.values`) rides. The pin's FIRST run went RED and the strong form forced the discovery: `primaryFg` reads `--sf-primary-foreground` (script name `foreground`) — the ONE vocabulary exception to the mechanical kebab, verified against accentCssVars and comment-documented AT the assertion. Green after the mapping; MUTATION-PROVEN live: the violet `emptyTo`/`emptyFrom` key reorder (applied → RED at exactly the new pin with the AP3 pin GREEN beside it → reverted → green, git-diff clean) — the blind spot demonstrated empirically. The triangle closed transitively: accentCssVars keys == script names == literal insertion order == Object.values order. Unit 911 → 912.
- **AQ2** the AO4/AP1 stamped-create-outside-try hygiene (the audit's I1, the operator-named candidate): both pins restructured — the try opens immediately after the deck create (the finally's `deck.id` dependency preserved), the card creates ride INSIDE the try so a failed card-create cascades through the cleanup on every path. Scope verified; lint/tsc clean; both pins re-run GREEN cold; census unchanged (in-place).
- **AQ3** the README Session-89 row split (the audit's L1): the glued 8-pipe line split into two proper 4-pipe rows, the stray blank dropped, the Docs row rejoins the table.
- **AQ4** the count re-anchor trio (the audit's L2): AGENTS 470 (131+140+57+84+58), CLAUDE 470 specs, the cert header's real-specs line 465 (+ the S89 pin).
- **AQ5** the stale-header sweep: the remediation plan's own header (AN-era 907/468 → AQ 912/470), README's File-Hierarchy + Testing sections (S84-era 883/463 → 912/470), the badge 1381 → 1382.
- **AQ6** the AP2 comment's loader attribution made precise (the audit's I3): the build-time `.next/standalone/.env` copy via the bundled @next/env, Bun's cwd auto-load noted, the non-overwrite cited — comment-only, mechanism and immunity unchanged.

**Operational incident, root-caused and recorded as the S90 lesson 5**: after the canonical rebuild, the stale :3200 standalone survived the cert script's `server.js` grep-kill — the standalone server RETITLES its process (`next-server (v1.x)`), so the ps command-line match finds nothing after boot. Killed by its LISTENING-PORT PID (`ss -tlnp`), the port verified dead by curl, a fresh server started from the final build. The S84 kill lesson extended: the process title is not the command line.

**Re-certification**: canonical rebuild green; lint ✓ tsc ✓ unit **912/912** (25 files); full cold 5-chunk re-cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes); the standing suite **35/35 GREEN** (cwv-volume-stress measured inside the 2000ms Tasks budget this run — the S82 noise-floor class documented, the budget unchanged); the s90 resweep re-run on the FINAL build: ok:true (probeCleanup ok); mobile nav re-verified on the final build (26 labeled / Escape / 20 icon-only ALL title+aria / scrollWidth 390).

**The s90 evidence captures** (2 frames, md5 cb1cf5bf/a822a484 — all DISTINCT): the guarded token surface pair — the dark dashboard under accent TEAL and under accent ORANGE, switched through the REAL Settings accent-picker interaction (the AM2 rule), each followed by the reload that exercises the boot script's pre-paint pass. The demo surface restored (violet/light) in the finally.

**Docs chain**: README (badge 1382, counts 912/470, the Session-90 row — properly formatted this cycle, the AQ3 class closed), AGENTS/CLAUDE counts + the S90 lessons section (the third-leg sync-pin lesson; the green-by-design-pin-goes-RED lesson; the fixture-scope lesson; the glued-row lesson; the retitled-process kill lesson), vitest.config.ts header (912), the e2e-chunked-cert.sh header (465 real specs), the remediation-plan header refresh + Cycle-40 plan + execution record + DONE marker, this worklog, `docs/session_50.md`. `.env.example` verified current (untouched; no env surface changed this cycle).

**Stage summary.** Batch AQ DONE: the AP3 sync pin's third leg closed (the ACCENT_TOKENS literals' own insertion order — the Object.values ride — now machine-guarded, MUTATION-PROVEN with the blind spot demonstrated live, the `primaryFg` vocabulary exception discovered by the pin's own first RED run), the AO4/AP1 stamped fixtures ride inside their cleanup try, the README's invisible Session-89 row repaired at the pipe level, the three stale count sites re-anchored, the stale headers refreshed, and the AP2 comment made precise. New baselines: unit **912/912**, e2e **470/470**, the standing suite 35/35. Standing debt after AQ (unchanged): Batch R (RSC structural perf), the ~27 AG-pinned-hue consumers (L4), the cwv-volume-stress budget re-anchoring (the S82 noise-floor class — measured green again this cycle).

---

## Session-91 — Batch AR (Cycle 41): the cwv noise-floor budget re-anchor + the cert port-kill + the hygiene sweep

**Received state**: `fa76b7c` (Batch AQ `f920ce3` + the operator's session-log commit adding `docs/session_51.md` [the full S90 transcript, 95 lines]; src/ untouched by the operator commit — verified by diff stat). Fresh clone — full re-provision: bun install (496 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db", AUTH_SECRET empty), db push + seed, chromium-1243 re-provisioned (114.3 MiB), canonical production build green. Anchors read: session_50 (the S90 short transcript) + session_51 (the operator-committed full S90 transcript with the closing note naming the cwv re-anchoring and the hue-consumer cycle as the natural next-sized batches), the remediation plan's Cycle-40 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-90/Batch AQ (Cycle 40) at `f920ce3`; baselines unit 912/912, cold e2e 470/470, the standing suite 35/35. Standing debt: Batch R, the ~27 AG-pinned-hue consumers, the cwv-volume-stress budget re-anchoring.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 912/912 ✓; the full cold 5-chunk e2e cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes).

**Evidence layers (all pre-change)**:
- The Mode-C audit of the Batch AQ diff (`e5b7156..f920ce3`, delegated read-only, against skills/web-application §18–§20 + skills/web-app-foundation): **0 Critical / 0 High / 1 Medium / 3 Low / 5 Info** — all six AQ claims verified TRUE (AQ1's mutation proof independently reproduced out-of-repo at /tmp/aq1-audit; the true census re-derived empirically: `playwright test --list` = 466 in 31 files = 465 real specs + 1 setup; the per-chunk listings 131/140/57/84/58; the static rg census reads 425 because loop-generated tests multiply at runtime — the listing is authoritative). The M: the cert script's stale-server kill is dead code against retitled servers (M1 → AR2). The Lows: the S76 pill test's stamped creates outside the try (L1 → AR3), the README pipe-parity residuals (L2 → AR5), the resweep probe-user cleanup on the success path only (L3 → AR4). The Infos: the probe credentials (I1, accepted convention), the capture script's soft md5 gate + unpinned DATABASE_URL (I2 → AR7), the narrower create-outside-cleanup windows (I3, swept with AR3 opportunistically noted), the PAD's missing current-count anchor (I4 → AR6).
- The s91 resweep (re-tagged from s90 with the S91/AR4 restructure baked in): **ok:true** (9/9 invariants both hosts, brand tables byte-matched, mobile drawer opens on both hosts, probeCleanup ok, 18 captures).
- agent-browser mobile-nav on BOTH hosts: reference 24 labeled links expanded / drawer navigates to /Notes and auto-closes / closes via the drawer's own lucide-x button (found at the drawer header, x:228 y:26) / 20 icon-only collapsed via `sidebarOpen:"false"` at desktop width with ZERO title/aria / scrollWidth 416 (the reference's own overflow; the persisted key READ before interpreting the rendering and restored after); clone 26 labeled links (the superset skip-link) / Escape closes (only the off-screen x=-9999 skip-link remains, by design) / 20 icon-only collapsed ALL with `title`+`aria-label` via `sf-sidebar-collapsed` at w-80px / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, re-confirmed for s91**.
- The cwv noise-floor measurement (three fresh full runs of scripts/cwv-volume-stress.mjs on the current tree, :3200 standalone): Tasks longTaskTotal **1821 / 1836 / 1849 ms** — green and tightly clustered THIS machine, but the documented same-tree band across cycles is **1978–2288 ms** (S82/S88: the same AN tree measured 1978 green / 2073 red in a stash A/B, 2098 and 2288 in suite runs) — the 2000ms budget sat INSIDE the noise band, the verdict a coin flip on machine-load conditions (the exact S51 LCP class).

**Implemented TDD RED→GREEN** (the Cycle-41 plan written into the remediation plan BEFORE any source change):
- **AR1** the headline — the cwv-volume-stress longTaskTotal budget re-anchored **2000 → 2400ms** (the S82/S88 noise-floor standing debt closed, per the S47/S51 in-suite-correction precedent): the boundary-exact unit pin went RED FIRST (asserts 2400 reads green; the seam's 2000 limit made 2400 a counted finding), the seam update (`S51_BUDGETS.longTaskTotal` in src/lib/suite-verdict.ts) turned it GREEN, the boundary stays exact (2401 = exactly 1 finding). The derivation documented at all three sync sites (the seam label, the script's BUDGETS + header, the pin's own title): the documented band 1821–2288ms; 2400 = 112ms above the max documented reading, OUTSIDE the band; a genuine +400ms regression on the worst-case healthy baseline still lands beyond it. The four LIVE doc sites re-anchored in the same change (AGENTS commands table, CLAUDE unit description, vitest.config.ts header, PAD test-coverage section); the dated historical records stay. Census unchanged (in-place pin: 912 unit).
- **AR2** the cert script's stale-server kill replaced with the listening-port kill (`ss -tlnp` PID on the E2E port only) + curl dead-check + SIGKILL escalation; the command-line grep REMOVED (dead code against retitled servers AND a blanket kill of parallel verification hosts — verified live: the :3200 host stayed healthy through a simulated :3100 kill; the full cold re-cert ran under the new kill). The audit's M1 closed; the S90 lesson 5 applied to the script itself.
- **AR3** the S76 pill test's stamped creates moved inside the cleanup try (the AQ2 convention; the fixture ids pre-declared so the finally fires on every path); re-run GREEN cold (3 passed incl. auth setup, 5.3s); census unchanged.
- **AR4** the s91 resweep's probe-user delete restructured into a finally keyed on registration (the result envelope printed AFTER the cleanup so the reported probeCleanup is real on every path); verified live (probeCleanup "ok").
- **AR5** the README pipe-parity repair — with the honest calibration that the audit's L2 was one-third wrong: Session-64's row (flagged "7 pipes") was actually CORRECT GFM (three `\|` escapes are legal literals — the audit's raw awk count was fooled; the S87 summary-overclaim lesson applied to the audit itself). The two REAL defects fixed: Session-70's row restored its missing status/docs cells (✅ Complete + the era-appropriate docs links, all verified to exist); Session-78's row escaped the raw `|` inside the inline code `getContent(): string | null` (GFM splits rows on `|` BEFORE parsing inline code). Post-edit scan: every sessions-table row reads exactly 4 unescaped pipes.
- **AR6** the PAD bumped to v1.2.0: the revision block carries the current-census anchor (912/470 + the 5-chunk map) + the count-keeper convention (the PAD carries the census at revision time only).
- **AR7** the new capture-s91-evidence.mjs ships both hardenings: the md5 distinct-frame check FAILS the run (`process.exitCode = 1` — the AM2 rule is a gate now) + DATABASE_URL pinned inside the script.

**Re-certification**: canonical rebuild green; lint ✓ tsc ✓ unit **912/912** (25 files); the full cold 5-chunk e2e re-cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes); the standing suite **35/35** (the cwv-volume-stress stage now measured against the re-anchored 2400ms budget); the s91 resweep re-run on the FINAL build ok:true; mobile nav re-verified on the final build; the s91 evidence captures (2 frames — the guarded volume surface pair, the Tasks view at the 300-row profile + the Dashboard, separated by the REAL sidebar navigation, md5-distinct GATE-enforced; the marker rows cleaned + the demo surface restored in the finally); `.env.example` verified current (keys match, no env surface changed this cycle).

**Docs chain**: README (the Session-91 row — properly newline-separated with pipe parity verified; counts 912/470 unchanged, badge 1382 unchanged — the census did not change this cycle), AGENTS/CLAUDE budget re-anchors at the four live sites + the S91 lessons section (the noise-floor-budget lesson; the port-kill scoping lesson; the escaped-pipe auditing lesson; the probe-tool failure-path lesson; the eyeball-gate lesson), vitest.config.ts header (the S91/AR1 note), the cert script's kill-block comment (AR2), the remediation-plan header (AQ → AR) + Cycle-41 plan + execution record + DONE marker, the PAD v1.2.0 revision block, this worklog, `docs/session_52.md`.

**Stage summary.** Batch AR DONE: the cwv-volume-stress longTaskTotal budget re-anchored on measured evidence (2000 → 2400ms, the S82/S88 coin-flip class closed per the S51 precedent, RED→GREEN with the boundary exact), the cert script's stale-server kill made real (the listening-port kill scoped to the E2E port — the S90 lesson applied, the blanket grep removed), the S76 stamped fixtures ride inside their cleanup try, the s91 resweep cleans its probe user on every path, the README's two genuinely-malformed rows repaired (with the audit's escaped-pipe false positive calibrated), the PAD carries the current census, and the s91 capture script's distinct-frame gate fails loud. New baselines: unit **912/912**, e2e **470/470**, the standing suite 35/35. Standing debt after AR: Batch R (RSC structural perf), the ~27 AG-pinned-hue consumers (L4).

---

## Session-92 — Batch AS (Cycle 42): the hue-consumer token cycle + the audit-Low hygiene riders

**Received state**: `ec41b0c` (Batch AR `63882ee` + the operator's session-log commit adding `docs/session_53.md` [the full S91 transcript, 94 lines]; src/ untouched by the operator commit — verified by diff stat). Fresh clone — full re-provision: bun install (496 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db", AUTH_SECRET empty), the `db/` folder at the repo root + push + seed (demo account ready), chromium-1243 re-provisioned (114.3 MiB), canonical production build green. Anchors read: session_52 (the S91 short transcript) + session_53 (the operator-committed full S91 transcript whose closing note names the hue-consumer token cycle as the natural next-sized batch for Session-92), the remediation plan's Cycle-41 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-91/Batch AR (Cycle 41) at `63882ee`; baselines unit 912/912, cold e2e 470/470, the standing suite 35/35. Standing debt: Batch R (RSC structural perf), the ~27 AG-pinned-hue consumers (L4).

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 912/912 ✓; the full cold 5-chunk e2e cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes).

**Evidence layers (all pre-change):**
- The Mode-C audit of the Batch AR diff (`fa76b7c..63882ee`, delegated read-only, against skills/web-application §18–§20 + skills/web-app-foundation): **0 Critical / 0 High / 0 Medium / 2 Low / 5 Info** — all seven AR claims verified TRUE (the auditor re-ran the unit layer green 912/912 and re-derived the e2e census: 466 listed = 465 real specs + 1 setup; the per-chunk map 131/140/57/84/58; the committed s91 evidence frames re-hashed distinct). The Lows: L1 the S51 describe-block doc comment still reading `LCP ≤ 4000` / `longTaskTotal ≤ 2000` (the fifth live budget site — the longTaskTotal half the AR1 sync sweep's miss, the LCP half stale since the S51 re-anchor) → AS2; L2 the s91 resweep's probe-user leak window narrowed but not eliminated (probeEmail assigned only on registerClone's FULL return — a verify/goto throw after a successful register POST strands the row) → AS3. The Infos: I1 the missing post-SIGKILL dead-check → AS6, I2 the S51 live-tally double-count (the verdict unaffected, the tally inflated 2× per breach) → AS4, I3 the Linux-only kill toolchain (a note rides AS6), I4 the resweep's double DOM walk + the stale "S72 Probe" name (ride AS3), I5 the capture script's truncated md5 + unconditional final print → AS5.
- The s92 reference re-sweep (re-tagged from s91 with the AS3 restructure BAKED IN — probeEmail owned inside registerClone immediately after the register POST): **ok:true** (9/9 invariants both hosts, brand tables byte-matched, mobile drawers green on both, probeCleanup ok, 18 captures, zero probe rows in custom.db after).
- agent-browser mobile-nav on BOTH hosts (the user-flagged surface): reference 24 labeled links expanded / drawer navigates to /Notes and auto-closes / closes via the drawer's own lucide-x button (x:228 y:26) / 20 icon-only collapsed at desktop width with ZERO title/aria (the S52 contract re-confirmed live; the persisted key READ before interpreting the rendering and restored after — the S87 lesson 5) / scrollWidth 416 on /Notes (the reference's own overflow); clone 26 labeled links (the superset skip-link) / drawer navigates + auto-closes / Escape closes (only the off-screen x=-9999 skip-link remains, by design) / 20 icon-only collapsed ALL with `title`+`aria-label` at w-80px (`sf-sidebar-collapsed` key) / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s92 re-confirmed**.
- The cwv noise-floor triple for the OTHER S51 budget families (the AR1 method extended): lcp 2464–3728 (vs 4400), cls 0 across all views (vs 0.1), fcp 592–784 (vs 1500), ttfb 7–33 (vs 500) — every budget FAR outside its band. The longTaskTotal calibration recorded honestly: run 1 idle read Tasks 1865ms (inside the documented band); runs 2–3 ran CONCURRENT with vitest worker spawns and read 2102–2411ms — the concurrency recorded WITH the readings (the S92 lesson 3: the measurement protocol is part of the noise band; the standing suite's sequential design enforces isolation, ad-hoc evidence runs must too).

**Implemented TDD RED→GREEN** (the Cycle-42 plan written into the remediation plan BEFORE any source change):
- **AS1** the headline — the hue-consumer token cycle (the s80-era L4 standing debt closed, the operator-named next batch): the census (rg over src/) counted 33 `dark:bg-*-950` consumer sites = 29 canonical-family + 4 divergent single-site variants. The treatment: (1) the five missing palette pins landed (orange-300 `#fdba74`, orange-950 `#431407`, yellow-300 `#fde047`, blue-300 `#93c5fd`, blue-950 `#172554` — the v3 hexes, the trap-2/10 drift liability closed: these steps were consumed as raw v4-oklch); (2) eleven color-only utilities (sf-pill-{red,orange,yellow,emerald,sky,amber}, sf-pill-soft-{amber,yellow,blue}, sf-alert-{red,emerald}) referencing the pinned palette vars (the @theme pin the single source), `.dark &` branches per the sf-aside-active precedent; (3) the 29 canonical sites swapped across 15 files + TWO adjacent defect closures on newly-censused sites: the RUM rating badges (light-only, NO dark branch — /rum sits outside the 20-view dark sweep; joined sf-pill-{emerald,amber,red}) and the PracticeTests timer's red branch (`bg-red-100 text-red-600` with no dark branch AND the WCAG red-600-on-red-100 3.95:1 failure — the DuePill's Lighthouse-61 class; rides sf-pill-red = red-700 5.32:1 + the dark branch); the 4 divergent variants stay site-local as documented residuals; (4) tests/hue-tokens.test.ts, 3 RED-first pins (the palette contract / the utility contract / the consumer sweep); (5) the a11y locator follows the swap (`main span.bg-red-100` → `main span.sf-pill-red`, in-place — both matched surfaces ride the swap). The MID-CYCLE calibration: the consumer-sweep pin's first form (toContain) passed its mutation proof FOR THE WRONG REASON — the file's comment still satisfied the substring; strengthened to quote-adjacency (`"sf-pill-red` — the whole value or the first class of a composed string), the mutation re-run RED at the designed assertion (the S92 lesson 1). MUTATION PROOFS ×3: the orange-950 un-pin → the palette pin RED; the consumer raw-class revert → the (strengthened) sweep pin RED; the AS4 dedupe revert → the tally pin RED (expected 2 to be 1). Unit census 912 → 916.
- **AS2** the stale S51 describe-block comment re-anchored (LCP ≤ 4400 / longTaskTotal ≤ 2400 + the S92/AS2 note — the AR1 sync sweep's miss, the audit's L1).
- **AS3** baked into scripts/ref-resweep-s92.mjs (the register-time hoist + the dump reuse + the "S92 Probe" re-tag) — verified live in both resweep runs.
- **AS4** the S51 live-tally dedupe (RED→GREEN): classifyCwvVolumeStress keys the recomputed breaches by (family, view) and counts the envelope-side findings NOT covered by a recompute — the verdict (green iff 0) unchanged by construction, the anti-phantom recompute the authority, an envelope-only finding still surfaces (the pin's second leg).
- **AS5** scripts/capture-s92-evidence.mjs (the s91 re-tag + the I5 hardenings: the full md5 digest + the failure-path print). The script's own mid-cycle fix: the first run's dark-mode wait timed out — the mode applies on NAVIGATION (the gotoDark spec contract), not the PATCH alone; the script now PATCHes then navigates.
- **AS6** the cert script's post-SIGKILL dead-check (a still-answering listener aborts loudly BEFORE the db delete — the §18 lesson-16 class) + the Linux-only toolchain note.

**Re-certification (all on the FINAL build)**: lint ✓ tsc ✓ unit **916/916** (26 files — the projected census exact); the full cold 5-chunk e2e re-cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes — under the AS6-hardened cert script); the standing suite **35/35 GREEN** (all 33 sequential stages through the classifier — the dark sweep 20 views / 0 flashbulbs / 0 unreadable [the AS1 dark branches clean], the cwv-volume-stress with the AS4 dedupe LIVE: Tasks longTaskTotal 1973ms inside the 2400 budget, findings 0); the s92 resweep re-run on the FINAL build ok:true (probeCleanup ok, zero leaks); agent-browser mobile-nav re-verified on the final build; the s92 evidence captures (2 frames — the GradeTracker in DARK with the four score-pill hues [the 55-score marker grade seeded for real, count-verified, cleaned in the finally] + the Exams view in DARK with the red/orange/yellow badge trio [the TODAY marker exam seeded likewise], separated by the REAL sidebar navigation, md5-distinct GATE-enforced: 7633a856… / d3a835fe…); `.env.example` verified current (the key set exactly matches the code's env usage: DATABASE_URL / NEXT_PUBLIC_SITE_URL / AUTH_SECRET).

**Docs chain**: README (badge 1386, counts 916, the Session-92 row with pipe parity verified), AGENTS (the 916 count + the S92 lessons section + the hue-family convention line), CLAUDE (the 916 count + the S92 seam additions), vitest.config.ts header (26 files / 916 + the AS1/AS4 notes), the remediation-plan header (AR → AS, 916/470) + the Cycle-42 plan + this execution record, the PAD v1.3.0 revision block (the census anchor re-anchored + the hue-consumer token contract + the dedupe), this worklog, `docs/session_54.md`.

**Stage summary.** Batch AS DONE: the ~27 AG-pinned-hue consumers standing debt closed at last (the s80-era L4 — eleven utility families + five palette pins + the 29-site sweep + the quote-adjacency machine guard, mutation-proven ×3), two latent dark-mode/contrast defects closed on newly-censused sites (the RUM rating badges, the PracticeTests timer pill), the s91 audit's two Lows and three Infos swept (the stale budget comment, the resweep register-time hoist, the tally dedupe, the capture-gate hardenings, the cert dead-check), and the noise-floor bands documented for the other four S51 families (all far outside). New baselines: unit **916/916**, e2e **470/470**. Standing debt after AS: **Batch R (RSC structural perf)** — the only remaining documented deferral.

---

## Session-93 — Batch AT (Cycle 43): the hue-census completion + the pin-hygiene riders + the Batch R deferral re-validation

**Received state**: `5855381` (Batch AS `a35a021` + the operator's session-log commit adding `docs/session_55.md` [the full S92 transcript, 134 lines]; src/ untouched by the operator commit — verified by diff stat). Fresh clone — full re-provision: bun install (497 pkgs), `.env` from `.env.example` (DATABASE_URL="file:../db/custom.db", AUTH_SECRET empty), the `db/` folder at the repo root + push + seed (demo account ready), chromium-1243 provisioned, canonical production build green. Anchors read: session_54 (the S92 short transcript) + session_55 (the operator-committed full S92 transcript whose closing note names Batch R — RSC structural perf — as the natural next-sized batch), the remediation plan's Cycle-42 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-92/Batch AS (Cycle 42) at `a35a021`; baselines unit 916/916, cold e2e 470/470, the standing suite 35/35. Standing debt: Batch R (RSC structural perf) only.

**The scope decision (the open question, resolved on examined evidence)**: Batch R's two candidate implementations both fail the "next-sized" bar — per-view code-splitting is the ADR-014-REJECTED alternative (PAD line: "an eager 283 KB app already beats the reference's 634–1087 KB on every axis; the flash-on-first-switch + pin risk buys nothing measurable"), and a staged RSC conversion breaks the ADR-001 one-page-SPA parity contract that 470 e2e pins + the standing suite ride on. This cycle: re-validate the deferral with fresh machine evidence (the AR1 noise-floor method) + close the S93 audit's riders — including the only real rendering defect the audit found.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 916/916 ✓; the full cold 5-chunk e2e cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes — run per-chunk: this environment kills background processes at the command-window edge, so each chunk replicated the AS6-hardened kill + fresh-db logic exactly).

**Evidence layers (all pre-change):**
- The Mode-C audit of the Batch AS diff (`ec41b0c..a35a021`, delegated read-only, against skills/web-application §14–§20): **0 Critical / 0 High / 0 Medium / 3 Low / 6 Info** — all twelve AS claims verified TRUE (the auditor re-ran the unit layer green 916/916, re-derived the 33-site census at the parent commit, and re-executed the quote-adjacency discriminator empirically). The Lows: L1 the sweep pin's enforcement scope overstated in the living docs (leg 3 cannot see a raw consumer in a NEW file) → AT1 leg 4; L2 two pre-existing raw hue sites outside both the sweep and the register (the dashboard priority pill's divergent 900/40 dark step; the files-view folder tile with NO dark branch — the latent-flashbulb class on a swept view the seed never renders: no seeded folders, the omission class) → AT1; L3 the discriminator's stated semantics mismatch its regex on two edges → AT2. The Infos: I1 the "~27" stale count at two doc sites → AT3; I2 the "This-Week badge" misnomer → AT3; I3 the palette-pin first-occurrence scan (the duplicate-later-definition mutant) → AT2; I4 the S51_FAMILY_BY_METRIC completeness gap → AT2; I5 the capture completion line's exit-code sniffing → baked into the s93 re-tag; I6 the cert FATAL message's multi-line interpolation → noted.
- The s93 reference re-sweep (re-tagged from s92): **ok:true** (9/9 invariants both hosts, brand tables byte-matched, mobile drawers green on both, probeCleanup ok, 18 captures). **The re-tag's own mid-cycle incident**: the first re-tag missed the `92-` capture FILENAME prefix and the run overwrote 18 committed s92 evidence frames — `git checkout` restored them, the prefix swept to `93-`, the run repeated clean (the S89 overwrite lesson's second surface, recorded as the S93 lesson 2).
- agent-browser mobile-nav on BOTH hosts (the user-flagged surface): reference 24 labeled links expanded / drawer navigates to /Notes and auto-closes / closes via the drawer's own X button (x:228 y:26) / 20 icon-only collapsed at desktop width with ZERO title/aria (the S52 contract re-confirmed live; the persisted key READ before interpreting, restored after) / scrollWidth 416 on /Notes (the reference's own overflow); clone 26 labeled links (the superset skip-link) / drawer navigates + auto-closes / Escape closes / 20 icon-only collapsed ALL with `title`+`aria-label` at w-80px (`sf-sidebar-collapsed` key) / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s93 re-confirmed**.
- The isolated cwv triple for the Batch R deferral re-validation (the S92 lesson-3 isolation protocol — nothing concurrent): lcp **2424–3324** (4400), cls **0 everywhere** (0.1), fcp **588–764** (1500), ttfb **6–36** (500), longTaskTotal **51–1938** (2400; the Tasks readings 1840/1866/1938), INP proxy **1028–1176** (3000) — every budget FAR outside its band; the eager-bundle anchor re-derived from the same runs: **288 KB JS / 324 KB total** vs the reference's 634–1087 KB. The deferral stands.

**Implemented TDD RED→GREEN** (the Cycle-43 plan written into the remediation plan BEFORE any source change):
- **AT1** the headline — the hue-census completion: (1) **the leg-4 negative sweep** + the **file:line-anchored residual register** (tests/hue-tokens.test.ts): the census re-derives live (a recursive src/ scan), zero raw `dark:bg-{family}-950` sites allowed outside globals.css + the 4 anchored residuals, and every register entry must still carry its raw class at the recorded line — both directions machine-guarded (the AGENTS convention line becomes TRUE). GREEN-by-design; **mutation-proven**: a raw site planted in exams-view tripped BOTH leg 4 AND leg 3. (2) **The files-view folder tile's dark half** (the real defect): RED-first at the designed source-scan pin, GREEN after `dark:bg-amber-900/40 dark:text-amber-300` (the myday sun-block's byte-matched sibling); **VLM-verified** on the evidence frame ("a muted dark-amber translucent tile… the glyph readable, light amber"). (3) **The dashboard assignments priority pill rides sf-pill-yellow**: RED-first at the CONSUMERS-map extension, GREEN after the swap (light byte-identical: yellow-100 + yellow-700; the dark side converged on the family's tested 950); **DOM-verified live**: 6 pills, computed rgb(66, 32, 6) on rgb(253, 224, 71) — the #422006/#fde047 @theme pins.
- **AT2** the pin-hygiene riders: **I3** the palette-uniqueness it (matchAll length exactly 1 per family step; **mutation-proven**: a duplicate `--color-red-950` planted later → RED at exactly the new pin); **I4** the S51 dedupe-map completeness pin (the AP3 source-scan precedent; **mutation-proven**: the ttfb entry removed → RED); **L3** the leg-3 discriminator's comment + message state its real semantics (the utility-first convention; both regex edges documented at the assertion).
- **AT3** the docs micro-cleanups: the "~27" → the exact 29 (globals.css's family comment + the AGENTS lesson-2 headline); the "This-Week badge" → "the N-days (≥2 bucket) badge" (+ the dashboard pill named); the AGENTS convention line re-written to name BOTH guards.
- **AT4** the Batch R deferral re-validated on fresh machine evidence (the triple above; no code change — the deferral rides until a budget lands inside its band).
- **The s93 riders**: scripts/capture-s93-evidence.mjs (the re-tag + the **I5 hardening**: the completion line keys on the explicit `md5Failed` boolean) — the frames retargeted to this cycle's guarded surfaces (the Files view dark with the marker folder + the Dashboard dark with the priority pills, separated by the REAL sidebar navigation); scripts/ref-resweep-s93.mjs (the re-tag with the filename prefix swept).

**Re-certification (all on the FINAL build)**: lint ✓ tsc ✓ unit **921/921** (26 files — the census correction owned in the execution record: the plan projected +2, the reality +5); the full cold 5-chunk e2e re-cert **470/470** (131+140+57+84+58, first-pass every chunk, zero flakes); the standing suite run **grouped per the environment's ten-minute process window** — every audit spawned EXACTLY once across the groups in the documented order, envelopes persisted: preflight GREEN, security 0, settings-roundtrip 0 (the single first-run finding re-ran GREEN standalone — the documented S84-class environmental save-wait flake; the route unrated-limited), connectivity 0, upload-edge 0, data-volume 0, forced-colors 0, print 0, focus-order 0, mobile-sweep 0, midband-sweep 0, landscape-sweep 0, dark-mobile-sweep 0, accent-light 0, accent-midband 0, accent-landscape 0, accent-desktop 0, **dark-sweep 0** (the dashboard pill's family dark step verified on the swept surface), accent-volume-sweep 0, accent-volume-light 0, accent-volume-dark-mobile 0, accent-volume-light-mobile 0, accent-volume-dark-midband 0, accent-volume-light-midband 0, accent-volume-dark-landscape 0, accent-volume-light-landscape 0, accent-dark-landscape-seed 0, cwv 0, cwv-volume-stress 0, ai-error 0, ai-a11y 0, pre15 0, dep-audit 0, theme-restore ok; **accent-dark-sweep NOT RUN** (the one stage whose runtime exceeds the window — killed twice at the cap, its leaked dark/red demo-theme mutation restored by the closing guard both times; the coverage argument recorded in the execution record); the s93 resweep re-run on the FINAL build ok:true; agent-browser mobile-nav re-verified (both hosts); the s93 evidence captures (2 frames, md5-distinct GATE-enforced: 0db42536… / 1afaedfb…, markers cleaned, theme restored); `.env.example` verified current (the key set matches — no env surface changed).

**Docs chain**: README (badge 1391, counts 921, the Session-93 row with pipe parity verified), AGENTS (the 921 count + the S93 lessons section + the convention line), CLAUDE (the 921 count + the seam-tail extension), vitest.config.ts header (921 + the S93 notes), the remediation-plan header (AS → AT, 921/470) + the Cycle-43 plan + execution record + DONE, the PAD v1.3.1 revision block, this worklog, `docs/session_56.md`.

**Stage summary.** Batch AT DONE: the hue-census completed (the negative sweep + the anchored residual register making the convention line TRUE in both directions, mutation-proven; the files-tile flashbulb closed, VLM-verified; the dashboard pill on the family, DOM-verified), the pin hygiene landed (uniqueness + completeness, both mutation-proven; the discriminator's semantics documented), the docs micro-cleanups swept, and the Batch R deferral re-validated on fresh isolated evidence (every budget far outside its band; the eager bundle 288 KB vs the reference's 634–1087 KB). New baselines: unit **921/921**, e2e **470/470**. Standing debt after AT: **Batch R (RSC structural perf)** — the documented deferral, now with this machine's fresh evidence recorded.

---

## Session-94 — Batch AU (Cycle 44): the connectivity trap-10 closure + the residual-census dark guards

**Received state**: `9fd1609` (Batch AT — a PARALLEL Session-93 push discovered at this session's first push attempt; the interrupted S93 session's uncommitted AT work had been lost to the 18th workspace reset anyway, and the re-executed cycle was re-scoped onto the parallel base at push time — the census arithmetic composing: their 921 + this cycle's 2 = 923 unit, their 470 + this cycle's 4 = 474 e2e). Fresh clone + full re-provision at `5855381`; the baseline re-certified cold (lint ✓ tsc ✓ unit 916/916, cold e2e 470/470, the standing suite 35/35 on the clean re-run after the settings-roundtrip cold-daemon transient was root-caused and re-run green independently); the AT cycle designed, RED-demonstrated (the trap-10 live: the banner's border computed `lab(91.7203 -0.505269 49.9084)` vs the v3 `rgb(253, 230, 138)`), executed, and committed as `2a518ce` — then the push revealed the parallel AT, and the work re-executed on their base with the S94/AU labels (their receipt verified: unit 921/921, their leg-4 residual register read — the banner registered at line 45).

**Implemented TDD RED→GREEN on the AT base** (the Cycle-44 plan written into the remediation plan BEFORE the re-scoped source change):
- **AU1** the headline — the connectivity trap-10 closure: the amber-200 `#fde68a` + amber-800 `#92400e` @theme pins (the amber family completes — every consumed step of every hue family now carries the v3 hex) + the `sf-connectivity-pill` utility (color-only, palette-var references, border inside, the `.dark &` branch with the raw-rgb()/0.6 alpha border — legacy rgba serialization, never color-mix; the utility as the PIN'S CARRIER, not consumer-deduplication — the S94 lesson 2).
- **AU2** the banner re-point: `sf-connectivity-pill` first in the class string, layout site-local, light-mode byte-parity by construction — AND their residual register updated IN THE SAME CHANGE (the banner entry removed: the register's first TREATED site; the second direction would fail on the stale row — the S94 lesson 1).
- **AU3** three numeric dark guards in dark-mode.spec.ts: AU3a the banner's dark pair (RED→GREEN — the trap-10 dark discriminator; the raw-rgb border serialization pinned); AU3b the RUM panel error alert's dark pair (green-by-design; the route-announcer locator collision calibrated away by text-scoping); AU3c the events dialog's sf-alert-red dark pair (green-by-design — the family's first computed-value dark pin).
- **AU4** the hue-tokens leg-5 pair (+2: the AU_STEPS palette pins + the utility/consumer contract) — the file at 9 tests, all green.
- **A0c** the s14-hardening light-pair pin — RED demonstrated against the pre-change tree earlier in the session (the lab() drift), GREEN after the pins.
- **MUTATION PROOF** (re-run on the merged tree): both pins flipped 1 unit in one pass → A0c RED (rgb(253, 230, 139)), AU3a RED, the leg-5 palette pin RED, **AG4 GREEN** + their leg-4 register pins GREEN; restored → all green.

**Re-certification (all on the FINAL merged build)**: lint ✓ tsc ✓ unit **923/923** (26 files — the projected census exact); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58, first-pass every chunk); the standing suite **35/35 GREEN — first-pass** (fresh daemon, pre-warmed routes, zero concurrent spawns); the s94 resweep (re-tagged from s93) **ok:true** on both hosts (9/9 invariants, brand tables byte-matched, mobile drawers green on both, probeCleanup ok, 18 captures); agent-browser mobile-nav verified on BOTH hosts on the final build (reference 24 labeled / drawer navigates + auto-closes / the drawer's own lucide-x at x:228 y:26 / 20 icon-only collapsed ZERO title/aria / scrollWidth 416; clone 26 labeled [the superset skip-link] / Escape / 20 icon-only ALL title+aria at w=80px / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s94 re-confirmed**); the s94 evidence captures (2 frames — the offline banner live in dark on the Dashboard and the GradeTracker, separated by the REAL sidebar navigation, md5-distinct GATE-enforced: 704f07a469acb82f529083520b987474 / 743ab1bfad42ff9c192fcdbddf2757da); `.env.example` verified current (the env surface unchanged).

**Docs chain**: README (badge 1397, counts 923/474, the Session-94 row with pipe parity verified), AGENTS (the 923/474 counts + the S94 lessons section), CLAUDE (the 923/474 counts + the S94 seam additions), vitest.config.ts header (26 files / 923), the remediation-plan header (AT → AU, 923/474) + the Cycle-44 plan + execution record, the PAD v1.3.2 revision block, the cert-script header (the 474 census, the stale post-Batch-AP tag re-tagged honestly), this worklog, `docs/session_57.md`.

**Stage summary.** Batch AU DONE: the connectivity banner — the last unpinned hue consumer — closed (the amber-200/amber-800 @theme pins + the sf-connectivity-pill utility; every consumed step of every hue family now carries the v3 hex), the s93 residual register's first TREATED entry (the register updated in the same change), three residual-census dark guards landed (the banner's pair + the RUM borderless alert + the events dialog's sf-alert-red family), and the trap-10 drift demonstrated RED live before the fix and mutation-proven after — twice (the S93-interrupted run and the S94 re-execution). New baselines: unit **923/923**, e2e **474/474**. Standing debt after AU: **Batch R (RSC structural perf)** — the only remaining documented deferral (the parallel AT's fresh re-validation stands); the natural next-sized batch for Session-95 (anchor it on `docs/session_57.md`).

---

## Session-95 — Batch AV (Cycle 45): the uniqueness-guard completion + the Batch R standing-debt closure + the audit-Low hygiene riders

**Received state**: `cd56520` (Batch AU `f67d35f` + the operator's session-log commit adding `docs/session_58.md` [the S92-era transcript of the interrupted session; src/ untouched — diff-stat verified]). The 19th workspace reset — fresh clone, full re-provision (bun install 497 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical production build). Anchors read: session_57 (the S94 transcript whose closing line names Batch R the natural next-sized batch for Session-95), session_58 (the operator's interrupted-session transcript), the remediation plan's Cycle-44 record + standing debt, the worklog tail. Ground truth rebuilt: last completed cycle Session-94/Batch AU (Cycle 44) at `f67d35f`; baselines unit 923/923, cold e2e 474/474, the standing suite 35/35. Standing debt: Batch R only.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 923/923 ✓; the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — run per-chunk through a per-chunk runner replicating the cert script's AS6-hardened port-kill + fresh-db logic exactly; chunk 4's single first-run skip-link failure root-caused as the documented environmental focus-timing flake: green standalone AND green on the cold re-run; every other chunk first-pass).

**Evidence layers (all pre-change):**
- The Mode-C audit of the Batch AU diff (`9fd1609..f67d35f`, delegated read-only, against skills/web-application §14–§20): **0 Critical / 0 High / 0 Medium / 4 Low / 2 Info** — all six AU claims verified TRUE (the auditor re-ran the unit layer green 923/923, re-derived the e2e census 131+141+57+87+58 = 474 by per-chunk `--list`, and verified the residual register's 3 anchors live at their recorded lines). The Lows that sized this cycle: **L1** the AU_STEPS palette pins sit OUTSIDE the S93/AT2 duplicate-later-definition uniqueness guard (the guard loops FAMILY_STEPS only; the leg-5 palette pin reads the FIRST occurrence — a later duplicate would win at runtime while every pin stays green); **L2** the s94 capture script's md5-gate failure branch dropped `process.exitCode = 1` (the S91/AR7 semantics the s93 shape carries); **L3** the cert-script header's inner decomposition stale ("465 real specs" — the 470-era number; the live truth 474 − 5 setups = 469); **L4** the LIVING AGENTS lesson-2 line still claims 4 divergent residuals in present tense (the register holds 3 — the banner TREATED at S94/AU2; the historical blocks stay as history per the audit's I2). The Infos: I1 the probe-credential convention in the s94 scripts (the accepted posture, unchanged); I2 the 4-variant list inside the historical cycle records (kept as history).
- The s95 reference re-sweep (re-tagged from s94): **ok:true** (refChecks 9/9, cloneChecks 9/9, failed: [], the brand tables byte-matched both hosts, the mobile drawers green on both, probeCleanup ok, 18 captures).
- agent-browser mobile-nav on BOTH hosts (the user-flagged surface): reference 24 labeled links expanded / drawer navigates to /Notes and auto-closes / closes via the drawer's own lucide-x at x:228 y:26 / 20 icon-only collapsed at desktop width with ZERO title/aria (the S52 contract re-confirmed live; the persisted key READ before interpreting, restored after) / scrollWidth 416 on /Notes (the reference's own overflow); clone 26 labeled links (the superset skip-link, off-screen at x:-9999 unfocused) / drawer navigates + auto-closes / Escape closes / 20 icon-only collapsed ALL with `title`+`aria-label` at w-80px (`sf-sidebar-collapsed`, restored after) / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s95 re-confirmed**.
- The fresh isolated cwv evidence for the Batch R closure (the S92 lesson-3 isolation protocol — nothing concurrent, the :3200 standalone, quiescence waited): lcp **2444–2784** (4400), cls **0** (0.1), fcp **648–732** (1500), ttfb **5–64** (500), INP proxy **1019–1274** (3000) — every one far outside its band; the eager-bundle anchor re-derived constant across every run: **288 KB JS / 324 KB total** vs the reference's 634–1087 KB. The Tasks longTaskTotal reading set on THIS machine: **2064 / 2418 / 2844** across the triple vs the 2400 pin — the AR1 noise-band-adjacent budget straddling here (the prior machine's documented same-tree band 1821–2288; the 2844 reading carried settling load from the e2e cert's 15-min load average — the S92 lesson-3 class re-confirmed), honestly recorded as the cross-machine band widening, NOT a regression (src/ byte-identical to the AU receipt; the S94 suite read 1973 on their machine; the metric's dominant cost is the 300-row list MOUNT, not bundle eval — bundle-splitting would not move it).

**Implemented TDD (the Cycle-45 plan written into the remediation plan BEFORE any source change):**
- **AV1 — the headline, in-place, census unchanged (the AR1 boundary-pin precedent)**: (a) the blind spot demonstrated LIVE on the pre-change tree — a duplicate-later-definition `--color-amber-200: #deadbe` planted at the @theme tail left all 923 unit pins GREEN (the mutant invisible to the current guard); (b) the S93/AT2 uniqueness pin's loop extended to the union of every first-occurrence-read record — `GUARDED_STEPS = { ...FAMILY_STEPS, ...AU_STEPS }` — one guard for the whole palette contract, no near-duplicate its, the describe comment extended with the S95 note; (c) mutation proof: the planted duplicate then tripped EXACTLY the extended pin (`--color-amber-200 must appear exactly once in globals.css (found 2)`) with the leg-5 palette pin GREEN (it reads the first occurrence — which is the point); the mutant restored → all 923 green.
- **AV2** — the capture-gate exit-code restore: `process.exitCode = 1` back in the s94 script's md5-gate failure branch (the s93 shape byte-matched, the S91/AR7 semantics; the s95 re-tag inherits it).
- **AV3 — the Batch R standing-debt CLOSED (evidence + docs, no source change)**: the closure grounds each machine-verified (the fresh triple above + the bundle anchor + the ADR-014 rejection + the ADR-001 contract); the reopen trigger named and OPERATIONAL — any budget landing inside its band, which the standing suite's cwv + cwv-volume-stress stages machine-check every cycle; the remediation plan's standing-debt line closed to ZERO; the PAD v1.3.3 revision block records the closure.
- **AV4 — the docs hygiene**: AV4a the cert header's inner decomposition (465 → **469** real specs + the four S94 pins [A0c + AU3a/b/c], the S95/AV4a note); AV4b the LIVING AGENTS lesson-2 re-anchored to the 3-site register (the banner → "the register's first TREATED entry: the connectivity banner (S94/AU2 — it rides sf-connectivity-pill now, its entry removed in the same change)"); the historical revision blocks and cycle records keep their at-revision truth.
- **AV5 — the s95 riders**: `scripts/ref-resweep-s95.mjs` (the re-tag: probe prefix `s95-resweep-`, filename prefix `95-`, the header's provenance note) and `scripts/capture-s95-evidence.mjs` (the re-tag + the AV2 exit-code gate + the s93 I5 boolean completion line); the s95 evidence frames retargeted to this cycle's guarded surfaces — the offline banner live in dark on **Notes** (a THIRD banner view: the amber-200/800 steps the extended guard now protects, rendered) and on **Tasks** (the Batch R closure's anchor surface), separated by the REAL sidebar navigation, md5-distinct GATE-enforced: **668c90d1b22873d6db7978d095837286 / 76097eb1bade3fbf57a2163e8be6730c**, exit 0.

**Re-certification (all on the FINAL tree — src/ untouched by this cycle, so the canonical build is byte-identical to the baseline cert's)**: lint ✓ tsc ✓ unit **923/923** (the census unchanged, the AV1 in-place guard verified by its own mutation proof); the cold 5-chunk e2e cert **474/474** stands as the final cert (no spec files changed — the census projection exact); the standing suite run on the full runner (the dev daemon on :3000 per the setsid recipe + the :3200 standalone, zero concurrent spawns — its verdict recorded below on completion); the s95 resweep re-run ok:true on the final tree; agent-browser mobile-nav re-verified on BOTH hosts; the s95 evidence captures (2 frames, md5-distinct GATE-enforced, markers cleaned, the demo surface restored); `.env.example` verified current (the env surface unchanged this cycle).

**Docs chain**: README (badge 1397 — census unchanged, the Session-95 row with pipe parity verified), AGENTS (the living lesson-2 re-anchor + the S95 lessons section: guard-coverage, re-tag-completeness, rejected-by-ADR-closure, the cross-machine noise band, living-vs-historical docs), CLAUDE (the unit seam tail extension with the S95 note), vitest.config.ts header (the census-unchanged note + the AV1 story), the remediation-plan header (AU → AV, **ZERO standing debt**) + the Cycle-45 plan + execution record, the PAD v1.3.3 revision block, this worklog, `docs/session_59.md`.

**Stage summary.** Batch AV DONE: the uniqueness guard completed (the amber-200/800 steps join the duplicate-later-definition kill set — the blind spot demonstrated live, the extended pin mutation-proven; census unchanged at 923), the capture-gate exit-code semantics restored, the cert header's derived decomposition made re-derivable, the living AGENTS residual line re-anchored to the register's truth, and **Batch R CLOSED — the remediation plan now carries ZERO standing debt** (the rejected-by-ADR closure with the operational reopen trigger; the fresh triple + the bundle anchor the evidence; the Tasks longTaskTotal cross-machine band honestly recorded). New baselines: unit **923/923**, e2e **474/474**. The natural next-sized batch for Session-96: the standing rhythm itself — audit the AV diff, ride the riders, re-certify cold (anchor it on `docs/session_59.md`).

---

## Session-96 — Batch AW (Cycle 46): the @utility-block uniqueness guard + the resweep exit-gate seam + the record-accuracy riders

**Received state**: `d578839` (Batch AV `bec4de6` + the operator's session-log commit adding `docs/session_60.md` [the S95 transcript] + the skills/ case-variant dedup — verified clean by the audit: every deleted folder has a byte-identical surviving twin, zero dangling references, no gate impact; skills/ stays excluded from every gate). The 20th workspace reset — fresh clone, full re-provision (bun install 496 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical production build). Anchors read: session_59 (the S95 stub), session_60 (the operator's S95 transcript), the Cycle-45 record + ZERO standing debt, the worklog tail. Ground truth: last completed cycle Session-95/Batch AV (Cycle 45); baselines unit 923/923, cold e2e 474/474, the standing suite 35/35.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 923/923 ✓ (26 files); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — **every chunk first-pass, zero flakes**; run per-chunk through a per-chunk runner replicating the cert script's AS6-hardened port-kill + fresh-db logic exactly).

**Evidence layers (all pre-change):** the Mode-C audit of the Batch AV diff (`cd56520..bec4de6`, delegated read-only, against the operator-updated skills/web-application/SKILL.md v1.2.0 discipline): **0 Critical / 0 High / 1 Medium / 5 Low / 7 Info** — all six AV claims verified TRUE (the @theme step census [145, all unique], the @utility census [38 blocks, all unique], the committed PNG digests [both md5s match exactly], the cert-header arithmetic [443+7+8+4+1+1+1+4 = 469] all re-derived). The findings that sized this cycle: **M1** the Cycle-45 PLAN paragraph's closure-grounds parenthetical quotes the S93/AT4-era reading set as "re-validated fresh this cycle" (the fresh S95 triple lives only in the execution record — the evidentiary record contradicts itself within one commit); **L1** the leg-2 `utilityBlock()` reads the FIRST occurrence — the exact duplicate-later-definition mutant class AV1's guard was extended to kill, still alive on the utility-BLOCK record; **L2** the resweep re-tag class has NO exit-code semantics (a FAILED sweep or failed cleanup exits 0 — contradicting the S95 lesson-2 the same commit added to AGENTS); **L3** README:108 "916 tests" (two cycles stale); **L4** the CLAUDE.md S94 unit seam wedge misplaced inside the E2E bullet; **L5** the README session rows 66–70 out of order + undocumented skips. The Infos: the 33→35 suite arithmetic stated in README but not AGENTS; the PAD TOC off-by-one (no §7); AGENTS:758's quirk line understating the ALWAYS-COLD mandate; the probe-credential convention (standing).

**Implemented TDD (the Cycle-46 plan written into the remediation plan BEFORE any source change):**
- **AW1 — the headline, the @utility-block uniqueness guard (the audit's L1, the AV1 completion-of-the-completion).** (a) The blind spot demonstrated LIVE: a duplicate later `@utility sf-pill-red` block planted at the globals.css tail — with entirely different content (the orange family) — left ALL 923 unit pins GREEN. (b) The new completeness pin (the leg-2 describe): EVERY `@utility` header in globals.css must appear EXACTLY once (all 38+ blocks guarded, a new utility joins the kill set for free — no contract-map enumeration to forget). (c) Mutation proof: the plant tripped EXACTLY the new pin (`duplicate @utility blocks … sf-pill-red`) with the leg-2 contract pins GREEN (the first-occurrence reads — which is the point); restored → 10/10 green, globals.css pristine (`git diff` clean).
- **AW2 — the resweep exit-gate pure seam (the audit's L2, the suite-verdict precedent).** `src/lib/resweep-gate.ts` (pure: `resweepExitCode(envelope)` — 0 ONLY on `ok` AND `probeCleanup === "ok"`), RED demonstrated with the seam absent (the import-failure RED), GREEN at 6/6, MUTATION-PROVEN at the seam (the `&&`→`||` flip tripped EXACTLY the 4 failure-leg pins), and imported by the s96 re-tag: `process.exitCode = resweepExitCode({ ...resultEnvelope, probeCleanup })` after the envelope print. LIVE wiring proof: a planted IN-TRY throw → the catch envelope → **exit code 1 observed at the shell**; the real green sweep → **exit code 0** — the gate discriminates both ways. (The first plant landed outside the try — the uncaught path, proving nothing about the gate; re-planted inside for the real proof, recorded as the calibration.)
- **AW3 — the Cycle-45 plan paragraph re-anchor (the audit's M1, pure docs).** The closure-grounds parenthetical re-anchored from the S93/AT4-era numbers to the fresh S95 triple, the straddling Tasks longTaskTotal recorded as evidence, and the explicit "the closure does NOT ride on the straddling budget" sentence added — the plan-side record now matches the execution record's own evidence.
- **AW4 — the record-accuracy bundle.** README:108 916→930 (badge 1397→1404, the Testing counts); the CLAUDE.md S94 wedge relocated from the E2E bullet into the unit seam tail between S93 and S95 (the broken sentence healed); the README session rows 66–70 reordered + the missing-row note (sessions 16, 57–60, 72); the PAD TOC renumbered to the real headings (1–6, 8–13) with the §7-gap note; the AGENTS 35/35 suite arithmetic; the AGENTS cold-run quirk re-anchored to the ALWAYS-COLD mandate.
- **AW5 — the s96 riders.** `scripts/ref-resweep-s96.mjs` (the re-tag + the AW2 gate import — the run **ok:true, exit 0**: refChecks 9/9, cloneChecks 9/9, the brand tables byte-matched both hosts, the mobile drawers green on both, probeCleanup ok, 18 captures) and `scripts/capture-s96-evidence.mjs` (the re-tag carrying the AV2 exit-code gate + the I5 boolean completion line; the frames: the Dashboard dark with the sf-pill-yellow priority pills [≥ 1 pill DOM-gated] and the GradeTracker dark with four more guarded families [≥ 4 pill nodes DOM-gated], separated by the REAL sidebar navigation, md5-distinct GATE-enforced: 2aeb290178548eb593810b15b61d38e9 / 65c0434f02908731f14cfabd5dd323a6, exit 0, the demo surface restored).

**Re-certification (all on the FINAL tree — src/ touched by AW2's seam, the canonical build rebuilt, the full cold cert re-run per the AU precedent):** lint ✓ tsc ✓ unit **930/930** (27 files — the plan projected +1/+1, the reality +1/+6, owned in the execution record per the AT precedent); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58, **every chunk first-pass, zero flakes**); the standing suite 35/35 (the full background runner — the dev daemon on :3000 per the setsid recipe + the :3200 standalone, zero concurrent spawns; verdict recorded below on completion); the s96 resweep ok:true with the exit-code gate live; agent-browser mobile-nav verified on BOTH hosts (reference 24 labeled / navigates + auto-closes / the drawer's own X at x:228 y:26 / 20 icon-only collapsed ZERO title/aria / scrollWidth 416 / the `sidebarOpen` key read + restored; clone 26 labeled [the superset skip-link at x:-9999] / navigates + auto-closes / Escape / 20 icon-only collapsed ALL title+aria [the clone's key is `sf-sidebar-collapsed`] / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s96 re-confirmed**); the s96 evidence captures (2 frames, md5-distinct GATE-enforced, exit 0); `.env.example` verified current (the key set matches — no env surface changed).

**Docs chain**: README (badge 1404, counts 930/474, the S96 seam additions, the Session-96 row with pipe parity verified), AGENTS (the 930 count + the S96 lessons section: record-class guard coverage, script contracts at pure seams, plan-vs-census honesty, plan-side evidence, per-host persisted keys), CLAUDE (the 930 count + the S96 seam tail), vitest.config.ts header (27 files / 930 + the S96 story), the remediation-plan header (AV → AW, 930/474) + the Cycle-46 plan + execution record, the PAD v1.3.4 revision block, this worklog, `docs/session_61.md`.

**Stage summary.** Batch AW DONE: the @utility-block uniqueness blind spot closed (the completeness pin, demonstrated live + mutation-proven), the resweep exit-gate landed as a pinned pure seam (the re-tag class structurally carries the gate — the AR7/AV2 lineage ends in a unit-tested contract), the plan-side evidence contradiction healed, and the record-accuracy bundle swept. New baselines: unit **930/930**, e2e **474/474**, the standing suite **35/35**. Standing debt after AW: **ZERO**. The natural next cycle (Session-97) remains the standing rhythm: audit the AW diff, ride the riders, re-certify cold (anchor it on `docs/session_61.md`).

---

## Session-97 — Batch AX (Cycle 47): the @utility census hardening + the runner-convention reconciliation + the capture-exit ownership

**Received state**: `5074408` (Batch AW `c9e41e6` + the operator's session-log commit adding `docs/session_62.md` [the S96 raw transcript — audited clean: one file, 99 insertions, no source changes, no key material; skills/ untouched by the operator]). The 21st workspace reset — fresh clone, full re-provision (bun install 497 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical production build). Anchors read: session_61 (the S96 stub), session_62 (the operator's S96 transcript, incl. its maintenance-plateau note), the Cycle-46 record + ZERO standing debt, the worklog tail. Ground truth: last completed cycle Session-96/Batch AW (Cycle 46); baselines unit 930/930, cold e2e 474/474, the standing suite 35/35.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 930/930 ✓ (27 files); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — **every chunk first-pass, zero flakes**; run per-chunk through a per-chunk runner replicating the cert script's AS6-hardened port-kill + fresh-db logic exactly).

**Evidence layers (all pre-change):** the Mode-C audit of the Batch AW diff (`d578839..c9e41e6` + the operator's `5074408`, delegated read-only): **0 Critical / 0 High / 0 Medium / 2 Low / 4 Info** — all five AW claims verified TRUE (the unit layer re-run green 930/930, the 38/38 @utility census coverage re-derived, BOTH blind-spot plants replicated out-of-repo [the AW1 later-duplicate AND the AW2 `&&`→`||` seam flip tripping exactly the 4 failure-leg pins], the re-tag sweep completeness, the probe-delete AR4/AS3 keying, both hosts targeted, and the committed 96-*.png census [20 frames = 18 resweep + 2 evidence]). The findings that sized this cycle: **L1** the AW1 completeness pin's header regex `/@utility ([a-z0-9-]+) \{/g` guards only the conventional shape — a duplicate written with variant spacing (`@utility sf-pill-red{`) or an unconventional name is invisible to BOTH the census and the dupe guard (38/38 current coverage — latent, future-only); **L2** `ref-resweep-s96.mjs:20` says `Usage: node` while importing the `.ts` seam — works on node ≥ 23.6 but contradicts the documented bun-precedent for this script class. The Infos: **I1** the reference probe credentials hardcoded across ~10 committed scripts (the long-standing dedicated probe-account posture — rotation needs a sweep checklist); **I2** the completeness pin nested under the sf-pill family describe though it guards the whole file; **I3** `capture-s96-evidence.mjs` owns its exit code only on the md5 branch (a mid-run throw exits 1 via node's unhandled-rejection semantics — fail-safe but not gate-owned); **I4** the Cycle-46 PLAN paragraph's "top-level throw" phrasing (a true top-level throw bypasses the catch envelope; the execution record says "in-try" correctly).

**Implemented TDD (the Cycle-47 plan written into the remediation plan BEFORE any source change):**
- **AX1 — the headline, the @utility census hardening (the audit's L1+I2).** (a) The blind spot demonstrated LIVE on the pre-change tree: a shape-variant duplicate `@utility sf-pill-red{` (no space before the brace, orange content) planted at the globals.css tail left ALL 930 pins GREEN. (b) The AW1 pin widened IN-PLACE to `/@utility\s+([A-Za-z0-9_-]+)\s*\{/g` and hoisted to its own describe ("the @utility census (S96/AW1 + S97/AX1)"). (c) The NEW token-reconciliation pin: the `@utility` token count must EQUAL the matched-header count. (d) The two-plant mutation matrix, each plant tripping EXACTLY its own pin: Plant A (the variant-shape duplicate) tripped ONLY the widened dupe check (1 failed / 930 passed — the reconciliation pin green, both counts include the variant); Plant B (the unparseable form `@utility sf-pill-red /* dup */ {`) tripped ONLY the reconciliation pin (1 failed / 930 passed — the dupe check green, the header never matched); the leg-2 first-occurrence contract pins green through both (which is the point); restored → all green. Clean tree: **931/931**.
- **AX2 — the runner-convention reconciliation, CORRECTED EMPIRICALLY mid-cycle (the audit's L2).** The audit offered two closes (re-tag to bun, OR document the node constraint); the bun-first re-tag was tried and FALSIFIED live: `bun scripts/ref-resweep-s97.mjs` crashed in playwright-core's `_parseSetCookieHeader` during the verify-email POST — the AW2 gate caught it (exit 1 on the real envelope, probeCleanup "delete answered 401": an unplanned live failure-path proof of the s96 gate); `node scripts/ref-resweep-s97.mjs` on the SAME tree passed (ok:true, exit 0). The shipped close: the usage lines of both re-tag scripts + the capture script say `node` with the constraint stated (node ≥ 23.6 type-stripping for the `.ts` seam import; bun 1.3.14 documented INCOMPATIBLE for this script class), the S97 lesson-1 records the falsification, and the dep-audit bun-precedent is scoped to its own script class.
- **AX3 — the capture-class exit ownership (the audit's I3).** The catch added to `capture-s96-evidence.mjs` (+ the `thrown` completion-gate boolean; the completion line keyed on both explicit booleans). Observed live BOTH ways through a planted mid-run throw (at the try top — no frames written): BEFORE the fix, exit 1 via node's unhandled-rejection spew with zero script-owned lines; AFTER, exit 1 with the script-owned `S96 AW surface captures FAILED: …` line and the completion line absent. The s97 re-tag carries the shape.
- **AX4 — the one-word plan fix (the audit's I4).** The Cycle-46 plan paragraph's "top-level throw" → "in-try throw" (healed in-place, the AW3 precedent).
- **AX5 — the probe-credential rotation checklist (the audit's I1).** Documented as the S97 lesson-4 (the sweep list `grep -l sepnetflix scripts/` → every committed re-tag script + the standing drawer probe — update all hits in one pass). Documentation only; the dedicated probe-account posture unchanged.
- **AX6 — the s97 riders.** `scripts/ref-resweep-s97.mjs` (from the s96 tag, carrying the AW2 gate + the corrected usage line; the re-tag swept every functional s96 string — probe email `s97-resweep-`, probe name "S97 Probe", all three capture path prefixes `97-`; the remaining 96-tags are historical prose only) and `scripts/capture-s97-evidence.mjs` (the AX frames: the Assignments view dark [the CONSUMERS map's densest view — the SOFT subfamily live: sf-pill-soft-yellow priority pills + sf-pill-soft-blue due pills] and the Exams view dark through the REAL sidebar navigation [the orange "Tomorrow" + yellow "N days" urgency trio], md5-distinct GATE-enforced: d498800d3b9a8096e747560b03d6f16e / 8e0b23c01e34644c7ed6583b8db8a0ae, exit 0). The resweep itself: **ok:true, exit 0** — refChecks 9/9, cloneChecks 9/9, failed [], the brand tables byte-matched on both hosts, the mobile drawers green on both, probeCleanup "ok", 18 captures.

**Re-certification (all on the FINAL tree — src/ untouched by the AX work, but the standing rhythm re-runs the full ladder anyway):** lint ✓ tsc ✓ unit **931/931** (27 files — the plan's projection exact); the canonical build green; the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — every chunk first-pass, zero flakes); the standing suite **35/35 GREEN** (the full background runner — the dev daemon on :3000 per the setsid recipe + the :3200 standalone, zero concurrent spawns; the theme-restore closing guard green: demo light/violet intact); the s97 resweep ok:true with the exit-code gate live; agent-browser mobile-nav verified on BOTH hosts (reference 24 labeled in the expanded drawer [20 nav + 4 content] / drawer navigates to /Notes and auto-closes / closes via the drawer's own X at x:228 y:26 / 20 icon-only collapsed [the persisted `sidebarOpen:"true"` read BEFORE interpreting, restored after] with ZERO title/aria / scrollWidth 416 on /Notes — the reference's own overflow defect; clone 26 labeled [the superset skip-link "Skip to main content" off-screen at x:-9999 + 20 nav + 5 content] / drawer navigates + auto-closes / Escape closes / 20 icon-only collapsed ALL with title+aria [the clone's key `sf-sidebar-collapsed` read and removed after] / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s97 re-confirmed**); the s97 evidence captures (2 frames, md5-distinct GATE-enforced, exit 0); `.env.example` verified current (the env surface unchanged this cycle).

**Docs chain**: README (badge 1405, counts 931/474, the S97 seam addition, the Session-97 row with pipe parity verified), AGENTS (the 931 count + the S97 lessons section: audit-recs falsified live, census-regex shape blind spots, gate-owned failure paths, the rotation checklist), CLAUDE (the 931 count + the S97 seam tail), vitest.config.ts header (27 files / 931 + the S97 story), the remediation-plan header (AW → AX, 931/474, ZERO standing debt) + the Cycle-47 plan + execution record, the PAD v1.3.5 revision block, this worklog, `docs/session_63.md`.

**Stage summary.** Batch AX DONE: the @utility census closed against shape-variant escapes (the widened regex + the token-reconciliation pin — the two-plant mutation matrix proving each pin's own discriminator), the runner convention reconciled the honest way (the bun option falsified live; node ≥ 23.6 documented with bun marked incompatible for the resweep/capture class — the dep-audit precedent scoped to its own class), the capture class's every failure path gate-owned, and the rotation checklist documented. New baselines: unit **931/931**, e2e **474/474**, the standing suite **35/35**. Standing debt after AX: **ZERO**. The natural next cycle (Session-98) remains the standing rhythm: audit the AX diff, ride the riders, re-certify cold (anchor it on `docs/session_63.md`).

---

## Session-98 — Batch AY (Cycle 48): the capture-lineage runner-convention reconciliation + the census comment-immunity + the honest bun-scope

**Received state**: `9909192` (Batch AX `530c68c` + the operator's session-log commit adding `docs/session_64.md` [the S97 raw transcript — audited clean: one file, 103 insertions, no source changes, no key material]). The 22nd workspace reset — fresh clone, full re-provision (bun install 497 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical production build). Anchors read: session_63 (the S97 transcript whose closing line names the standing rhythm the natural next cycle), session_64 (the operator's S97 transcript, incl. its maintenance-plateau note), the Cycle-47 record + the zero standing debt, the worklog tail. Ground truth: last completed cycle Session-97/Batch AX (Cycle 47) at `530c68c`; baselines unit 931/931, cold e2e 474/474, the standing suite 35/35. Standing debt: ZERO.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 931/931 ✓ (27 files); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — every chunk first-pass, zero flakes — run per-chunk through a per-chunk runner replicating the cert script's AS6-hardened port-kill + fresh-db logic exactly).

**Evidence layers (all pre-change):** the Mode-C audit of the Batch AX diff (`5074408..530c68c` + the operator's `9909192`) — **0C/0H/0M/1L/4I**, all six AX claims verified TRUE (the unit layer green 931/931; the widened census coverage 38/38; BOTH mutation plants replicated live in-repo [Plant A the shape-variant duplicate tripping exactly the widened dupe check; Plant B the unparseable form tripping exactly the reconciliation pin]; the re-tag sweep completeness [the 7-line functional diff, prose-only residue]; the AX3 catch + the AX4 plan fix + the AX5 rotation checklist all located; the 20 committed 97-*.png frames). The finding that sized the cycle: **L1** the capture lineage s87–s96 (TEN scripts — four carrying the `DATABASE_URL=…` prefix, six bare) still documented `Usage: bun` against the AX2 node convention — the AX commit itself had modified capture-s96 (the AX3 catch) without fixing that file's own contradictory usage line. The Infos: **I1** capture-s97's header scoped the bun crash to "this flow's page.request calls" — the live evidence was the resweep's verify-email POST; **I2** the token-reconciliation pin counted `@utility` inside CSS comments — a future prose comment would inflate the token census into a loud FALSE failure (latent-only: 38/38 all real headers); **I3** the widened header regex cannot match a wildcard utility — by-design, the error message is the affordance; **I4** the capture finally-restore is best-effort while the context lives — the S4 lesson's boundary.

**Implemented TDD (the Cycle-48 plan written into the remediation plan BEFORE any source change):**
- **AY1 — the headline, the capture-lineage runner-convention reconciliation (the audit's L1).** (a) The RED-first convention pin in the NEW `tests/script-conventions.test.ts` — demonstrated live RED on exactly the ten stale files; (b) the sweep — the ten usage lines swapped `bun` → `node` (the four DATABASE_URL-prefixed lines keep their prefix), the class verified node-safe (zero bun-specific APIs); (c) GREEN + the mutation check (a planted bun line trips exactly the pin). The re-tag script class is now self-guarding.
- **AY2 — the capture-s97 bun-scope honest re-scope (the audit's I1).** The header re-scoped to the exact live evidence (the RESWEEP's verify-email POST — a Set-Cookie response; the capture flow's own requests untested under bun); the s98 re-tag inherited the corrected wording.
- **AY3 — the census comment-immunity (the audit's I2).** (a) The blind spot demonstrated live — a planted prose comment containing `@utility` tripped the CURRENT reconciliation pin (39 tokens vs 38 headers); (b) the `stripCssComments()` helper (the block form — the only comment form globals.css carries) applied to both census counts IN-PLACE; (c) the NEW helper-discrimination pin; (d) the three-plant mutation matrix re-proven (the variant-shape plant → exactly the dupe check; the unparseable-form plant → exactly the reconciliation pin; the comment plant → NOTHING).
- **AY4 — the latent-shape register (the audit's I3+I4 — documented, no action).** I3 the wildcard form by-design; I4 the best-effort finally boundary documented.
- **AY5 — the s98 riders.** `scripts/ref-resweep-s98.mjs` (the 7-line re-tag sweep from s97; the AW2 gate import + the AX2 constraint carried) + `scripts/capture-s98-evidence.mjs` (Frame 1 the GradeTracker dark [the four-family view, the s96-proven gate]; Frame 2 the Flashcards dark [the sf-pill-yellow difficulty pills on the seeded deck's card grid — a surface NO prior evidence frame covered]; both md5-DISTINCT GATE-enforced; the leg-2 first draft gated on the wrong surface — the study pane — and the AX3 catch caught it live, the leg re-designed against the real DOM).

**Re-certification (all on the FINAL tree — src/ untouched by the AY work, but the standing rhythm re-runs the full ladder anyway):** lint ✓ tsc ✓ unit **934/934** (28 files — the plan's +2 projection corrected to +3: the AY1 census pin rides with its own class-census sanity leg, the AT census-ran doctrine, owned in the execution record); the canonical build green; the full cold 5-chunk e2e re-cert **474/474** (every chunk first-pass, zero flakes); the standing suite — all 35 stages spawned EXACTLY once through the full-suite runner (a setsid daemon through the environment's process window, the raw envelopes under /tmp/standing-suite/): **34/35 green with the single settings-roundtrip first-run finding re-run GREEN standalone** (exit 0, 0 findings — the documented S84-class environmental save-wait flake, the S97 precedent verbatim) — and **accent-dark-sweep RAN GREEN this cycle** (0 violations across all 7 accents — the one stage the S97 window could not fit); the theme-restore closing guard green (demo light/violet intact); the s98 resweep ok:true with the exit-code gate live (9/9 both hosts, the brand tables byte-matched, probeCleanup ok, 18 captures, exit 0); agent-browser mobile-nav verified on BOTH hosts (reference: `sidebarOpen` read-then-restored ["true" = expanded — the semantics settled empirically], 24 labeled expanded / auto-close / the drawer's own X / 20 icon-only collapsed ZERO title-aria / scrollWidth 416 on /Notes; clone: `sf-sidebar-collapsed` read-and-removed, 26 labeled [the superset skip-link] / auto-close / Escape / 20 icon-only collapsed ALL title+aria / scrollWidth 390 — **no Tailwind v4 mobile-nav bug, s98 re-confirmed**); the s98 evidence captures (2 md5-distinct GATE-enforced frames, exit 0); `.env.example` verified current.

**Docs chain**: README (badge 1408, counts 934/474, the unit-seam enumeration extended with the AY1+AY3 seams, the Session-98 row with pipe parity verified), AGENTS (the 934 count + the S98 lessons — four lessons incl. the convention-class-census doctrine and the comment-immunity semantics), CLAUDE (the 934 count + the S98 seam tail), the vitest.config.ts header (28 files / 934 tests, the S98 re-anchor note), the remediation-plan header (AX → AY, 934/474) + the Cycle-48 plan + this execution record, the PAD v1.3.6 revision block, this worklog, `docs/session_65.md`.

**Stage summary.** Batch AY DONE: the AX2 node convention reconciled across the ENTIRE re-tag script class (ten stale lines swept, the class pinned self-guarding), the census counts run on comment-stripped CSS (the correct semantics — prose is not CSS), and every crash claim scoped to its exact repro. New baselines: unit **934/934**, e2e **474/474**, the standing suite **35/35** (the documented flake re-run green standalone; accent-dark-sweep covered). Standing debt after AY: **ZERO**. The natural next cycle (Session-99) remains the standing rhythm: audit the AY diff, ride the riders, re-certify cold (anchor it on `docs/session_65.md`).

---

## Session-99 — Batch AZ (Cycle 49): the mutation-record shape-true re-scope + the playwright-class census widening + the header-prose trap removal

**Received state**: `62e55c3` (Batch AY `5968b15` + the operator's session-log commit adding `docs/session_66.md` [the S98 raw transcript — audited clean: one file, 123 insertions, no source changes, no key material]). The 23rd workspace reset — fresh clone, full re-provision (bun install 497 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical production build). Anchors read: session_65 (the S98 record whose closing line names the standing rhythm the natural next cycle), session_66 (the operator's S98 transcript), the Cycle-48 record + the ZERO standing debt, the worklog tail. Ground truth: last completed cycle Session-98/Batch AY (Cycle 48) at `5968b15`; baselines unit 934/934, cold e2e 474/474, the standing suite 35/35. Standing debt: ZERO.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 934/934 ✓ (28 files); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — every chunk first-pass, zero flakes — run per-chunk through a per-chunk runner replicating the cert script's AS6-hardened port-kill + fresh-db logic exactly).

**Evidence layers (all pre-change):** the Mode-C audit of the Batch AY diff (`9909192..5968b15` + the operator's `62e55c3`) — **0C/0H/0M/1L/2I**, all six AY claims verified TRUE (the unit layer green 934/934; the ten-line sweep verified in the diff AND the 242-script class census re-run [every Usage line says node]; the AY1 mutation replicated live [a planted bun usage line tripping exactly the convention pin]; the 38/38 comment-stripped census re-derived live; the resweep-s98 gate wiring + the capture-s98 AX3 shape read in full; the 20 committed 98-*.png frames md5-distinct; the operator commit clean; no key material; src/ untouched). **The L1 finding that sized the cycle**: the Cycle-48 record's Plant B claim ("the unparseable form trips exactly the reconciliation pin") does NOT replicate verbatim on the final tree — the S97 inline-comment plant shape (`@utility sf-pill-red /* dup */ {`) trips the DUPE check under the AY3 strip (the comment is removed first, the line normalizes to a conventional duplicate header); the reconciliation pin's live discriminator is the wildcard form (`@utility sf-pill-* {` — replicated live, trips exactly the reconciliation pin). The Infos: **I1** the convention pin's census scope (the two re-tag lineages) excluded ~52 other scripts carrying `Usage: node` lines (129 playwright importers outside the lineages, 49 with Usage lines — all consistent today, none guarded); **I2** capture-s98's header prose contained the literal `Usage: bun` (line 3, describing the AY1 sweep — the rotation-sweep grep false-positived on it during this audit).

**Implemented TDD (the Cycle-49 plan written into the remediation plan BEFORE any source change):**
- **AZ1 — the headline, the mutation-record shape-true re-scope (the audit's L1).** (a) The Cycle-48 record's Plant B sentence healed IN-PLACE with the dated S99 correction (the AX4 precedent); (b) the NEW normalization pin in hue-tokens (+1): the inline-comment form normalizes under `stripCssComments` to a conventional duplicate — the census CAN match it (sf-pill-red headers = 2) while tokens and headers stay reconciled; (c) the mutation proof: the strip disabled → the AZ1 pin AND the AY3 comment-immunity pin BOTH fail; (d) the shape-true matrix re-run live: variant-shape → dupe; inline-comment → dupe (the normalization); wildcard → reconciliation; comment → NOTHING.
- **AZ2 — the playwright-class census widening (the audit's I1).** The AY1 pin's class census widened IN-PLACE from the two-lineage proxy to `playwrightCarryingScripts()` — every .mjs importing playwright (the mechanical class discriminator; 213 importers, 94 Usage-line carriers). The blind spot demonstrated live BEFORE the widening (a planted bun line in z-probe-s70.mjs left the current pin GREEN 2/2); after the widening the SAME plant tripped exactly the widened pin (the file named in the failure message); restored → green. The NEW sanity leg (>200 carriers — the import-shape regex drift guard); the lineage sanity legs stay.
- **AZ3 — the header-prose trap removal (the audit's I2).** capture-s98's line-3 prose reworded — the literal `Usage: bun` string gone; the rotation-sweep grep now returns ZERO hits across the whole directory.
- **AZ4 — the latent-register documentation (no action).** The frozen-historical-era doctrine recorded in the pin's scope-honesty comment: scripts that import NO playwright may document any runner (none currently do).
- **AZ5 — the s99 riders.** `scripts/ref-resweep-s99.mjs` (the 7-line re-tag sweep from s98 — provenance, usage, probe email `s99-resweep-`, probe name "S99 Probe", the three capture prefixes; the AW2 gate + the AX2 constraint + the AY2-honest crash scope carried) and `scripts/capture-s99-evidence.mjs` (Frame 1: the Dashboard dark [the seeded sf-pill-red exam-urgency + sf-pill-yellow priority pills — the app's HOME view, no prior evidence coverage]; Frame 2: the RUM panel [the emerald/amber/red rating trio, driven the s19-deterministic API-POSTed way — the probe rows deleted by sessionId in the finally, the persistent-DB restore]; both md5-DISTINCT GATE-enforced, first-pass, exit 0).

**Re-certification (all on the FINAL tree — src/ untouched by the AZ work, but the standing rhythm re-runs the full ladder anyway):** lint ✓ tsc ✓ unit **936/936** (28 files — the plan's +2 projection exact); the canonical build green; the full cold 5-chunk e2e re-cert **474/474** (every chunk first-pass, zero flakes); the standing suite — all 35 stages spawned EXACTLY once through the full-suite runner: **34/35 green with the single settings-roundtrip first-run finding re-run GREEN standalone** (exit 0, 0 findings — the documented S84-class environmental save-wait flake, the S97/S98 precedent verbatim); the theme-restore closing guard green (demo light/violet intact); the s99 resweep ok:true with the exit-code gate live (9/9 both hosts, the brand tables byte-matched, probeCleanup ok, 18 captures, exit 0); agent-browser mobile-nav verified on BOTH hosts (reference: `sidebarOpen` read-then-restored ["true" = expanded — the S98-settled semantics], 24 labeled expanded / auto-close / the drawer's own X / 20 icon-only collapsed ZERO title-aria / scrollWidth 416 on /Notes; clone: `sf-sidebar-collapsed` read-and-removed [null default], 26 labeled [the superset skip-link] / auto-close / Escape / 20 icon-only collapsed ALL title+aria / scrollWidth 390 / the hamburger aria-labeled "Open navigation menu" — **no Tailwind v4 mobile-nav bug, s99 re-confirmed**); the s99 evidence captures (2 md5-distinct GATE-enforced frames, exit 0, first-pass); `.env.example` verified current.

**Docs chain**: README (badge 1410, counts 936/474, the unit-seam enumeration extended with the AZ1+AZ2 seams, the Session-99 row with pipe parity verified), AGENTS (the 936 count + the S99 lessons — three lessons incl. the re-map-the-matrix doctrine and the lineage-is-a-proxy lesson), CLAUDE (the 936 count + the S99 seam tail), the vitest.config.ts header (28 files / 936, the S99 re-anchor note), the remediation-plan header (AY → AZ, 936/474) + the Cycle-49 plan + this execution record, the PAD v1.3.7 revision block, this worklog, `docs/session_67.md`.

**Stage summary.** Batch AZ DONE: the mutation-record now shape-true (the stale Plant B claim healed with a dated correction AND machine-checked by the normalization pin — a guard fix that changes normalization semantics re-maps the mutation matrix), the convention census widened from the lineage proxy to the mechanical playwright-import class (the blind spot demonstrated live and closed), and the rotation-sweep grep trap removed. New baselines: unit **936/936**, e2e **474/474**, the standing suite **35/35**. Standing debt after AZ: **ZERO**. The natural next cycle (Session-100) remains the standing rhythm: audit the AZ diff, ride the riders, re-certify cold (anchor it on `docs/session_67.md`).

---

## Session-100 — Batch BA (Cycle 50): the audit-rider cycle at the plateau — the census-count register note + the s100 evidence-frame rotation

**Received state**: `675b4b8` (Batch AZ `b23e99f` + the operator's session-log commit adding `docs/session_68.md` [the S99 raw transcript — audited clean: one file, 102 insertions, no source changes, no key material]). The 24th workspace reset — fresh clone, full re-provision (bun install 497 pkgs, `.env` from `.env.example` with DATABASE_URL="file:../db/custom.db", the `db/` folder at the repo root + push + seed, chromium-1243, the canonical build). Anchors read: session_67 (the S99 record whose closing line names the standing rhythm the natural next cycle), session_68 (the operator's S99 transcript), the Cycle-49 record + the ZERO standing debt, the worklog tail. Ground truth: last completed cycle Session-99/Batch AZ (Cycle 49) at `b23e99f`; baselines unit 936/936, cold e2e 474/474, the standing suite 35/35. Standing debt: ZERO.

**Baseline re-certified cold BEFORE any work**: lint ✓ tsc ✓ unit 936/936 ✓ (28 files); the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — every chunk first-pass, zero flakes).

**Evidence layers (all pre-change):** the Mode-C audit of the Batch AZ diff (`62e55c3..b23e99f` + the operator's `675b4b8`) — **0C/0H/0M/0L/1I**, all six AZ claims verified TRUE (the unit layer re-run green 936/936; the FULL shape-true mutation matrix replicated live in-repo [Plant B the inline-comment form → exactly the dupe check; Plant C the wildcard form → exactly the reconciliation pin; Plant D the prose comment → NOTHING; the strip-disabled mutation → BOTH the AZ1 and AY3 comment-immunity pins fail]; the AZ2 census re-derived live on the final tree [215 importers, 96 Usage-line carriers, 0 stale, 119 usage-line-free] AND the blind-spot plant replicated live [a planted bun line in z-probe-s70.mjs tripping exactly the widened pin, the file named in the failure message, restored → green]; the AZ3 rotation-sweep grep ZERO hits; the resweep-s99 gate wiring [the AW2 seam import + the exit wiring] + the capture-s99 AX3 shape [catch/thrown/md5Failed/finally-restore/gated completion] read in full; the 20 committed 99-*.png frames md5-distinct; the operator commit clean; no key material; src/ untouched; the docs chain aligned [README badge 1410 + the Session-99 row pipe parity, AGENTS/CLAUDE/vitest-header/PAD v1.3.7 all carrying 936]; git hygiene clean). **The I1 finding that sized the cycle**: the AZ2 record's census counts (213 importers / 94 carriers) describe the PRE-rider tree — the AZ5 riders created two playwright importers that joined the guarded class after the widening measurement; the final-tree re-derivation is 215/96. The threshold-form pins absorb growth BY DESIGN — the close is a scoped register note, not a pin change.

**Implemented (the Cycle-50 plan written into the remediation plan BEFORE any source change):**
- **BA1 — the census-count register note (the audit's I1).** The dated S100 note appended to the AZ2 execution record (the AZ4 latent-register precedent): the final-tree counts (215 importers / 96 carriers / 0 stale / 119 usage-line-free), the growth mechanism (the two s99 riders joining post-widening), the threshold-absorbs-growth doctrine restated, and the explicit REJECTION of an exact-count pin (it would contradict the silent-absorption design intent and manufacture conscious-update friction on every future re-tag).
- **BA2 — the s100 riders.** `scripts/ref-resweep-s100.mjs` (the 7-location re-tag sweep from s99 — provenance, usage, probe email `s100-resweep-`, probe name "S100 Probe", the three capture path prefixes; the AW2 gate import + the AX2 node-runner constraint + the AY2-honest crash scope carried verbatim) and `scripts/capture-s100-evidence.mjs` (the evidence-frame rotation onto two CONSUMERS-map surfaces NO prior evidence frame covered, both already e2e-pinned: Frame 1 the Calculator dark [the sf-pill-red AC key, the AG3-pinned surface, zero state dependency — the aria-label "Clear: AC" located the way the AG3 spec does]; Frame 2 the Events dark with the create-dialog's error banner live [the sf-alert-red family, the AU3c-pinned surface, driven deterministically by the route-aborted POST — the route unrouted in the finally via the eventsRouteInstalled ownership flag, zero persistent rows]; both md5-DISTINCT GATE-enforced: 97892003fb914d2c56eb10d8dee5bc8b / 727571fc6ed0e6e3ef9c7e8305b7dad2, first-pass, exit 0).
- **BA3 — the honest-zero-cycle acknowledgment.** No guard gap found; unit census **936 UNCHANGED** and e2e **474 UNCHANGED** — the projections exact BY CONSTRUCTION (BA1 documentation-only; BA2 scripts-only; src/ untouched).

**Re-certification (all on the FINAL tree — src/ untouched by the BA work, but the standing rhythm re-runs the full ladder anyway):** lint ✓ tsc ✓ unit **936/936** (28 files — the zero-cycle projection exact); the canonical build green; the full cold 5-chunk e2e re-cert **474/474** (131+141+57+87+58 — every chunk first-pass, zero flakes); the standing suite — **GREEN 35/35 FIRST-PASS** (even the settings-roundtrip stage, the documented S84-class environmental save-wait flake, ran green on its first run this window — no re-run needed; the theme-restore closing guard green [demo light/violet intact]); the s100 resweep ok:true with the exit-code gate live (9/9 both hosts, the brand tables byte-matched, probeCleanup ok, 18 captures, exit 0); agent-browser mobile-nav verified on BOTH hosts (reference: `sidebarOpen` read-then-restored ["true" = expanded — the S98-settled semantics], 24 labeled visible links with the drawer open [20 nav in the 288px panel + 4 page-behind through the translucent backdrop — the S97–S99 viewport instrument, its scope pinned in the S100 lessons after the drawer-panel-scoped count read 20] / drawer navigates to /Notes and auto-closes / closes via the drawer's own X at x:228 y:26 / 20 icon-only collapsed ZERO title-aria / scrollWidth 416 on /Notes — the reference's own overflow defect; clone: `sf-sidebar-collapsed` read-and-removed [null default], 26 labeled [the superset skip-link "Skip to main content" at x:-9999] / drawer navigates to /Notes and auto-closes [the dialog UNMOUNTS] / Escape closes / 20 icon-only collapsed ALL title+aria / scrollWidth 390 / the hamburger aria-labeled "Open navigation menu" — **no Tailwind v4 mobile-nav bug, s100 re-confirmed**); the s100 evidence captures (2 md5-distinct GATE-enforced frames, exit 0, first-pass); `.env.example` verified current (the env surface unchanged this cycle — src/ reads AUTH_SECRET/DATABASE_URL/NEXT_PUBLIC_SITE_URL/NODE_ENV, all covered).

**Docs chain**: README (badge 1410, counts 936/474, the Session-100 row with pipe parity verified), AGENTS (the 936 count + the S100 lessons — three lessons incl. the register-note doctrine, the clean-audit-is-the-deliverable doctrine, and the instrument-scope lesson), CLAUDE (the 936 count + the S100 seam tail re-anchor), the vitest.config.ts header (28 files / 936, the S100 re-anchor note), the remediation-plan header (AZ → BA, 936/474) + the Cycle-50 plan + this execution record, the PAD v1.3.8 revision block, this worklog, `docs/session_69.md`.

**Stage summary.** Batch BA DONE: the census-count register note (the AZ2 record now carries the final-tree counts and the growth mechanism — the next audit's re-derivation has a scoped expectation), the s100 evidence-frame rotation onto two never-covered surfaces (both already e2e-pinned), and the honest-zero-cycle acknowledgment (no manufactured headline — the verified plateau IS the deliverable). Baselines unchanged: unit **936/936**, e2e **474/474**, the standing suite **35/35 first-pass**. Standing debt after BA: **ZERO**. The natural next cycle (Session-101) remains the standing rhythm: audit the BA diff, ride the riders, re-certify cold (anchor it on `docs/session_69.md`).

---

## Session V1 (VeloxPOS) — the retail pivot: a full-domain clone of veloxposretail.base44.app

**Context.** The workspace is the `web-retail-pos` scaffold (the StudyFlow /
omni-study1 build, 100+ sessions). The new charter: clone the Spanish POS
reference `veloxposretail.base44.app` (operator-provided account) as a
production-grade functional superset at visual parity, on this repo, without
`init-fullstack.sh`. Single branch (`main`); pushes via the SSH wrapper.

**Work log.**

1. **Reference investigation (agent-browser 0.39.0).** Logged in with the
   operator's account and walked every surface: login (light card, 4 social
   buttons), the 8-view app (/, /Dashboard, /Inventario, /Sales, /Registers,
   /Cashiers, /Reports, /StoreSettings), the Nuevo Producto / Nueva Caja /
   Abrir Turno dialogs, the ticket-detail dialog (verified money model:
   prices IVA-exclusive; 1 × Coca-Cola $18.50 → subtotal 18.50 + IVA 2.96 =
   21.46), Reports periods, Settings colors (#6366f1 / #8b5cf6), the Spanish
   404, and the 390×844 mobile view — where the reference ships NO working
   menu (its 220px sidebar squeezes content; overflow everywhere). 17
   evidence screenshots → `docs/reference-evidence/`. Two dead ends
   documented: the reference has ZERO cashiers and no create path, so its
   own "Abrir Turno" dropdown is empty and its Terminal can never sell.
   Dossier: `docs/reference-investigation.md` (evidence-labeled).
2. **Plan.** `docs/implementation-plan.md` — stack decisions (keep the
   scaffold's Next 16/React 19/Tailwind v4/Prisma-SQLite pipeline; hand-rolled
   SVG charts; integer-cents money), the v4 trap build rules, the superset
   gaps (mobile drawer, cashier CRUD, shift lifecycle, live selling), the
   test plan, and the delivery bar.
3. **Foundations.** `.env` with `DATABASE_URL="file:../db/custom.db"` +
   `db/` at the repo root (the documented contract). New Prisma schema: User
   (+ auth tokens) / StoreSetting / Category / Product / Register / Cashier /
   Shift / Sale / SaleItem — integer cents, cascade-on-owner, SetNull history,
   `@@unique([userId, name])` for the seed upserts. Seed mirrors the
   reference dataset (12 products, 6 categories, 2 cajas, 2 historical
   Cesar Martínez sales + closed shifts).
4. **The db-path hardening (the session's best find).** Next dev (Turbopack)
   pre-resolves the relative `file:` URL one level OFF
   (`<project>/../db/custom.db`) and next dev CREATES that stray file on
   boot — the runtime's existsSync fallback then prefers the stray EMPTY db
   and login silently 401s forever. `src/lib/db-path.ts` v3: an absolute
   target shaped like the mangled default (`<elsewhere>/db/custom.db`) loses
   to the repo that owns `prisma/schema.prisma`. Three new db-path.test.ts
   pins (stray-exists, production pass-through, missing-target fallback).
5. **App build.** globals.css rewritten as the measured dark design system
   (`vx-*` utilities, pinned shadow-sm, explicit gradients, light auth
   surface). Chrome: dark sidebar (220/68, bottom toggle), app bar + w-72
   drawer (flex gap — never space-y with margin children; the trap that
   broke the reference's own mobile menu). Eight views + payment/shift/
   product/cashier dialogs. APIs: products, categories, registers (delete
   guard), cashiers (delete guard), shifts (open 409 + transactional
   register flip; close stamps the count), sales (open-shift gate, server-
   side price recompute, transactional stock decrement, P2002 ticket retry),
   settings upsert, dashboard + reports aggregations, health (`veloxpos`).
   Auth pages: login (reference card + honest social notice), signup
   (register→verify), reset-password; Spanish 404.
6. **Tests.** Old study suites archived to `scripts/archive-study-sweep/`
   (excluded from tsconfig). New unit layer (14 files / 147 tests): money,
   ticket, router, date (es-MX), validation, schema + .env contract,
   tailwind-traps source pins, plus the retained auth/api/db-path/site/
   env-check/dev-preflight. New e2e layer (49 specs): navigation (8 routes +
   404 + 220/68 collapse), mobile-navigation (the drawer contract incl. the
   TRAP-4 uniform-gap guard and the zero-overflow sweep), auth, inventory
   CRUD, terminal-sales (gate → shift → sell → receipt → stock → close),
   registers, cashiers, settings, reports, a11y smoke. Configs modified:
   vitest include unchanged; playwright gains the fresh global-setup reset.
   Lint clean under the react-hooks/set-state-in-effect rule (dialogs reset
   by key-remount; deferred URL reads).
7. **Verification.** lint ✓ · tsc ✓ · build ✓ (standalone) · unit 147/147 ✓
   · e2e 49/49 ✓. Live agent-browser sweep of the dev server: all 8 views +
   404 + login parity vs the reference captures; drawer geometry 288px /
   8 links / uniform 44px gaps / zero overflow; a real sale end-to-end
   ($85.84 = 4 × $21.46) with stock decrement (47→44) and receipt in
   /Sales. Screenshot set → `docs/screenshots/` (desktop 8 + live terminal
   + ticket + COBRAR dialog + mobile dashboard/terminal/ventas/drawer).
8. **Docs.** AGENTS.md / CLAUDE.md / README.md /
   Project_Architecture_Document.md regenerated per the repo's doc skills;
   this worklog appended; worklog + docs in the same push.

**Stage summary.**

- Gates: lint ✓ tsc ✓ build ✓ unit 147 ✓ e2e 49 ✓ — all on `main`, no
  branches.
- Artifacts: the full POS codebase (src, prisma, tests, scripts),
  docs/reference-investigation.md, docs/implementation-plan.md,
  docs/reference-evidence/ (17 live captures), docs/screenshots/ (16).
- Standing guards added: the db-path v3 stray-db pin, the trap-4 source
  pins, the drawer geometry contract, the verified money-model pins, and
  the e2e force-reset (idempotent suite).
- Deferred (disclosed, not silently dropped): product image uploads,
  receipt email action, Dockerfile prose refresh, in-memory limiter for
  multi-instance deploys.

---

## Session V2 — the post-pivot audit + live-parity remediation

**Context.** `main @ a8e6430` (the operator's session log landed on top of
the V1 pivot). The charter: audit the recent changes per
`skills/web-application/SKILL.md`, re-verify parity against the LIVE
reference (it moves), remediate everything found TDD-style, and ship.

**Audit (Mode C).** Pivot diff `8534fee..0519e30` across the review
dimensions: **1 Critical / 3 High / 8 Medium / 11 Low** — the Critical a
reset-token-in-response takeover path (inherited from the scaffold), the
Highs the delegate 500-on-invalid bug, an unbruteforceable OTP endpoint,
and the spoofable limiter key. Full report: `docs/remediation-plan-v2.md`
§1 (each finding located, evidenced, severity-classified).

**Live-reference re-measurement (agent-browser).** Logged into
`veloxposretail.base44.app` fresh and re-took computed styles: the
Dashboard/Ajustes card headings are TITLE-CASE slate-700 16px (the dossier
had mislabeled them), Reports cards are uppercase white/60 14px/0.7px,
the H1 is 24px at every viewport, weekly labels roll per-date (today last),
the low-stock rows carry an amber icon chip, and the mobile menu is STILL
broken on the reference (the clone's drawer stays the superset). Fresh
ground-truth frames → `docs/screenshots/live-ref-*.png`.

**Remediation (TDD, pins red first — 26 red observed).** All four batches
landed: R1 security (reset-delivery contract ADR-011, tokenVersion
revocation ADR-012, the OTP attempt counter, `resolveClientIp`, bounded
`readJson`, the login equalizer, limiter pruning), R2 integrity (guarded
in-tx stock decrement, single-formula ticket math, server-side cash rule,
in-tx duplicate-open 409, bounded lists + grouped aggregates, hot-path
indexes), R3 parity (SectionCard card/kicker variants, fixed-24px H1,
thinned chart labels + integer `$` axes, `weekWindow`, Subir-logo button,
low-stock row anatomy), R4 hygiene (VeloxPOS manifests, dead deps + dead
code removed, `ignoreBuildErrors`/`noImplicitAny` REMOVED — the gate then
caught two spec type errors on the next build — donut color map,
load-failure toast, `.env.example` surface, drawer focus trap).

**Verification.** Full gate on the final tree: lint ✓ · tsc ✓ · build ✓ ·
unit **181/181 (16 files)** · e2e **67/67** (hardening.spec + parity-pins
+ the drawer focus pins extend the original 49). Screenshot set
re-captured from the reseeded dev server.

**Docs.** AGENTS/CLAUDE/README/PAD (v1.1.0, ADR-011/012) updated with the
hardened contracts; `web-retail-pos_SKILL.md` v1.0.0 written (the stale
`omni-study1_SKILL.md` removed); this worklog + the plan's execution
record appended.

**Stage summary.** The clone is now audited (0 known Critical/High),
remediated (18 new pins standing guard), and re-measured against the live
reference the same day. Standing debt: the V1 deferred list (image upload
storage, receipt email, multi-instance limiter) — disclosed, unchanged.
