# syntax=docker/dockerfile:1

# VeloxPOS — production container.
#
# Multi-stage build per docs/DEPLOYMENT.md §Docker:
#   deps-prod → the runtime dependency set (incl. the prisma CLI, so the
#               one-shot `db push` init works inside the container)
#   build     → bun install (full), prisma generate, the standalone build
#   runtime   → oven/bun with the standalone server + static assets +
#               the generated Prisma client + the seed's import chain
#
# The container uses the DEPLOYMENT.md §4 form-2 database contract: an
# ABSOLUTE `file:` URL (file:/data/custom.db) that passes through
# src/lib/db-path.ts untouched — mount /data as a volume and the SQLite
# file persists across container rebuilds.
#
# The app code is unchanged by containerization: the standalone server is
# the same .next/standalone/server.js the local `bun run start` serves.

# ---------------------------------------------------------------------------
# Stage 1 — production dependencies (prisma CLI + client, no devDeps)
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps-prod
WORKDIR /app
COPY package.json bun.lock ./
# --production: the runtime dependency set only. The prisma engines are
# postinstalled via trustedDependencies (prisma, @prisma/client,
# @prisma/engines) so `bunx prisma db push` works in the final image.
RUN bun install --production

# ---------------------------------------------------------------------------
# Stage 2 — build (full dependency set + the standalone output)
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
# The generated client lands in node_modules (traced into the standalone).
RUN bunx prisma generate
# next build + the standalone assembly (cp static + public — package.json's
# build script). AUTH_SECRET/NEXT_PUBLIC_SITE_URL are runtime concerns here:
# the server reads them from the environment at serve time.
RUN bun run build

# ---------------------------------------------------------------------------
# Stage 3 — runtime
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# DEPLOYMENT.md §4 form-2: the ABSOLUTE path passes through db-path.ts
# untouched. /data is the volume mount point.
ENV DATABASE_URL="file:/data/custom.db"

# Runtime deps FIRST (prisma CLI present), then the standalone OVER it —
# COPY merges directories, so the traced+generated @prisma/client (built in
# stage 2) wins over the un-generated stub from stage 1 while the prisma
# CLI survives for the one-shot init.
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Defense in depth: the output tracer snapshots the BUILD machine's
# db/custom.db into .next/standalone/db/ (verified locally). The
# .dockerignore keeps it out of the build stage, and the absolute
# DATABASE_URL ignores any stale copy — this rm makes the guarantee
# structural: no database bytes can ship inside the image.
RUN rm -rf /app/db

# The seed's import chain (prisma/seed.ts → ../src/lib/db → ./db-path)
# runs under bun's native TS; the schema backs the CLI's db push.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/package.json ./package.json

# /data is the SQLite volume; create it so a bare `docker run` without a
# volume still boots (the db lands inside the container's own layer).
RUN mkdir -p /data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT??3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# The same start contract as the repo's `bun run start` — the standalone
# server under bun, reading DATABASE_URL/AUTH_SECRET/PORT from the env.
CMD ["bun", "server.js"]
