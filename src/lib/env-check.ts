// ---------------------------------------------------------------------------
// The S22 boot-guard seam (ADR-020). Pure, explicit args, zero imports —
// unit-pinned by tests/env-check.test.ts. src/instrumentation.ts's register()
// owns the env and acts on the returned status.
// ---------------------------------------------------------------------------

/** The historical dev fallback (single source — src/lib/auth.ts imports THIS). */
export const DEV_FALLBACK_SECRET = "dev-only-insecure-session-secret";

/** The illustrative value shipped in .env.example (V2 L9). It is public by
 *  definition, so a production boot still carrying it is treated exactly
 *  like the dev fallback: FATAL. */
export const EXAMPLE_SECRET = "dev-only-veloxpos-secret-change-me";

export type BootStatus = {
  level: "ok" | "warn" | "fatal";
  message?: string;
};

const REMEDY = "Generate one with `openssl rand -hex 32` and set AUTH_SECRET in the environment.";

/**
 * Decide what a server boot should do with the configured AUTH_SECRET.
 * - production: missing/blank/the public dev fallback is FATAL (exit);
 *   a present-but-weak (< 32 chars) secret boots with a warn.
 * - non-production: nothing is fatal — a missing secret warns about the
 *   dev-only fallback; a real secret is OK.
 */
export function authSecretBootStatus(
  nodeEnv: string | undefined,
  authSecret: string | undefined,
): BootStatus {
  const secret = authSecret?.trim();
  const isProduction = nodeEnv === "production";

  if (isProduction) {
    if (!secret) {
      return {
        level: "fatal",
        message: `AUTH_SECRET is required in production — refusing to sign session cookies with an absent secret. ${REMEDY}`,
      };
    }
    if (secret === DEV_FALLBACK_SECRET || secret === EXAMPLE_SECRET) {
      return {
        level: "fatal",
        message: `AUTH_SECRET is required in production — refusing to sign session cookies with a public placeholder secret. ${REMEDY}`,
      };
    }
    if (secret.length < 32) {
      return {
        level: "warn",
        message: `AUTH_SECRET looks weak (${secret.length} chars; 32+ recommended). ${REMEDY}`,
      };
    }
    return { level: "ok" };
  }

  if (!secret) {
    return {
      level: "warn",
      message:
        "AUTH_SECRET is unset — sessions are signed with the dev-only fallback secret. Never run production this way.",
    };
  }
  return { level: "ok" };
}
