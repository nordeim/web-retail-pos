import { describe, expect, it } from "vitest";

import {
  formatDateTimeShort,
  formatLongDate,
  formatMoney,
  formatNumber,
  formatTicketDate,
  lineTaxCents,
  parseMoneyToCents,
  roundHalfUp,
} from "@/lib/money";

describe("formatMoney", () => {
  it("formats the reference's $0.00 / $38.50 shapes", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(3850)).toBe("$38.50");
    expect(formatMoney(2146)).toBe("$21.46");
    expect(formatMoney(5)).toBe("$0.05");
  });

  it("rounds fractional cents and survives NaN", () => {
    expect(formatMoney(1.4)).toBe("$0.01");
    expect(formatMoney(Number.NaN)).toBe("$0.00");
  });
});

describe("roundHalfUp", () => {
  it("rounds .5 away from zero", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(2.4)).toBe(2);
  });
});

describe("parseMoneyToCents", () => {
  it("accepts user-typed amounts", () => {
    expect(parseMoneyToCents("38.5")).toBe(3850);
    expect(parseMoneyToCents("$38.50")).toBe(3850);
    expect(parseMoneyToCents("1,234.00")).toBe(123400);
    expect(parseMoneyToCents("0")).toBe(0);
  });

  it("rejects garbage and negatives", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("-5")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("1.234")).toBeNull();
  });
});

describe("lineTaxCents (IVA 16% = 1600 bp)", () => {
  it("reproduces the reference's worked ticket", () => {
    // 1 × Coca-Cola $18.50 @16% → $2.96 IVA, total $21.46 (measured live).
    const tax = lineTaxCents(1850, 1, 1600);
    expect(tax).toBe(296);
    expect(1850 + tax).toBe(2146);
  });

  it("half-ups a ragged edge", () => {
    // 22.50 × 1 × 16% = 3.6 → 360; 12.35 × 1 × 16% = 1.976 → 198.
    expect(lineTaxCents(2250, 1, 1600)).toBe(360);
    expect(lineTaxCents(1235, 1, 1600)).toBe(198);
  });
});

describe("date formats (es-MX, reference-measured shapes)", () => {
  const date = new Date(2026, 3, 19, 22, 9); // 19 abr 2026, 22:09

  it("sale rows read 19/04/26 22:09", () => {
    expect(formatDateTimeShort(date)).toBe("19/04/26 22:09");
  });

  it("ticket detail reads 19 abr 2026, 22:09", () => {
    expect(formatTicketDate(date)).toBe("19 abr 2026, 22:09");
  });

  it("dashboard header reads lunes 26 de octubre, 2026", () => {
    expect(formatLongDate(new Date(2026, 9, 26))).toBe("lunes 26 de octubre, 2026");
  });
});

describe("formatNumber (es-MX)", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(0)).toBe("0");
  });
});
