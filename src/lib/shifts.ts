// ---------------------------------------------------------------------------
// Shift (turno) state seams — the Cajas/Terminal lifecycle rules in pure
// functions. A register can host ONE open shift; a cashier works ONE register
// at a time; closing computes expected = float + cash-sales and the counted
// difference. Pinned by tests/shifts.test.ts.
// ---------------------------------------------------------------------------

export type ShiftLike = {
  id: string;
  registerId: string;
  cashierId: string;
  status: string; // open | closed
  openingFloatCents: number;
  closingAmountCents?: number | null;
  expectedAmountCents?: number | null;
  differenceCents?: number | null;
  openedAt: string | Date;
  closedAt?: string | Date | null;
};

export function isOpen(shift: ShiftLike): boolean {
  return shift.status === "open";
}

/** The open shift on a register, if any (list may hold full history). */
export function openShiftForRegister<T extends ShiftLike>(shifts: T[], registerId: string): T | undefined {
  return shifts.find((s) => s.registerId === registerId && isOpen(s));
}

/** The open shift a cashier is working, if any. */
export function openShiftForCashier<T extends ShiftLike>(shifts: T[], cashierId: string): T | undefined {
  return shifts.find((s) => s.cashierId === cashierId && isOpen(s));
}

/** Guards for opening a shift: register free + cashier free + positive float.
 *  Returns an error key or null (openable). */
export function openGuard(
  shifts: ShiftLike[],
  input: { registerId: string; cashierId: string; openingFloatCents: number },
): "register_busy" | "cashier_busy" | "negative_float" | null {
  if (openShiftForRegister(shifts, input.registerId)) return "register_busy";
  if (openShiftForCashier(shifts, input.cashierId)) return "cashier_busy";
  if (input.openingFloatCents < 0) return "negative_float";
  return null;
}

/** Expected drawer at close = opening float + CASH sales of the shift.
 *  Card/transfer money never touches the drawer. */
export function expectedCents(openingFloatCents: number, cashSalesCents: number): number {
  return openingFloatCents + cashSalesCents;
}

/** Counted-vs-expected difference (counted − expected). */
export function closeDifference(expectedAmountCents: number, countedCents: number): number {
  return countedCents - expectedAmountCents;
}

/** Human label for a shift row: "Cesar Martínez — Caja 1". */
export function shiftLabel(shift: ShiftLike, cashierName: string, registerName: string): string {
  return `${cashierName} — ${registerName}`;
}
