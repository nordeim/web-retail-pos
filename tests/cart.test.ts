import { describe, expect, it } from "vitest";

import {
  addToCart,
  cartTotals,
  changeCents,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "@/lib/cart";

const COCA: Parameters<typeof addToCart>[1] = {
  id: "p-cola",
  name: "Coca-Cola 600ml",
  priceCents: 1850,
  taxRate: 1600,
};
const SABRITAS: Parameters<typeof addToCart>[1] = {
  id: "p-sabritas",
  name: "Sabritas Original 45g",
  priceCents: 1600,
  taxRate: 1600,
};

describe("addToCart / setLineQuantity / removeLine", () => {
  it("adds a new line then bumps the same line (no duplicates)", () => {
    let cart = addToCart([], COCA);
    expect(cart).toHaveLength(1);
    cart = addToCart(cart, COCA);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("clamps quantity to stock and removes below 1", () => {
    let cart = addToCart([], COCA, 3);
    cart = setLineQuantity(cart, COCA.id, 10, 3);
    expect(cart[0].quantity).toBe(3);
    cart = setLineQuantity(cart, COCA.id, 0, 3);
    expect(cart).toHaveLength(0);
  });

  it("removes a single line", () => {
    let cart = addToCart([], COCA);
    cart = addToCart(cart, SABRITAS);
    cart = removeLine(cart, COCA.id);
    expect(cart.map((l) => l.productId)).toEqual(["p-sabritas"]);
  });
});

describe("cartTotals — the reference ticket math", () => {
  it("1× Coca-Cola: subtotal 18.50, IVA 2.96, total 21.46 (measured live)", () => {
    const cart: CartLine[] = [
      { productId: "p-cola", name: "Coca-Cola 600ml", unitPriceCents: 1850, quantity: 1, taxRate: 1600 },
    ];
    const totals = cartTotals(cart);
    expect(totals.subtotalCents).toBe(1850);
    expect(totals.taxCents).toBe(296);
    expect(totals.totalCents).toBe(2146);
    expect(totals.itemCount).toBe(1);
  });

  it("multi-line, multi-quantity carts sum per line", () => {
    const cart: CartLine[] = [
      { productId: "p-cola", name: "Coca-Cola", unitPriceCents: 1850, quantity: 2, taxRate: 1600 },
      { productId: "p-sabritas", name: "Sabritas", unitPriceCents: 1600, quantity: 1, taxRate: 1600 },
    ];
    const totals = cartTotals(cart);
    expect(totals.subtotalCents).toBe(5300);
    expect(totals.taxCents).toBe(848);
    expect(totals.totalCents).toBe(6148);
  });

  it("an empty cart is all zeros", () => {
    const totals = cartTotals([]);
    expect(totals.totalCents).toBe(0);
    expect(totals.lineCount).toBe(0);
  });
});

describe("changeCents", () => {
  it("computes change and refuses short payment", () => {
    expect(changeCents(2146, 5000)).toBe(2854);
    expect(changeCents(2146, 2000)).toBeNull();
  });
});
