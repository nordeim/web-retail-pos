// ---------------------------------------------------------------------------
// Source pins for the Session V2 remediation (docs/remediation-plan-v2.md).
// The repo's source-pin pattern (tests/tailwind-traps.test.ts): grep the
// source tree for a regression's fingerprint so the bug cannot silently
// return. Red before the fix, green after — each pin names its finding.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string): string =>
  readFileSync(path.join(import.meta.dirname, "..", rel), "utf8");

describe("M3 — the ticket line cells use the tested money seam", () => {
  it("terminal-view imports lineTotalCents (no inline IVA formula)", () => {
    const view = read("src/components/views/terminal-view.tsx");
    expect(view).toContain("lineTotalCents");
    // The historical 1¢ bug: round-per-unit THEN multiply, diverging from
    // lineTotalCents's single final round.
    expect(view).not.toMatch(/Math\.round\([^)]*1 \+ .*ivaRate[^)]*\)\s*\*\s*line\.qty/);
  });
});

describe("M7 — the login equalizer burns scrypt for unknown emails", () => {
  it("login route verifies against the dummy hash, not a short-circuit", () => {
    const route = read("src/app/api/auth/login/route.ts");
    expect(route).toContain("DUMMY_CREDENTIAL_HASH");
    expect(route).not.toMatch(/if \(!user \|\| !verifyPassword/);
  });
});

describe("M8 — the manifests describe VeloxPOS", () => {
  it("package.json is web-retail-pos, not omni-study", () => {
    const manifest = JSON.parse(read("package.json")) as { name: string; description: string };
    expect(manifest.name).toBe("web-retail-pos");
    expect(manifest.description).toContain("VeloxPOS");
  });

  it("the vitest header narrates the POS suite, not the study census", () => {
    const header = read("vitest.config.ts");
    expect(header).not.toContain("936");
    expect(header).toContain("VeloxPOS");
  });

  it("next.config.ts routes the POS views, not the study views", () => {
    expect(read("next.config.ts")).not.toContain("/MyDay");
  });
});

describe("L1 — the build gate is not weakened", () => {
  it("next.config.ts does not ignore build errors", () => {
    expect(read("next.config.ts")).not.toContain("ignoreBuildErrors");
  });

  it("tsconfig keeps implicit-any errors on", () => {
    expect(read("tsconfig.json")).not.toContain("noImplicitAny");
  });
});

describe("L2 — the vacuous sale refine is gone", () => {
  it("validation.ts carries no `|| true` tautology", () => {
    expect(read("src/lib/validation.ts")).not.toContain("|| true");
  });
});

describe("L3 — no dead-code void hacks", () => {
  it("the dashboard route no longer voids the axis formatter", () => {
    expect(read("src/app/api/dashboard/route.ts")).not.toContain("void formatDayMonth");
  });
});
