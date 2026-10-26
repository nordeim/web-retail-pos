import { expect, test } from "@playwright/test";

import { COCA_BARCODE, COCA_NAME, openShiftOnCaja1, waitForShell } from "./helpers";

// The Terminal sale journey — the app's core loop: open shift → add to
// ticket → COBRAR → payment dialog → confirm → ticket lands in Ventas with
// the reference's exact math (1× Coca-Cola = subtotal $18.50, IVA $2.96,
// total $21.46) and the product stock decrements.

test("the terminal gates selling behind an open shift", async ({ page }) => {
  await page.goto("/POS");
  await waitForShell(page);
  await expect(page.getByTestId("terminal-no-shift")).toContainText("No hay turno activo");
  await expect(page.getByTestId("terminal-no-shift")).toContainText("Cajas");
});

test.describe("with an open shift", () => {
  test.beforeEach(async ({ page }) => {
    await openShiftOnCaja1(page);
  });

  test("search + add + COBRAR completes the reference ticket", async ({ page }) => {
    await page.goto("/POS");
    await waitForShell(page);
    await expect(page.getByTestId("terminal-active")).toBeVisible();

    // Search by barcode — the scanner path.
    await page.getByTestId("terminal-search").fill(COCA_BARCODE);
    await page.getByTestId(`terminal-product-${COCA_BARCODE}`).click();

    // The ticket panel shows the line and the exact money math.
    await expect(page.getByTestId("terminal-cart")).toContainText(COCA_NAME);
    await expect(page.getByTestId("terminal-subtotal")).toHaveText("$18.50");
    await expect(page.getByTestId("terminal-tax")).toHaveText("$2.96");
    await expect(page.getByTestId("terminal-total")).toHaveText("$21.46");
    await expect(page.getByTestId("terminal-charge")).toContainText("COBRAR $21.46");

    // Payment dialog: default Efectivo, confirm.
    await page.getByTestId("terminal-charge").click();
    await expect(page.getByTestId("payment-dialog")).toBeVisible();
    await page.getByTestId("payment-confirm").click();

    // The completed dialog announces the ticket.
    await expect(page.getByTestId("sale-completed-dialog")).toBeVisible();
    await expect(page.getByTestId("completed-ticket")).toContainText("V-");

    // Stock decremented (seed: 47 → 46).
    await page.getByTestId("sale-completed-dialog").getByRole("button", { name: "Nueva venta" }).click();
    await page.getByTestId("terminal-search").fill(COCA_NAME);
    await expect(page.getByTestId(`terminal-product-${COCA_BARCODE}`)).toContainText("46 en stock");

    // The sale is in Ventas with the reference's status badge.
    await page.goto("/Sales");
    await expect(page.getByTestId("sales-table")).toContainText("Completada");
    await expect(page.getByTestId("sales-table")).toContainText("$21.46");
  });

  test("cash payment shows the change", async ({ page }) => {
    await page.goto("/POS");
    await waitForShell(page);
    await page.getByTestId(`terminal-product-${COCA_BARCODE}`).click();
    await page.getByTestId("terminal-charge").click();
    await page.getByLabel("Efectivo recibido").fill("50");
    await expect(page.getByTestId("payment-change")).toContainText("Cambio: $28.54");
  });

  test("quantity stepper updates the totals", async ({ page }) => {
    await page.goto("/POS");
    await waitForShell(page);
    await page.getByTestId(`terminal-product-${COCA_BARCODE}`).click();
    await page.getByTestId(`terminal-product-${COCA_BARCODE}`).click();
    await expect(page.getByTestId("terminal-total")).toHaveText("$42.92");
  });
});
