// Capture the clone's screens: desktop (1280×800) + mobile (390×844) for
// every view, saved to docs/screenshots/. Run against the standalone server
// on :3000 (PROBE_URL to override).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.PROBE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["POS", "Terminal"],
  ["Dashboard", "Dashboard"],
  ["Inventory", "Inventario"],
  ["Sales", "Ventas"],
  ["Registers", "Cajas"],
  ["Cashiers", "Cajeros"],
  ["Reports", "Reportes"],
  ["StoreSettings", "Ajustes"],
];

const browser = await chromium.launch();

// ---- desktop ----
const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desktop.goto(`${BASE}/login`);
await desktop.getByTestId("login-email").fill("demo@veloxpos.mx");
await desktop.getByTestId("login-password").fill("Demo1234");
await desktop.getByTestId("login-submit").click();
await desktop.waitForURL(/\/POS/);
await desktop.waitForSelector("[data-app-hydrated=true]");

// Open a shift first so the Terminal renders the selling surface in shots.
await desktop.goto(`${BASE}/Registers`);
await desktop.waitForSelector("[data-testid=registers-view]");
if (await desktop.getByTestId("open-shift-card-caja-1").isVisible().catch(() => false)) {
  await desktop.getByTestId("open-shift-card-caja-1").click();
  await desktop.getByTestId("shift-cashier-select").selectOption({ index: 1 });
  await desktop.getByTestId("shift-start").click();
  await desktop.waitForTimeout(600);
}

for (const [path, name] of ROUTES) {
  await desktop.goto(`${BASE}/${path}`);
  await desktop.waitForSelector("[data-app-hydrated=true]");
  await desktop.waitForTimeout(1200);
  await desktop.screenshot({ path: `${OUT}/desktop-${name}.png` });
  console.log(`desktop-${name}.png`);
}

// Login screen (fresh context).
const loggedOut = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await loggedOut.goto(`${BASE}/login`);
await loggedOut.waitForTimeout(800);
await loggedOut.screenshot({ path: `${OUT}/desktop-Login.png` });
console.log("desktop-Login.png");

// ---- mobile (390×844): every view + the drawer open ----
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${BASE}/login`);
await mobile.getByTestId("login-email").fill("demo@veloxpos.mx");
await mobile.getByTestId("login-password").fill("Demo1234");
await mobile.getByTestId("login-submit").click();
await mobile.waitForURL(/\/POS/);
await mobile.waitForSelector("[data-app-hydrated=true]");

for (const [path, name] of ROUTES) {
  await mobile.goto(`${BASE}/${path}`);
  await mobile.waitForSelector("[data-app-hydrated=true]");
  await mobile.waitForTimeout(1000);
  await mobile.screenshot({ path: `${OUT}/mobile-${name}.png` });
  console.log(`mobile-${name}.png`);
}

// The working drawer.
await mobile.getByTestId("mobile-hamburger").click();
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: `${OUT}/mobile-Navegacion.png` });
console.log("mobile-Navegacion.png");

await browser.close();
console.log("done");
