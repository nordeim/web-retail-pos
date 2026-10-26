import { expect, test } from "@playwright/test";

import { waitForShell } from "./helpers";

// The desktop SPA navigation: the sidebar's 8 links flip the view in place
// (pushState + view swap — the URL changes, the shell does not reload).

const ROUTES: [string, string, RegExp][] = [
  ["Terminal", "terminal-no-shift|terminal-active", /\/POS$/],
  ["Dashboard", "dashboard-view", /\/Dashboard$/],
  ["Inventario", "inventory-view", /\/Inventory$/],
  ["Ventas", "sales-view", /\/Sales$/],
  ["Cajas", "registers-view", /\/Registers$/],
  ["Cajeros", "cashiers-view", /\/Cashiers$/],
  ["Reportes", "reports-view", /\/Reports$/],
  ["Ajustes", "settings-view", /\/StoreSettings$/],
];

test("all 8 sidebar links navigate the SPA shell", async ({ page }) => {
  await page.goto("/POS");
  await waitForShell(page);

  for (const [label, testId, url] of ROUTES) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page.getByTestId(RegExp(testId))).toBeVisible();
    await expect(page).toHaveURL(url);
    // aria-current marks the active item (a11y baseline).
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("browser back returns to the previous view (popstate)", async ({ page }) => {
  await page.goto("/POS");
  await waitForShell(page);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/Dashboard$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/POS$/);
  await expect(page.getByTestId("terminal-no-shift")).toBeVisible();
});

test("the sidebar collapses to the icon rail and back", async ({ page }) => {
  await page.goto("/POS");
  await waitForShell(page);
  const sidebar = page.getByTestId("desktop-sidebar");
  await sidebar.getByRole("button", { name: "Colapsar menú" }).click();
  await expect(sidebar).toHaveCSS("width", "68px");
  await sidebar.getByRole("button", { name: "Expandir menú" }).click();
  await expect(sidebar).toHaveCSS("width", "220px");
});
