# Deployment Guide

ORBITAL ships as a single Next.js **standalone** build with a SQLite file
database — one process, zero external services. This guide covers the
supported production paths and the environment contract.

## 1. Build

```bash
bun install
bun run build          # next build + standalone assembly (.next/standalone)
```

The build compiles the page shell and the 16 API route handlers, then copies
`.next/static` and `public/` into `.next/standalone/` (see the `build`
script in `package.json`). `next.config.ts` pins `outputFileTracingRoot` to
the repo root — keep it; the standalone trace depends on it.

## 2. Run

```bash
bun run start          # NODE_ENV=production bun .next/standalone/server.js
```

The server listens on port 3000 by default (`PORT` overrides). Always start
it from the repo root via the npm/bun script — the scripts guarantee the
working directory that the SQLite path resolution and the standalone trace
rely on. Behind a reverse proxy, forward `X-Forwarded-Proto` so cookie
attributes derive the right scheme.

## 3. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite connection string. See §4. |
| `AUTH_SECRET` | **Yes in production — enforced at boot** | HMAC secret for session cookies. Generate with `openssl rand -hex 32`. **The session-22 boot guard refuses to start the production server without a real secret** (missing/empty/the public dev constant → the process exits with the remedy message; dev/test keep the zero-config fallback with a one-line boot warning). |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public origin, used for metadata URLs and `sitemap.xml` (e.g. `https://orbital.example.com`). |

## 4. Database location (§4 — the `.env.example` reference)

`DATABASE_URL` accepts three forms:

1. **Relative `file:` URL (the default, zero-config local story).**
   ```
   DATABASE_URL="file:../db/custom.db"
   ```
   Relative URLs resolve against the **`prisma/` directory that owns
   `schema.prisma`** — exactly like the Prisma CLI — so this string points
   at `<repo>/db/custom.db` for `prisma db push`, `prisma/seed.ts`,
   `next build` and the running server alike, regardless of the process
   working directory. The resolution rule lives in
   `src/lib/db-path.ts` and is pinned by `tests/db-path.test.ts`.

2. **Absolute `file:` URL (recommended for production).**
   ```
   DATABASE_URL="file:/var/lib/orbital/custom.db"
   ```
   Absolute paths pass through untouched — immune to any working-directory
   ambiguity across service managers, containers, or cron wrappers. Point
   them at a persisted volume and back the file up.

3. **PostgreSQL.** Switch `provider = "postgresql"` in
   `prisma/schema.prisma`, set a `postgresql://` URL, then
   `bun run db:push && bun run db:seed`.

Initialize (or reset) the database with:

```bash
bun run db:push        # apply schema (db push — no migrations folder)
bun run db:seed        # idempotent demo workspace (wipes domain tables)
```

`db/*.db` is gitignored; every fresh clone recreates it from the two
commands above.

## 5. Updating

```bash
git pull
bun install
bunx prisma generate   # after schema changes
bun run db:push
bun run build
# restart the server process
```

## 6. Verification checklist

```bash
curl -s https://your-host/api/health          # {"status":"ok",...}
bun run lint && bun run typecheck && bun run test
./scripts/smoke-test.sh                       # 30 E2E checks (local)
bun run test:e2e                              # Playwright suite (local)
```

## 7. Common production issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Error code 14: Unable to open the database file` | Server started from a directory that has no `prisma/schema.prisma` and no absolute `DATABASE_URL` | Start via `bun run start`, or set an absolute `file:` URL (§4) |
| Logins loop back to `/login` | `AUTH_SECRET` changed between restarts | Keep the secret stable across restarts |
| The server exits at boot: `AUTH_SECRET is required in production` | The session-22 boot guard fired — the server refuses to sign sessions with the public dev constant | Generate a real secret (`openssl rand -hex 32`), export `AUTH_SECRET`, restart (this section + §4) |
| Rate-limited logins (429) | 10 attempts/IP/15 min fixed window | Wait for `Retry-After`, or restart to clear the in-memory buckets (single-node) |

## 8. Docker (one-command containerized deployment)

The repo ships a production `Dockerfile` + `docker-compose.yml`
(session-18). The container runs the same standalone server as
`bun run start` — the app code is unchanged by containerization; only
the environment contract moves (§4 form-2: the absolute `file:` URL).

```bash
# 1. First run — initialize the SQLite volume (schema + demo seed),
#    then start the app:
AUTH_SECRET="$(openssl rand -hex 32)" docker compose --profile init up -d

# 2. Subsequent runs:
docker compose up -d

# 3. Verify:
curl -s http://localhost:3000/api/health     # {"status":"ok","db":"up",...}
```

What the compose file does:

| Piece | Purpose |
|---|---|
| `veloxpos` service | The standalone server on :3000 (`VELOXPOS_PORT` remaps), `/data` volume for SQLite, healthcheck on `/api/health` |
| `init` service (`--profile init`) | One-shot `prisma db push` + the idempotent seed onto the same volume |
| `db-data` volume | The SQLite file (`file:/data/custom.db`) — survives container rebuilds |
| `AUTH_SECRET` | **Required** — compose refuses to boot with the placeholder (§3) |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical origin (read at serve time by metadata/sitemap) |

Notes:

- **The image carries no database bytes.** The build context ignores
  `db/`, the output tracer's stale `.next/standalone/db/` snapshot is
  removed in the runtime stage, and the absolute `DATABASE_URL` points
  at the volume regardless.
- **Validation status (honest caveat):** the layout was validated
  end-to-end OUTSIDE Docker (a local simulation of the exact runtime
  filesystem: prod-deps overlay + standalone + `src/lib` + `prisma/`,
  then `db push` → seed → boot → health/login/RUM checks — see
  `scripts/docker-layout-sim-s27.sh`), but the dev sandbox that
  authored it has no Docker daemon. The first
  `docker compose --profile init up` on a Docker host is the remaining
  verification step; report any divergence as an issue.
- **Schema updates:** re-run the init profile after `git pull` +
  rebuild (`docker compose build && docker compose --profile init run
  --rm init` — the push is additive/idempotent).
- **PostgreSQL** (§4 form-3) works in containers too: set the
  `DATABASE_URL` service environment to the postgres URL and leave the
  volume unmounted.

### 8.1 After deployment: see your field data

Once the app is up and you (or your users) have visited it, the RUM
beacon has been collecting real Core Web Vitals. The visible inspection
surface is the auth-gated **diagnostics panel at `/rum`** (session-19) —
sign in, then navigate to `https://your-host/rum`: the five metrics at
p75 with rating badges derived from the public CWV bounds, the samples
line, and the ten most recent events. The panel is URL-direct (it is
deliberately linked from nowhere — the app shell's parity is
byte-preserved) and themes with your account's dark mode + accent. The
scriptable contract remains `GET /api/rum` (same auth, JSON) for
curl/monitoring use.

Session-20 (v3) additions: each sampled card carries a **sparkline**
(the metric's 20 most recent samples, oldest → newest — the trend at a
glance: "is my LCP drifting?"), and the panel's **Export CSV** action
downloads your most recent 2000 events as a spreadsheet-ready CSV
(`GET /api/rum/export` — same auth, `text/csv`, RFC-4180 escaping, raw
values) for offline analysis.

### 8.2 After deployment: take your data with you

The full-data export (session-21) is the "own your data" exit: the
auth-gated **export page at `/export`** — sign in, then navigate to
`https://your-host/export` — previews the 20 content collections as a
count grid and documents the format. The **Download JSON** action (or
the scriptable `GET /api/export/data` — same auth, `application/json`)
returns the complete versioned envelope: every collection in
chronological order with ids and foreign keys intact, your profile
(without the password hash), uploaded files with their payloads, and a
per-collection count summary. VerificationToken/PasswordResetToken and
RUM telemetry are excluded by design (the RUM CSV on `/rum` is the
telemetry dump). The export is a point-in-time download, not a sync —
re-download after meaningful changes; the SQLite volume (§4) remains
the full-fidelity backup.

**Restoring (session-23):** the same file imports back — the
**Restore from a backup** card on the `/export` page takes a downloaded
`veloxpos-data-*.json` (up to 10 MiB) and restores it into the signed-in
account. Rows match by id: existing rows update to the file's values,
new ones are created, nothing is ever deleted, and the whole import
either completes or rolls back completely (a failed import changes
nothing). Your account identity, password, and sign-in are never
touched — an import restores content only. Because the envelope carries
no user ids, it imports into ANY account: the data-loss recovery story
is register fresh → sign in → import (`POST /api/import/data` is the
scriptable form — same auth, a 10-import/15-minute budget). For a full
reset-to-snapshot restore, stop the server, wipe the SQLite volume (or
`bun run db:reset` locally), re-create the account, then import.

### 8.3 After deployment: rotate your password (session-24)

A signed-in owner rotates their own password from **Settings → Profile**
— the **Change password** card below the profile fields: current
password, new password, confirm. The route (`POST /api/auth/change-password`)
verifies the current password FIRST (a wrong current password is
rejected with 400 and changes nothing), applies the same policy as
registration (8–200 characters), and rejects a new password identical
to the current one. Rate-limited to 10 changes per 15 minutes per
account. Your session stays signed in across your own rotation (the
cookie is signed with `AUTH_SECRET`, not the password) — other already
issued sessions also remain valid; if you ever need to invalidate
them, rotate `AUTH_SECRET` and restart (all sessions re-validate
against the new secret). No email is sent on change (no SMTP by
design, §3) — the on-screen "Password updated." note is the
acknowledgment.

### 8.4 After deployment: delete an account (session-25)

A signed-in owner permanently deletes their own account from
**Settings → Profile** — the **Danger zone** card below the Change
password card. The flow is deliberately two-step: click **Delete
account…** to reveal the confirmation form, then enter the account
password and type the word `DELETE` (case-exact) before the
**Permanently delete my account** button fires. The route
(`POST /api/auth/delete-account`) verifies the password FIRST (a
wrong password is rejected with 400 and changes nothing), is
rate-limited to 10 attempts per 15 minutes per account, then performs
ONE cascade write: every owned row goes — subjects, tasks, notes,
flashcards, grades, files, chat history, telemetry, and the account
record itself. The session cookie is cleared with the account and the
browser lands on `/login`. There is no soft-delete and no undo: to keep
a copy, download your data from the `/export` page FIRST (§8.2) — the
card's warning copy points there. Deleting a household member's
account is the same flow signed in as them (there is deliberately no
admin-deletes-others surface); for bulk/manual removal the SQLite file
remains the operator's escape hatch.

### 8.5 After deployment: change the sign-in email (session-26)

A signed-in owner changes the address they log in with from
**Settings → Profile** — the **Email address** card above the Change
password card. Enter the new address TWICE (the confirm field guards
the typo lockout: a mistyped address is unrecoverable through the UI —
the next sign-in needs the new address) plus the account password,
then click **Update email address**. The route
(`POST /api/auth/change-email`) verifies the password FIRST (a wrong
password is rejected with 400 and changes nothing), is rate-limited to
10 attempts per 15 minutes per account, then checks that the new
address differs from the current one (400 otherwise) and is not owned
by ANY existing account (409 otherwise — including unverified ones).
The write moves the login identifier (stored lowercased);
`emailVerified` STAYS true — with no SMTP, a re-verification code
would surface to the same person who just proved the password, so the
password proof IS the verification. The current session SURVIVES the
change (the cookie is signed over the user id, not the email) and the
Profile identity block + sidebar footer update live. **Sign in with
the NEW address next time** — the old address no longer resolves (the
uniform "Invalid email or password" error, no enumeration signal).
