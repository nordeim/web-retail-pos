import { describe, expect, it } from "vitest";

import { NAV_ITEMS, VIEWS, pathForView, viewFromPath } from "@/lib/router";

describe("the reference route map", () => {
  it("carries the 8 reference views with their measured paths", () => {
    expect(VIEWS).toHaveLength(8);
    expect(pathForView("terminal")).toBe("/POS");
    expect(pathForView("dashboard")).toBe("/Dashboard");
    expect(pathForView("inventory")).toBe("/Inventory");
    expect(pathForView("sales")).toBe("/Sales");
    expect(pathForView("registers")).toBe("/Registers");
    expect(pathForView("cashiers")).toBe("/Cashiers");
    expect(pathForView("reports")).toBe("/Reports");
    expect(pathForView("settings")).toBe("/StoreSettings");
  });

  it("falls back to /POS for unknown ids", () => {
    expect(pathForView("nope" as never)).toBe("/POS");
  });
});

describe("viewFromPath", () => {
  it("is case-insensitive and slash-tolerant", () => {
    expect(viewFromPath("/dashboard")).toBe("dashboard");
    expect(viewFromPath("/pos/")).toBe("terminal");
    expect(viewFromPath("/StoreSettings")).toBe("settings");
  });

  it("maps root and unknown paths to the terminal", () => {
    expect(viewFromPath("/")).toBe("terminal");
    expect(viewFromPath("/nowhere")).toBe("terminal");
    expect(viewFromPath("")).toBe("terminal");
  });
});

describe("NAV_ITEMS", () => {
  it("labels are the reference's Spanish nav", () => {
    expect(NAV_ITEMS.map((n) => n.label)).toEqual([
      "Terminal",
      "Dashboard",
      "Inventario",
      "Ventas",
      "Cajas",
      "Cajeros",
      "Reportes",
      "Ajustes",
    ]);
  });
});
