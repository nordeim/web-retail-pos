// ---------------------------------------------------------------------------
// The transactional POS surface — the parts that are NOT CRUD:
//   • openShift / closeShift  (the turno lifecycle, one-open-per-register
//     and one-open-per-cashier enforced INSIDE the write, not just the UI)
//   • checkout                (the sale transaction: stock guard → Sale +
//     SaleItems → ticket number, all in one Prisma $transaction so a
//     half-sale can never exist)
// Pinned by tests/e2e (the terminal journey) and tests/validation.test.ts at
// the schema layer; the pure rules live in src/lib/shifts.ts + src/lib/cart.ts.
// ---------------------------------------------------------------------------

import { db } from "../db";
import { cartTotals, type CartLine } from "../cart";
import { closeDifference, expectedCents, openGuard } from "../shifts";
import { NotFoundError, ValidationError } from "./http";

// ---- reads ---------------------------------------------------------------------------

export function listShifts(userId: string) {
  return db.shift.findMany({
    where: { userId },
    orderBy: { openedAt: "desc" },
    take: 200,
  });
}

export function listSales(userId: string) {
  return db.sale.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 500,
  });
}

export function getSale(userId: string, id: string) {
  return db.sale.findFirst({ where: { id, userId }, include: { items: true } });
}

// ---- shift open ------------------------------------------------------------------------

export type OpenShiftInput = {
  registerId: string;
  cashierId: string;
  openingFloatCents: number;
  notes?: string;
};

export async function openShift(userId: string, input: OpenShiftInput) {
  // Existence + ownership pre-checks (404 before rule violations).
  const register = await db.cashRegister.findFirst({
    where: { id: input.registerId, userId },
  });
  if (!register) throw new NotFoundError("La caja no existe.");
  const cashier = await db.cashier.findFirst({
    where: { id: input.cashierId, userId },
  });
  if (!cashier) throw new NotFoundError("El cajero no existe.");

  const existing = await db.shift.findMany({
    where: { userId, status: "open" },
  });
  const guard = openGuard(existing, input);
  if (guard === "register_busy") {
    throw new ValidationError("Esa caja ya tiene un turno abierto.");
  }
  if (guard === "cashier_busy") {
    throw new ValidationError("Ese cajero ya tiene un turno abierto.");
  }
  // negative_float is unreachable (schema enforces ≥ 0) — kept for symmetry.

  // Re-check inside the transaction: two concurrent opens must not both win.
  return db.$transaction(async (tx) => {
    const openNow = await tx.shift.findMany({
      where: { userId, status: "open" },
      select: { registerId: true, cashierId: true },
    });
    const still = openGuard(
      openNow.map((row) => ({ ...row, id: "", status: "open", openingFloatCents: 0, openedAt: new Date() })),
      input,
    );
    if (still === "register_busy") {
      throw new ValidationError("Esa caja ya tiene un turno abierto.");
    }
    if (still === "cashier_busy") {
      throw new ValidationError("Ese cajero ya tiene un turno abierto.");
    }
    return tx.shift.create({
      data: {
        userId,
        registerId: input.registerId,
        cashierId: input.cashierId,
        openingFloatCents: input.openingFloatCents,
        notes: input.notes ?? "",
        status: "open",
      },
    });
  });
}

// ---- shift close ---------------------------------------------------------------------------

export type CloseShiftInput = {
  closingAmountCents: number;
  notes?: string;
};

export async function closeShift(userId: string, shiftId: string, input: CloseShiftInput) {
  const shift = await db.shift.findFirst({ where: { id: shiftId, userId } });
  if (!shift) throw new NotFoundError("El turno no existe.");
  if (shift.status !== "open") throw new ValidationError("Ese turno ya está cerrado.");

  const cashAgg = await db.sale.aggregate({
    where: { userId, shiftId, status: "completed", paymentMethod: "cash" },
    _sum: { totalCents: true },
  });
  const cashSales = cashAgg._sum.totalCents ?? 0;
  const expected = expectedCents(shift.openingFloatCents, cashSales);
  const difference = closeDifference(expected, input.closingAmountCents);

  return db.shift.update({
    where: { id: shiftId },
    data: {
      status: "closed",
      closedAt: new Date(),
      expectedAmountCents: expected,
      closingAmountCents: input.closingAmountCents,
      differenceCents: difference,
      notes: input.notes !== undefined ? input.notes : shift.notes,
    },
  });
}

/** The shift that gates the Terminal (at most one per user is open in the UI
 *  contract; the data model tolerates several — the terminal takes the first). */
export async function activeShift(userId: string) {
  return db.shift.findFirst({
    where: { userId, status: "open" },
    orderBy: { openedAt: "desc" },
    include: { cashier: true, register: true },
  });
}

// ---- checkout ----------------------------------------------------------------------------------

const TICKET_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"; // no I/O/0 lookalikes

export function generateTicketNumber(random: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += TICKET_ALPHABET[Math.floor(random() * TICKET_ALPHABET.length)];
  }
  return `V-${suffix}`;
}

export type CheckoutInputResolved = {
  items: { productId: string; quantity: number }[];
  paymentMethod: string; // validated cash|card|transfer upstream
  customerName?: string;
};

export async function checkout(userId: string, input: CheckoutInputResolved) {
  const shift = await activeShift(userId);
  if (!shift) {
    throw new ValidationError("No hay turno activo. Abre un turno en Cajas antes de vender.");
  }

  // Load the products ONCE (no N+1); build the line set from the snapshot.
  const ids = input.items.map((i) => i.productId);
  const rows = await db.product.findMany({
    where: { userId, id: { in: ids } },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lines: (CartLine & { row: (typeof rows)[number] })[] = [];
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new NotFoundError(`Un producto del ticket ya no existe.`);
    if (!product.active) {
      throw new ValidationError(`"${product.name}" está inactivo y no se puede vender.`);
    }
    if (product.stock < item.quantity) {
      throw new ValidationError(`Stock insuficiente de "${product.name}" (disponible: ${product.stock}).`);
    }
    lines.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      taxRate: product.taxRate,
      row: product,
    });
  }

  const totals = cartTotals(lines);

  // The single transaction: ticket number collision retried by unique
  // constraint is not a practical risk (32^8 space) — one attempt, P2002 → 409.
  return db.$transaction(async (tx) => {
    for (const line of lines) {
      const decremented = await tx.product.updateMany({
        where: { id: line.productId, userId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (decremented.count === 0) {
        // Raced below zero — abort the whole sale (the UI re-fetches stock).
        throw new ValidationError(`Stock insuficiente de "${line.name}".`);
      }
    }

    return tx.sale.create({
      data: {
        userId,
        ticketNumber: generateTicketNumber(),
        cashierId: shift.cashierId,
        registerId: shift.registerId,
        shiftId: shift.id,
        customerName: input.customerName ?? "",
        paymentMethod: input.paymentMethod,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        status: "completed",
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            name: line.name,
            unitPriceCents: line.unitPriceCents,
            quantity: line.quantity,
            taxRate: line.taxRate,
            lineTotalCents: Math.round(line.unitPriceCents * line.quantity),
          })),
        },
      },
      include: { items: true },
    });
  });
}

// ---- reports read model ----------------------------------------------------------------------------

/** The Reports/Dashboard sale feed (completed only, period-agnostic — the
 *  pure seams in src/lib/reports.ts bucket by date client-side). */
export function salesForReports(userId: string) {
  return db.sale.findMany({
    where: { userId, status: "completed" },
    select: {
      id: true,
      totalCents: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
}
