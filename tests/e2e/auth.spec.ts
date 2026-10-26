import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// The logged-out surface — opts out of the shared storageState on purpose.
test.use({ storageState: { cookies: [], origins: [] } });

test("the login card renders the reference layout", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome to VeloxPOS" })).toBeVisible();
  await expect(page.getByText("Sign in to continue")).toBeVisible();
  for (const provider of ["Google", "Microsoft", "Facebook", "Apple"]) {
    await expect(page.getByRole("button", { name: `Continue with ${provider}` })).toBeVisible();
  }
  await expect(page.getByTestId("login-email")).toBeVisible();
  await expect(page.getByTestId("login-password")).toBeVisible();
  await expect(page.getByTestId("login-submit")).toHaveText("Sign in");
  await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
});

test("a wrong password answers an inline error (no navigation)", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(DEMO_EMAIL);
  await page.getByTestId("login-password").fill("WrongPass1");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toBeVisible();
  expect(page.url()).toContain("/login");
});

test("the demo user signs in and lands on the Terminal", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(DEMO_EMAIL);
  await page.getByTestId("login-password").fill(DEMO_PASSWORD);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/POS$/);
  await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  // Seed: no shift open → the reference's exact empty state copy.
  await expect(page.getByTestId("terminal-no-shift")).toContainText("No hay turno activo");
});

test("a protected route redirects anonymous visitors to /login", async ({ page }) => {
  await page.goto("/Dashboard");
  await expect(page).toHaveURL(/\/login/);
});
