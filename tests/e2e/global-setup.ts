import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Global setup: make sure db/e2e.db exists, schema-pushed and seeded, before
// the webServer boots the standalone build against it. Idempotent: a re-seed
// wipes + recreates the demo store (the specs assume the seed counts).
// ---------------------------------------------------------------------------

export default function globalSetup(): void {
  const repoRoot = process.cwd();
  const dbDir = path.join(repoRoot, "db");
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

  const env = { ...process.env, DATABASE_URL: "file:../db/e2e.db" };
  const run = (cmd: string) => execSync(cmd, { env, stdio: "pipe" });

  run("bunx prisma db push --accept-data-loss --skip-generate");
  run("bun prisma/seed.ts");
}
