import { describe, expect, it } from "vitest";

import {
  categoryCreateSchema,
  checkoutSchema,
  dataUrlImage,
  hexColor,
  productCreateSchema,
  registerSchema,
  shiftCloseSchema,
  shiftOpenSchema,
  storeSettingsSchema,
} from "@/lib/validation";

describe("productCreateSchema", () => {
  const base = {
    name: "Coca-Cola 600ml",
    barcode: "7501055300120",
    priceCents: 1850,
  };

  it("accepts the reference-shaped product and applies defaults", () => {
    const parsed = productCreateSchema.parse(base);
    expect(parsed.stock).toBe(0);
    expect(parsed.minStock).toBe(5);
    expect(parsed.taxRate).toBe(1600);
    expect(parsed.unit).toBe("Pieza");
    expect(parsed.active).toBe(true);
  });

  it("rejects non-integer cents and negative stock", () => {
    expect(() => productCreateSchema.parse({ ...base, priceCents: 18.5 }).priceCents).toThrow();
    expect(productCreateSchema.safeParse({ ...base, stock: -1 }).success).toBe(false);
  });

  it("rejects blank names and over-long barcodes", () => {
    expect(productCreateSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, barcode: "b".repeat(65) }).success).toBe(false);
  });
});

describe("categoryCreateSchema", () => {
  it("trims and caps the name", () => {
    expect(categoryCreateSchema.parse({ name: "  Bebidas " }).name).toBe("Bebidas");
    expect(categoryCreateSchema.safeParse({ name: "" }).success).toBe(false);
    expect(categoryCreateSchema.safeParse({ name: "c".repeat(61) }).success).toBe(false);
  });
});

describe("shift schemas", () => {
  it("shiftOpenSchema requires register + cashier", () => {
    expect(shiftOpenSchema.safeParse({ registerId: "", cashierId: "" }).success).toBe(false);
    expect(
      shiftOpenSchema.safeParse({ registerId: "r1", cashierId: "c1", openingFloatCents: 0 }).success,
    ).toBe(true);
  });

  it("shiftCloseSchema enforces non-negative integer cents", () => {
    expect(shiftCloseSchema.safeParse({ closingAmountCents: -5 }).success).toBe(false);
    expect(shiftCloseSchema.safeParse({ closingAmountCents: 1.5 }).success).toBe(false);
    expect(shiftCloseSchema.safeParse({ closingAmountCents: 24146 }).success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  it("requires at least one line and rejects duplicate products", () => {
    expect(checkoutSchema.safeParse({ items: [] }).success).toBe(false);
    const dup = {
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p1", quantity: 2 },
      ],
    };
    expect(checkoutSchema.safeParse(dup).success).toBe(false);
  });

  it("defaults the payment method to cash and clamps quantities", () => {
    const parsed = checkoutSchema.parse({ items: [{ productId: "p1", quantity: 2 }] });
    expect(parsed.paymentMethod).toBe("cash");
    expect(checkoutSchema.safeParse({ items: [{ productId: "p1", quantity: 0 }] }).success).toBe(false);
  });
});

describe("storeSettingsSchema", () => {
  it("validates hex colors and card providers", () => {
    const base = { storeName: "Mi Tienda", primaryColor: "#6366f1", secondaryColor: "#8b5cf6" };
    expect(storeSettingsSchema.safeParse(base).success).toBe(true);
    expect(storeSettingsSchema.safeParse({ ...base, primaryColor: "6366f1" }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...base, cardProvider: "stripe" }).success).toBe(false);
  });
});

describe("auth schemas (kept contract)", () => {
  it("register requires upper/lower/digit and 8+ chars", () => {
    expect(registerSchema.safeParse({ fullName: "Cesar", email: "c@x.mx", password: "Abcd1234" }).success).toBe(true);
    expect(registerSchema.safeParse({ fullName: "Cesar", email: "c@x.mx", password: "abcd1234" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "Cesar", email: "c@x.mx", password: "ABCD1234" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "Cesar", email: "c@x.mx", password: "Abcdabcd" }).success).toBe(false);
  });
});

describe("dataUrlImage", () => {
  it("accepts image data URLs up to the cap and rejects others", () => {
    expect(dataUrlImage.safeParse("data:image/png;base64,iVBORw0KGgo=").success).toBe(true);
    expect(dataUrlImage.safeParse("data:text/html;base64,PGI+").success).toBe(false);
    expect(dataUrlImage.safeParse("https://example.com/x.png").success).toBe(false);
  });
});

describe("hexColor", () => {
  it("accepts #rgb and #rrggbb only", () => {
    expect(hexColor.safeParse("#fff").success).toBe(true);
    expect(hexColor.safeParse("#6366f1").success).toBe(true);
    expect(hexColor.safeParse("6366f1").success).toBe(false);
  });
});
