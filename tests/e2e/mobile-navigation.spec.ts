import { expect, test } from "@playwright/test";

import { ROUTES } from "./helpers";

// ---------------------------------------------------------------------------
// THE MOBILE NAVIGATION CONTRACT (the reference ships NO working mobile menu
// — its 220px sidebar stays expanded and clips the content at 390px; the
// clone's drawer is the superset, pinned here).
//
// Trap 4 (Tailwind v4) is guarded in test form: the drawer's nav list is a
// flex gap-* container, and the gaps render as designed (the v4 :where()
// rewrite must not change the list's geometry).
// ---------------------------------------------------------------------------

const MOBILE = { width: 390, height: 844 };

test.use({ viewport: MOBILE });

test.describe("mobile navigation (390×844)", () => {
  test("the app bar carries the hamburger and the store name", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByTestId("mobile-app-bar");
    await expect(bar).toBeVisible();
    await expect(bar.getByTestId("mobile-menu-button")).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("Mi Tienda");
  });

  test("the drawer opens with all 8 links and closes via the X", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();
    for (const label of ["Terminal", "Dashboard", "Inventario", "Ventas", "Cajas", "Cajeros", "Reportes", "Ajustes"]) {
      await expect(panel.getByRole("link", { name: label })).toBeVisible();
    }

    await page.getByTestId("mobile-drawer-close").click();
    await expect(panel).toHaveCount(0);
  });

  test("the drawer panel is a 288px full-height overlay and body scroll locks", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box?.width).toBe(288);
    expect(box?.height).toBe(MOBILE.height);

    const locked = await page.evaluate(() => document.body.style.overflow);
    expect(locked).toBe("hidden");
  });

  test("Escape closes the drawer and unlocks the body", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("");
  });

  test("the backdrop closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();

    await page
      .getByTestId("mobile-drawer-overlay")
      .locator("button")
      .first()
      .click({ position: { x: 360, y: 400 } });
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
  });

  test("navigating from the drawer flips the view and closes it", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await page.getByTestId("mobile-drawer-panel").getByTestId("nav-dashboard").click();

    await expect(page).toHaveURL(/\/Dashboard$/);
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
  });

  test("the hamburger carries aria-expanded through the open/close cycle", async ({ page }) => {
    await page.goto("/");
    const button = page.getByTestId("mobile-menu-button");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("focus moves into the drawer on open and Tab wraps inside (V2 L11)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();

    // Focus entered the dialog (aria-modal's contract — the historical
    // overlay left focus on the hamburger and Tab escaped the dialog).
    const insideOnOpen = await page.evaluate(() => ({
      active: document.activeElement?.textContent ?? "",
      inside: !!document.activeElement?.closest('[data-testid="mobile-drawer-panel"]'),
    }));
    expect(insideOnOpen.inside).toBe(true);

    // Walk to the LAST focusable (the 8th nav link), then Tab must wrap
    // to the FIRST focusable inside the panel (the close button).
    for (let i = 0; i < 9; i += 1) await page.keyboard.press("Tab");
    const wrap = await page.evaluate(() => ({
      active: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? "",
      inside: !!document.activeElement?.closest('[data-testid="mobile-drawer-panel"]'),
    }));
    expect(wrap.inside).toBe(true);
    expect(wrap.active).toBe("Cerrar menú");
  });

  test("Escape returns focus to the hamburger (V2 L11)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    const returned = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-testid"),
    );
    expect(returned).toBe("mobile-menu-button");
  });

  test("TRAP-4 GUARD: the drawer nav list gaps are uniform (flex gap, no margin drift)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    // The 8 links sit in a flex container; every consecutive pair must share
    // ONE gap value — a v4 space-y/margin interaction would show up here as
    // a differing offset on the CTA-like first row (the reference bug).
    const tops = await page.getByTestId("mobile-drawer-panel").getByRole("link").evaluateAll(
      (links) => links.map((link) => link.getBoundingClientRect().top),
    );
    expect(tops).toHaveLength(8);
    const gaps: number[] = [];
    for (let i = 1; i < tops.length; i += 1) gaps.push(tops[i] - tops[i - 1]);
    const first = gaps[0];
    for (const gap of gaps) expect(Math.abs(gap - first)).toBeLessThan(0.5);
    // And the gap is the designed 4px flex gap (not a resurrected 12px margin).
    expect(Math.abs(first - 44)).toBeLessThan(3); // link height 40 + gap 4
  });

  test("no horizontal overflow on any mobile view", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});
