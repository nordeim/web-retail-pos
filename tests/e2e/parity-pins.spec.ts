// ---------------------------------------------------------------------------
// Session V2 visual-parity pins — computed-style contracts measured from the
// LIVE reference on 2026-10-26 (docs/remediation-plan-v2.md §R3). The live
// frames backing every number: docs/screenshots/live-ref-*.png (sweep
// evidence) + the fresh computed-style probes recorded in the plan.
// ---------------------------------------------------------------------------

import { test, expect } from "@playwright/test";

/**
 * Chrome 132+ serializes computed colors in lab()/oklab() (Tailwind v4's
 * native spaces); the live v3 reference reports sRGB. The canvas normalizer
 * resolves ANY CSS color to its sRGB canvas form (#rrggbb / rgba) so the
 * pins compare resolved colors, not serializations.
 */
function normalizeColor(page: import("@playwright/test").Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.fillStyle = getComputedStyle(el).color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; // 8-bit sRGB, always
    const alpha = Math.round((a / 255) * 100) / 100;
    return alpha === 1 ? `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  });
}

test.describe("the section-card heading contract (V1)", () => {
  test("dashboard cards: h3 title case, slate-700, 16px bold", async ({ page }) => {
    await page.goto("/Dashboard");
    const heading = page.locator('[data-testid="weekly-chart-card"] h3');
    await expect(heading).toHaveText("Ventas — Últimos 7 días");
    const style = await heading.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.textTransform, size: cs.fontSize, weight: cs.fontWeight };
    });
    expect(style.transform).toBe("none");
    // slate-700 — the reference's muted heading (a disclosed parity choice).
    expect(await normalizeColor(page, '[data-testid="weekly-chart-card"] h3')).toBe("#334155");
    expect(style.size).toBe("16px");
    expect(style.weight).toBe("700");
  });

  test("reports cards: uppercase kicker, white/60, 14px, 0.7px tracking", async ({ page }) => {
    await page.goto("/Reports");
    const heading = page.locator('[data-testid="report-daily-card"] h3');
    await expect(heading).toHaveText("Ventas diarias"); // DOM text stays title case
    const style = await heading.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.textTransform, size: cs.fontSize, ls: cs.letterSpacing };
    });
    expect(style.transform).toBe("uppercase");
    expect(await normalizeColor(page, '[data-testid="report-daily-card"] h3')).toBe("rgba(255, 255, 255, 0.6)");
    expect(style.size).toBe("14px");
    expect(parseFloat(style.ls)).toBeCloseTo(0.7, 1);
  });

  test("ajustes cards: the card variant (title case, slate-700)", async ({ page }) => {
    await page.goto("/StoreSettings");
    const heading = page.locator('[data-testid="settings-business-card"] h3');
    await expect(heading).toHaveText("Información del Negocio");
    const style = await heading.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.textTransform, size: cs.fontSize };
    });
    expect(style.transform).toBe("none");
    expect(await normalizeColor(page, '[data-testid="settings-business-card"] h3')).toBe("#334155");
    expect(style.size).toBe("16px");
  });
});

test.describe("the page heading contract (V2)", () => {
  test("the H1 is 24px at desktop (the reference has no sm:text-3xl step)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/StoreSettings");
    const h1 = page.locator("h1");
    await expect(h1).toHaveText("Ajustes de la Tienda");
    const size = await h1.evaluate((el) => getComputedStyle(el).fontSize);
    expect(size).toBe("24px");
  });
});

test.describe("the chart contracts (V3/V4)", () => {
  test("the reports 30-day chart thins X labels and formats integer $ Y labels", async ({ page }) => {
    await page.goto("/Reports");
    const chart = page.locator('[data-testid="report-daily-card"] svg[role="img"]');
    await expect(chart).toBeVisible();
    await expect(chart.locator("text").first()).toBeVisible(); // data loaded
    const labels = await chart.evaluate((svg) => {
      const texts = [...svg.querySelectorAll("text")];
      const bottom =
        parseFloat(svg.getAttribute("viewBox")?.split(" ")[3] ?? "0") - 8;
      // X labels sit EXACTLY on the bottom row (y = height - 8); Y labels
      // ride the grid rows above it.
      const yLabels = texts
        .filter((t) => parseFloat(t.getAttribute("y") ?? "0") < bottom - 5)
        .map((t) => t.textContent ?? "");
      const xCount = texts.filter(
        (t) => Math.abs(parseFloat(t.getAttribute("y") ?? "0") - bottom) < 1,
      ).length;
      return { yLabels, xCount };
    });
    // ~8 evenly stepped dates for 30 days — never 30 overlapping texts.
    expect(labels.xCount).toBeLessThanOrEqual(9);
    expect(labels.xCount).toBeGreaterThanOrEqual(4);
    // Y labels: integer dollars.
    for (const label of labels.yLabels) expect(label).toMatch(/^\$\d+$/);
  });

  test("the dashboard week ends at today's weekday (M2/V4)", async ({ page }) => {
    await page.goto("/Dashboard");
    const chart = page.locator('[data-testid="weekly-chart-card"] svg[role="img"]');
    await expect(chart).toBeVisible();
    await expect(chart.locator("text").first()).toBeVisible(); // data loaded
    const xLabels = await chart.evaluate((svg) => {
      const bottom = parseFloat(svg.getAttribute("viewBox")?.split(" ")[3] ?? "0") - 8;
      return [...svg.querySelectorAll("text")]
        .filter((t) => Math.abs(parseFloat(t.getAttribute("y") ?? "0") - bottom) < 1)
        .map((t) => t.textContent ?? "");
    });
    expect(xLabels).toHaveLength(7);
    const WEEKDAY_MIN = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
    const today = new Date();
    const iso = (d: Date) => (d.getDay() + 6) % 7;
    expect(xLabels[6]).toBe(WEEKDAY_MIN[iso(today)]);
    expect(xLabels[5]).toBe(WEEKDAY_MIN[iso(new Date(today.getTime() - 86400000))]);
  });

  test("the dashboard Y axis is plain integers (no $)", async ({ page }) => {
    await page.goto("/Dashboard");
    const chart = page.locator('[data-testid="weekly-chart-card"] svg[role="img"]');
    await expect(chart.locator("text").first()).toBeVisible(); // data loaded
    const yLabels = await chart.evaluate((svg) => {
      const bottom = parseFloat(svg.getAttribute("viewBox")?.split(" ")[3] ?? "0") - 8;
      return [...svg.querySelectorAll("text")]
        .filter((t) => parseFloat(t.getAttribute("y") ?? "0") < bottom - 5)
        .map((t) => t.textContent ?? "");
    });
    for (const label of yLabels) expect(label).toMatch(/^\d+$/);
  });
});

test.describe("the ajustes + dashboard structures (V5/V6)", () => {
  test("the logotipo control is the styled Subir logo button (V5)", async ({ page }) => {
    await page.goto("/StoreSettings");
    const button = page.locator('label[for="settings-logo"]').filter({ hasText: "Subir logo" });
    await expect(button).toContainText("Subir logo");
    const input = page.locator("#settings-logo");
    await expect(input).toBeAttached();
    // The wiring survives: choosing a file updates the name line.
    await input.setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from("png"),
    });
    await expect(page.getByTestId("settings-logo-file")).toContainText("logo.png");
  });

  test("the low-stock row carries the icon chip + stacked copy (V6)", async ({ page }) => {
    await page.goto("/Dashboard");
    const row = page.locator('[data-testid="low-stock-card"] li').first();
    await expect(row).toContainText("Atún Dolores 295g");
    await expect(row).toContainText("3 en stock (mín. 5)");
    // The amber icon chip leads the row; the stock line sits under the name.
    const anatomy = await row.evaluate((li) => ({
      leadsWithSvg: li.querySelector("span svg") !== null,
      nameLine: li.querySelector("div p:first-child")?.textContent ?? "",
      detailBelow: li.querySelector("div p:last-child")?.textContent ?? "",
    }));
    expect(anatomy.leadsWithSvg).toBe(true);
    expect(anatomy.nameLine).toContain("Atún");
    expect(anatomy.detailBelow).toContain("en stock (mín. 5)");
  });
});
