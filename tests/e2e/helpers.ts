import { expect, type Page } from "@playwright/test";

// Shared e2e constants + helpers. The demo store is seeded by
// prisma/seed.ts (see global-setup); the barcodes below are the seed's
// reference-measured products.

export const DEMO_EMAIL = "demo@veloxpos.mx";
export const DEMO_PASSWORD = "Demo1234";

export const COCA_BARCODE = "7501055300120";
export const COCA_NAME = "Coca-Cola 600ml";
export const ATUN_BARCODE = "7501024520148"; // the low-stock seed row (3 ≤ min 5)

/** Wait for the authed shell (sidebar + hydration marker). */
export async function waitForShell(page: Page): Promise<void> {
  await expect(page.locator("[data-app-hydrated=true]")).toHaveCount(1);
  await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
}

/** Open a shift on Caja 1 with the first cashier (seed guarantees both).
 *  Idempotent: an already-open Caja 1 is left as-is (the terminal specs run
 *  against whatever shift state the previous test left). */
export async function openShiftOnCaja1(page: Page): Promise<void> {
  await page.goto("/Registers");
  // Either lifecycle button proves the register card has rendered.
  await expect(
    page
      .getByTestId("close-shift-card-caja-1")
      .or(page.getByTestId("open-shift-card-caja-1")),
  ).toBeVisible({ timeout: 15_000 });

  const alreadyOpen = await page.getByTestId("close-shift-card-caja-1").isVisible();
  if (alreadyOpen) return;

  await page.getByTestId("open-shift-card-caja-1").click();
  await expect(page.getByTestId("open-shift-dialog")).toBeVisible();
  // The cashier picker is a native <select> — selectOption, not click+role.
  await page.getByTestId("shift-cashier-select").selectOption({ index: 1 });
  await page.getByTestId("shift-start").click();
  await expect(page.getByTestId("open-shift-dialog")).not.toBeVisible();
  await expect(page.getByTestId("close-shift-card-caja-1")).toBeVisible();
}
