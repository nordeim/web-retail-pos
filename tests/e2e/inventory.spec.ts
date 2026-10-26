import { expect, test } from "@playwright/test";

import { openShiftOnCaja1 } from "./helpers";

// Inventory CRUD + the master-data surfaces the superset guarantees.

test("create → filter → edit → delete a product", async ({ page }) => {
  await page.goto("/Inventory");
  await expect(page.getByTestId("inventory-view")).toBeVisible();
  await expect(page.getByTestId("inventory-table")).toContainText("12");

  // CREATE
  await page.getByTestId("new-product").click();
  await expect(page.getByTestId("product-dialog")).toBeVisible();
  const dialog = page.getByTestId("product-dialog");
  await dialog.getByLabel(/^Nombre/).fill("Galletas Emperador 90g");
  await dialog.getByLabel("Código de barras").fill("7501234567890");
  await dialog.getByLabel("Categoría").selectOption({ label: "Snacks" });
  await dialog.getByLabel("Precio de venta").fill("21.50");
  await dialog.getByLabel("Stock actual").fill("25");
  await page.getByTestId("product-save").click();
  await expect(page.getByTestId("product-dialog")).not.toBeVisible();
  await expect(page.getByTestId("inventory-row-7501234567890")).toContainText("Galletas Emperador 90g");
  await expect(page.getByTestId("inventory-row-7501234567890")).toContainText("$21.50");

  // FILTER by category chip
  await page.getByRole("button", { name: "Snacks", exact: true }).first().click();
  await expect(page.getByTestId("inventory-row-7501234567890")).toBeVisible();
  await expect(page.getByTestId("inventory-row-7501055300120")).not.toBeVisible();
  await page.getByRole("button", { name: "Todos", exact: true }).click();

  // SEARCH by barcode
  await page.getByTestId("inventory-search").fill("7501234567890");
  await expect(page.getByTestId("inventory-row-7501234567890")).toBeVisible();
  await page.getByTestId("inventory-search").fill("");

  // EDIT (rename + reprice)
  await page.getByTestId("inventory-row-7501234567890").getByRole("button", { name: /Editar Galletas/ }).click();
  await expect(page.getByTestId("product-dialog")).toBeVisible();
  await page.getByTestId("product-dialog").getByLabel("Precio de venta").fill("23.00");
  await page.getByTestId("product-save").click();
  await expect(page.getByTestId("inventory-row-7501234567890")).toContainText("$23.00");

  // DELETE
  await page.getByTestId("inventory-row-7501234567890").getByRole("button", { name: /Eliminar Galletas/ }).click();
  await page.getByTestId("product-delete-confirm").click();
  await expect(page.getByTestId("inventory-row-7501234567890")).not.toBeVisible();
});

test("duplicate barcodes are rejected 409 with a visible toast", async ({ page }) => {
  await page.goto("/Inventory");
  await page.getByTestId("new-product").click();
  const dialog = page.getByTestId("product-dialog");
  await dialog.getByLabel(/^Nombre/).fill("Coca-Cola clon");
  await dialog.getByLabel("Código de barras").fill("7501055300120");
  await dialog.getByLabel("Precio de venta").fill("10.00");
  await page.getByTestId("product-save").click();
  await expect(page.getByTestId("product-dialog")).toBeVisible();
  // The P2002 unique-barcode conflict surfaces the server's own message.
  await expect(page.getByRole("region", { name: "Notifications" })).toContainText(
    /already exists|ya existe/i,
  );
  await page.keyboard.press("Escape");
});

test("cajeros CRUD works (the reference ships this empty)", async ({ page }) => {
  await page.goto("/Cashiers");
  await expect(page.getByTestId("cashiers-view")).toBeVisible();
  await page.getByTestId("new-cashier").click();
  await page.getByLabel(/^Nombre/).fill("Ana López");
  await page.getByTestId("cashier-save").click();
  await expect(page.getByTestId("cashier-card-Ana López")).toBeVisible();

  // delete cleanup (keeps the seed state stable for other specs)
  await page
    .getByTestId("cashier-card-Ana López")
    .getByRole("button", { name: /Eliminar Ana/ })
    .click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
  await expect(page.getByTestId("cashier-card-Ana López")).not.toBeVisible();
});

test("the full shift lifecycle works end-to-end", async ({ page }) => {
  await openShiftOnCaja1(page);
  // Caja 1 now shows Abierta + the close affordance; Terminal is unblocked.
  await page.goto("/POS");
  await expect(page.getByTestId("terminal-active")).toBeVisible();

  // Close it again (counted = float; zero sales in this spec).
  await page.goto("/Registers");
  await page.getByTestId("close-shift-card-caja-1").click();
  await expect(page.getByTestId("close-shift-dialog")).toBeVisible();
  await expect(page.getByTestId("close-shift-dialog")).toContainText("Esperado en caja");
  await page.getByTestId("shift-counted-input").fill("200.00");
  await page.getByTestId("shift-close-confirm").click();
  await expect(page.getByTestId("close-shift-dialog")).not.toBeVisible();
  await expect(page.getByTestId("open-shift-card-caja-1")).toBeVisible();
});
