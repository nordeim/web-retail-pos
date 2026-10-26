import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// THE MOBILE NAVIGATION SPEC — the superset fix for the reference's broken
// mobile chrome (measured 390×844 on 2026-10-26: the reference's 220px
// sidebar stays fixed-OPEN on phones with no hamburger/drawer/backdrop).
// The clone ships the working drawer; this suite pins it, including the
// Tailwind-v4 trap the space-y→:where() rewrite caused in the family
// (nav lists here are flex+gap — a regression to space-y would not change
// these assertions, but the drawer geometry/overflow pins would catch the
// spacing drift it produces).
// ---------------------------------------------------------------------------

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile navigation drawer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/POS");
    await expect(page.locator("[data-app-hydrated=true]")).toHaveCount(1);
  });

  test("the app bar shows the hamburger and the desktop rail is hidden", async ({ page }) => {
    await expect(page.getByTestId("mobile-appbar")).toBeVisible();
    await expect(page.getByTestId("mobile-hamburger")).toBeVisible();
    await expect(page.getByTestId("desktop-sidebar")).not.toBeVisible();
  });

  test("the hamburger opens the drawer with all 8 links", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    const drawer = page.getByTestId("mobile-drawer");
    await expect(drawer).toBeVisible();
    const links = drawer.getByRole("link");
    await expect(links).toHaveCount(8);
    await expect(drawer.getByRole("link", { name: "Terminal" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Ajustes" })).toBeVisible();
    // aria-expanded flips on the trigger.
    await expect(page.getByTestId("mobile-hamburger")).toHaveAttribute("aria-expanded", "true");
  });

  test("a drawer link navigates AND closes the drawer", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    await page.getByTestId("mobile-drawer").getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/Dashboard$/);
    await expect(page.getByTestId("dashboard-view")).toBeVisible();
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
  });

  test("the backdrop tap closes the drawer", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
    await page.getByTestId("mobile-drawer-backdrop").click({ position: { x: 350, y: 400 } });
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
  });

  test("Escape closes the drawer and body scroll unlocks", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
    const locked = await page.evaluate(() => document.body.style.overflow);
    expect(locked).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
    const unlocked = await page.evaluate(() => document.body.style.overflow);
    expect(unlocked).toBe("");
  });

  test("the drawer close button works", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    await page.getByTestId("mobile-drawer-close").click();
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
  });

  test("no horizontal overflow at 390×844 on any view", async ({ page }) => {
    for (const path of ["/POS", "/Dashboard", "/Inventory", "/Sales", "/Registers", "/Cashiers", "/Reports", "/StoreSettings"]) {
      await page.goto(path);
      await expect(page.locator("[data-app-hydrated=true]")).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test("the drawer geometry is phone-correct (≤85vw, full height)", async ({ page }) => {
    await page.getByTestId("mobile-hamburger").click();
    const drawer = page.getByTestId("mobile-drawer");
    const box = await drawer.evaluate((el) => {
      const panel = el.querySelector("div.absolute") as HTMLElement;
      const rect = panel.getBoundingClientRect();
      return { width: rect.width, height: rect.height, x: rect.x };
    });
    expect(box.width).toBeLessThanOrEqual(390 * 0.85 + 1);
    expect(box.height).toBe(844);
    expect(box.x).toBe(0);
  });
});
