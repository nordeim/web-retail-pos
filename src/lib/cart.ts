// ---------------------------------------------------------------------------
// The cart seam — pure terminal state math. The Terminal view owns the cart
// in component state; every mutation's derived numbers come from here so the
// COBRAR button, the ticket panel and the checkout payload can never disagree.
// Pinned by tests/cart.test.ts.
// ---------------------------------------------------------------------------

import { lineTaxCents, roundHalfUp } from "./money";

/** The cart line the Terminal renders — a snapshot of the product at add
 *  time (name/price/tax ride the line; stock checks stay live via product). */
export type CartLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  taxRate: number;
};

export type CartTotals = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  itemCount: number;
  lineCount: number;
};

/** Add one unit of a product (or bump the existing line). Pure. */
export function addToCart(cart: CartLine[], product: {
  id: string; name: string; priceCents: number; taxRate: number;
}, maxQty = Infinity): CartLine[] {
  const existing = cart.find((l) => l.productId === product.id);
  if (existing) {
    return cart.map((l) =>
      l.productId === product.id
        ? { ...l, quantity: Math.min(l.quantity + 1, maxQty) }
        : l,
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: 1,
      taxRate: product.taxRate,
    },
  ];
}

/** Set a line's quantity (clamped to 1..maxQty; below 1 removes the line). */
export function setLineQuantity(cart: CartLine[], productId: string, quantity: number, maxQty = Infinity): CartLine[] {
  if (quantity < 1) return cart.filter((l) => l.productId !== productId);
  return cart.map((l) =>
    l.productId === productId ? { ...l, quantity: Math.min(quantity, maxQty) } : l,
  );
}

export function removeLine(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((l) => l.productId !== productId);
}

/** The reference's ticket math: subtotal = Σ price×qty (tax-exclusive),
 *  tax = Σ half-up(price×qty×rate), total = subtotal + tax. */
export function cartTotals(cart: CartLine[]): CartTotals {
  let subtotalCents = 0;
  let taxCents = 0;
  let itemCount = 0;
  for (const line of cart) {
    const lineTotal = roundHalfUp(line.unitPriceCents * line.quantity);
    subtotalCents += lineTotal;
    taxCents += lineTaxCents(line.unitPriceCents, line.quantity, line.taxRate);
    itemCount += line.quantity;
  }
  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    itemCount,
    lineCount: cart.length,
  };
}

/** Cash-change math for the Efectivo flow (round to the peso in the UI seam
 *  is the caller's choice — this returns exact cents). Negative → null. */
export function changeCents(totalCents: number, receivedCents: number): number | null {
  const change = receivedCents - totalCents;
  return change >= 0 ? change : null;
}
