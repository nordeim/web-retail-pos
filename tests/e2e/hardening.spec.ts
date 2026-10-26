// ---------------------------------------------------------------------------
// Session V2 hardening — API-level pins for the remediation contract
// (docs/remediation-plan-v2.md §R1/R2). Runs against the standalone build
// with the suite's opted-in in-app reset delivery (playwright.config env).
//
// Data ownership: this spec CREATES its own register/cashier/user and
// deletes them at the end — the shared seeded state is left untouched
// (skill §14: shared mutable e2e state is a time bomb).
// ---------------------------------------------------------------------------

import { test, expect } from "@playwright/test";

const HARDENING_REGISTER = "Caja Hardening V2";
const HARDENING_CASHIER = "Cajero Hardening V2";

test.describe("the factory CRUD contract (H1)", () => {
  test("invalid create payloads answer 400 — never the 500 leak", async ({ request }) => {
    // The delegates call their Zod schemas directly; the historical mapper
    // had no ZodError branch, so every factory-backed route answered 500.
    for (const path of ["/api/products", "/api/categories", "/api/registers", "/api/cashiers"]) {
      const res = await request.post(path, { data: { name: 42 } });
      expect(res.status(), `${path} on an invalid payload`).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    }
  });

  test("an oversized body answers 413 and a non-JSON body 415 (M4)", async ({ request }) => {
    const big = await request.post("/api/categories", {
      data: { name: "x".repeat(1_100_000) },
    });
    expect(big.status()).toBe(413);

    const wrongType = await request.post("/api/categories", {
      headers: { "content-type": "text/plain" },
      data: "not json",
    });
    expect(wrongType.status()).toBe(415);
  });
});

test.describe("the shift + sale business rules (L4, M1, L2)", () => {
  let registerId = "";
  let cashierId = "";
  let bonafontId = "";
  let cocaId = "";
  let bonafontStock = 0;

  test.beforeAll(async ({ request }) => {
    const register = await request.post("/api/registers", {
      data: { name: HARDENING_REGISTER, location: "Hardening" },
    });
    expect(register.status()).toBe(201);
    registerId = (await register.json()).id;

    const cashier = await request.post("/api/cashiers", {
      data: { name: HARDENING_CASHIER },
    });
    expect(cashier.status()).toBe(201);
    cashierId = (await cashier.json()).id;

    const products = await request.get("/api/products");
    const rows = (await products.json()) as { id: string; name: string; stock: number }[];
    bonafontId = rows.find((r) => r.name === "Agua Bonafont 1L")!.id;
    bonafontStock = rows.find((r) => r.name === "Agua Bonafont 1L")!.stock;
    cocaId = rows.find((r) => r.name === "Coca-Cola 600ml")!.id;

    const shift = await request.post("/api/shifts", {
      data: { registerId, cashierId, openingFloat: 0 },
    });
    expect(shift.status()).toBe(201);
  });

  test("a second open shift on the same register answers 409 (L4)", async ({ request }) => {
    const res = await request.post("/api/shifts", {
      data: { registerId, cashierId, openingFloat: 0 },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Esa caja ya tiene un turno abierto.");
  });

  test("selling more than stock answers 422 and leaves stock intact (M1)", async ({ request }) => {
    const res = await request.post("/api/sales", {
      data: {
        registerId,
        items: [{ productId: bonafontId, qty: bonafontStock + 1000 }],
        method: "tarjeta",
      },
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("Stock insuficiente para completar la venta.");

    const after = await request.get("/api/products");
    const row = ((await after.json()) as { id: string; stock: number }[]).find(
      (p) => p.id === bonafontId,
    );
    expect(row?.stock).toBe(bonafontStock);
  });

  test("an efectivo sale short of cash answers 422 (L2 — the server-side rule)", async ({ request }) => {
    const res = await request.post("/api/sales", {
      data: {
        registerId,
        items: [{ productId: cocaId, qty: 1 }],
        method: "efectivo",
        cashReceived: 1,
      },
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("El efectivo recibido no cubre el total del ticket.");
  });

  test.afterAll(async ({ request }) => {
    // Full cleanup — the open shift guards the register's delete, so close
    // it first. A failure here is LOUD (the next run force-resets anyway,
    // but this run's other specs count clean state).
    const shifts = (await (await request.get("/api/shifts")).json()) as {
      id: string;
      registerId: string;
      status: string;
    }[];
    const open = shifts.find((s) => s.registerId === registerId && s.status === "open");
    if (open) {
      const closed = await request.post(`/api/shifts/${open.id}/close`, {
        data: { closingAmount: 0 },
      });
      if (!closed.ok()) throw new Error(`hardening cleanup: close failed (${closed.status()})`);
    }
    const delRegister = await request.delete(`/api/registers/${registerId}`);
    const delCashier = await request.delete(`/api/cashiers/${cashierId}`);
    if (!delRegister.ok() || !delCashier.ok()) {
      throw new Error("hardening cleanup: deletes failed");
    }
  });
});

test.describe("the reset + verification contract (C1, H2, M6)", () => {
  const email = `hardening-v2-${Date.now()}@veloxpos.local`;
  const password = "HardeningV2!Pass1";
  let sessionCookie = "";

  test("a burnt OTP budget kills the token even for the right code (H2)", async ({ request }) => {
    const registered = await request.post("/api/auth/register", {
      data: { email, password, fullName: "Hardening V2" },
    });
    expect(registered.status()).toBe(201);
    const { code } = await registered.json();
    expect(code).toMatch(/^\d{6}$/);

    // Six wrong codes burn the attempt budget…
    for (let i = 0; i < 6; i += 1) {
      const wrong = await request.post("/api/auth/verify-email", {
        data: { email, code: "000000" },
      });
      expect(wrong.status()).toBe(400);
    }
    // …and the RIGHT code is dead with them.
    const right = await request.post("/api/auth/verify-email", { data: { email, code } });
    expect(right.status()).toBe(400);
  });

  test("the reset flow revokes the pre-reset session (C1 + M6)", async ({ request }) => {
    // Re-register the (still unverified) address → a fresh code → verify.
    const reissued = await request.post("/api/auth/register", {
      data: { email, password, fullName: "Hardening V2" },
    });
    expect(reissued.status()).toBe(200);
    const { code } = await reissued.json();

    const verified = await request.post("/api/auth/verify-email", {
      data: { email, code },
    });
    expect(verified.ok()).toBeTruthy();

    const setCookie = verified.headers()["set-cookie"] ?? "";
    sessionCookie = setCookie.split(";")[0] ?? "";
    expect(sessionCookie).toContain("sf_session=");

    const me = await request.get("/api/auth/me", {
      headers: { cookie: sessionCookie },
    });
    expect(me.ok()).toBeTruthy();

    // The in-app delivery is opted in for this suite: the response carries
    // the one-shot path (unit pins assert the production-default OFF shape).
    const forgot = await request.post("/api/auth/forgot-password", {
      data: { email },
    });
    expect(forgot.ok()).toBeTruthy();
    const { resetPath } = await forgot.json();
    expect(resetPath).toContain("/reset-password?token=");

    const token = new URL(resetPath, "http://localhost").searchParams.get("token");
    expect(token).toBeTruthy();

    const reset = await request.post("/api/auth/reset-password", {
      data: { token, password: "RotatedV2!Pass9" },
    });
    expect(reset.ok()).toBeTruthy();

    // The pre-reset cookie is DEAD (tokenVersion bumped in the same tx).
    const revoked = await request.get("/api/auth/me", {
      headers: { cookie: sessionCookie },
    });
    expect(revoked.status()).toBe(401);

    // The new password signs in.
    const login = await request.post("/api/auth/login", {
      data: { email, password: "RotatedV2!Pass9" },
    });
    expect(login.ok()).toBeTruthy();
  });
});
