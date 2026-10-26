import { describe, expect, it } from "vitest";

import {
  closeDifference,
  expectedCents,
  openGuard,
  openShiftForCashier,
  openShiftForRegister,
  type ShiftLike,
} from "@/lib/shifts";

function shift(overrides: Partial<ShiftLike> = {}): ShiftLike {
  return {
    id: "s1",
    registerId: "r1",
    cashierId: "c1",
    status: "open",
    openingFloatCents: 20000,
    openedAt: new Date(),
    ...overrides,
  };
}

describe("openShiftForRegister / openShiftForCashier", () => {
  it("finds the open shift and ignores closed history", () => {
    const shifts = [
      shift({ id: "closed", status: "closed" }),
      shift({ id: "open", registerId: "r2", cashierId: "c2" }),
    ];
    expect(openShiftForRegister(shifts, "r2")?.id).toBe("open");
    expect(openShiftForRegister(shifts, "r1")).toBeUndefined();
    expect(openShiftForCashier(shifts, "c2")?.id).toBe("open");
    expect(openShiftForCashier(shifts, "c1")).toBeUndefined();
  });
});

describe("openGuard", () => {
  it("blocks a busy register", () => {
    expect(openGuard([shift()], { registerId: "r1", cashierId: "c9", openingFloatCents: 0 })).toBe(
      "register_busy",
    );
  });

  it("blocks a busy cashier", () => {
    expect(openGuard([shift()], { registerId: "r9", cashierId: "c1", openingFloatCents: 0 })).toBe(
      "cashier_busy",
    );
  });

  it("blocks a negative float and allows a clean open", () => {
    expect(openGuard([], { registerId: "r9", cashierId: "c9", openingFloatCents: -1 })).toBe(
      "negative_float",
    );
    expect(openGuard([], { registerId: "r9", cashierId: "c9", openingFloatCents: 0 })).toBeNull();
  });
});

describe("close math", () => {
  it("expected = float + cash sales; difference = counted − expected", () => {
    expect(expectedCents(20000, 4146)).toBe(24146);
    expect(closeDifference(24146, 24000)).toBe(-146);
    expect(closeDifference(24146, 24146)).toBe(0);
  });
});
