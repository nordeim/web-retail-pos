// Probe: find horizontally-overflowing elements on a route at 390×844.
// Usage: node scripts/overflow-probe.mjs /Reports 390
import { chromium } from "playwright";

const route = process.argv[2] ?? "/Reports";
const width = Number(process.argv[3] ?? 390);
const BASE = process.env.PROBE_URL ?? "http://localhost:3200";

// login first
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 844 } });
await page.goto(`${BASE}/login`);
await page.getByTestId("login-email").fill("demo@veloxpos.mx");
await page.getByTestId("login-password").fill("Demo1234");
await page.getByTestId("login-submit").click();
try {
  await page.waitForURL(/\/POS/, { timeout: 15000 });
} catch {
  console.error("login did not navigate; url:", page.url());
  await page.screenshot({ path: "probe-login-stuck.png", fullPage: true });
  process.exit(1);
}
await page.waitForSelector("[data-app-hydrated=true]", { timeout: 20000 });

await page.goto(`${BASE}${route}`);
await page.waitForSelector("[data-app-hydrated=true]");
await page.waitForTimeout(1500);

const overflow = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll("*")) {
    const rect = el.getBoundingClientRect();
    if (rect.right > docW + 1 || rect.left < -1) {
      const cls = (el.className && typeof el.className === "string") ? el.className.slice(0, 70) : el.tagName;
      out.push({ tag: el.tagName, cls, left: Math.round(rect.left), right: Math.round(rect.right), w: Math.round(rect.width) });
    }
  }
  return { docW, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 12) };
});
console.log(JSON.stringify(overflow, null, 2));
await browser.close();
