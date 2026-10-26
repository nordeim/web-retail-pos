import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// The "setup" project: sign the demo user in ONCE and save the session
// cookie for every main-project spec (the auth endpoints are rate-limited —
// per-test logins would trip the limiter mid-suite).

const AUTH_STATE = "tests/e2e/.auth/user.json";

test("authenticate the demo user", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(DEMO_EMAIL);
  await page.getByTestId("login-password").fill(DEMO_PASSWORD);
  await page.getByTestId("login-submit").click();

  // The shell is the auth proof: the desktop sidebar renders with the nav.
  await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  await expect(page.getByTestId("terminal-no-shift")).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE });
});
