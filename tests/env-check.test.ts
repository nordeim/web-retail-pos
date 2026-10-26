import { describe, expect, it } from "vitest";

import {
  authSecretBootStatus,
  DEV_FALLBACK_SECRET,
  EXAMPLE_SECRET,
} from "@/lib/env-check";

// The S22 boot-guard seam (ADR-020): production boots refuse to sign
// session cookies with the public dev fallback — the actionable fail-fast
// message tells the owner exactly how to fix it. Pure function, explicit
// args (never reads process.env itself — the instrumentation hook owns
// the env), so every boundary is pinnable.

describe("authSecretBootStatus", () => {
  // ---- the fatal family: production without a real secret ----------------

  it("is FATAL in production when AUTH_SECRET is undefined", () => {
    const r = authSecretBootStatus("production", undefined);
    expect(r.level).toBe("fatal");
    expect(r.message).toContain("AUTH_SECRET is required in production");
    expect(r.message).toContain("openssl rand -hex 32");
  });

  it("is FATAL in production when AUTH_SECRET is empty", () => {
    const r = authSecretBootStatus("production", "");
    expect(r.level).toBe("fatal");
    expect(r.message).toContain("AUTH_SECRET is required in production");
  });

  it("is FATAL in production when AUTH_SECRET is whitespace-only", () => {
    const r = authSecretBootStatus("production", "   \t  ");
    expect(r.level).toBe("fatal");
  });

  it("is FATAL in production when AUTH_SECRET equals the public dev fallback constant", () => {
    const r = authSecretBootStatus("production", DEV_FALLBACK_SECRET);
    expect(r.level).toBe("fatal");
    // The pasted-constant case points at the same remedy.
    expect(r.message).toContain("openssl rand -hex 32");
  });

  it("is FATAL in production when AUTH_SECRET is the dev fallback wrapped in whitespace", () => {
    const r = authSecretBootStatus("production", `  ${DEV_FALLBACK_SECRET}  `);
    expect(r.level).toBe("fatal");
  });

  // ---- the ok family: production with a real secret -----------------------

  it("is OK in production with a 64-hex-char secret (the openssl shape)", () => {
    const r = authSecretBootStatus(
      "production",
      "4f9c1d2e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1",
    );
    expect(r.level).toBe("ok");
  });

  it("is OK at the 32-char boundary (warn starts strictly below it)", () => {
    const r = authSecretBootStatus(
      "production",
      "0123456789012345678901234567890a",
    );
    expect(r.level).toBe("ok");
  });

  // ---- the warn family: weak-but-present, or the dev fallback -------------

  it("WARNS in production one char under the boundary (31 chars)", () => {
    const r = authSecretBootStatus(
      "production",
      "0123456789012345678901234567890",
    );
    expect(r.level).toBe("warn");
    expect(r.message).toContain("openssl rand -hex 32");
  });

  it("WARNS in production on a short hand-made secret", () => {
    const r = authSecretBootStatus("production", "hunter2hunter2hunter2!!");
    expect(r.level).toBe("warn");
  });

  it("WARNS (never blocks) outside production when the secret is unset — the documented dev fallback", () => {
    const r = authSecretBootStatus("development", undefined);
    expect(r.level).toBe("warn");
    expect(r.message).toContain("dev-only fallback");
  });

  it("WARNS on a test node_env with an empty secret too (same non-production family)", () => {
    const r = authSecretBootStatus("test", "");
    expect(r.level).toBe("warn");
  });

  it("is OK outside production when a real secret is set", () => {
    const r = authSecretBootStatus(
      "development",
      "4f9c1d2e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1",
    );
    expect(r.level).toBe("ok");
  });

  it("treats an undefined nodeEnv as non-production (nothing is fatal before NODE_ENV is set)", () => {
    const r = authSecretBootStatus(undefined, undefined);
    expect(r.level).toBe("warn");
  });
});

describe("DEV_FALLBACK_SECRET (the single-source pin)", () => {
  it("keeps the exact historical value — auth.ts imports THIS constant", () => {
    // If this value ever changes, src/lib/auth.ts's import keeps the two in
    // lockstep by construction; the pin documents the historical contract.
    expect(DEV_FALLBACK_SECRET).toBe("dev-only-insecure-session-secret");
  });
});

describe("the .env.example secret is fatal in production (V2 L9)", () => {
  it("the example AUTH_SECRET value cannot boot a shared deploy", () => {
    // The example file's illustrative value is public by definition — a
    // production boot that still carries it must refuse, exactly like the
    // dev fallback constant.
    expect(EXAMPLE_SECRET).toBe("dev-only-veloxpos-secret-change-me");
    const r = authSecretBootStatus("production", EXAMPLE_SECRET);
    expect(r.level).toBe("fatal");
  });

  it("stays non-fatal in development (the example is a dev posture)", () => {
    expect(authSecretBootStatus("development", EXAMPLE_SECRET).level).toBe("ok");
  });
});
