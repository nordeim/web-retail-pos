// ---------------------------------------------------------------------------
// The Spanish date formatters — every shape is reference-verified
// (docs/reference-investigation.md §4).
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";

import {
  addDays,
  formatDayMonth,
  formatLongSpanish,
  formatMediumSpanish,
  formatShiftStamp,
  formatSlashShort,
  isSameDay,
  lastNDays,
  startOfDay,
  weekWindow,
  WEEKDAY_MIN,
} from "@/lib/date";

// Fixed reference anchors (local time).
// 2026-04-19 22:09 — the V-MO6BJT7G sale. 2026-10-25 is a Sunday.
function at(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

describe("formatLongSpanish (Dashboard subtitle)", () => {
  it('renders "domingo 25 de octubre, 2026"', () => {
    expect(formatLongSpanish(at(2026, 10, 25))).toBe("domingo 25 de octubre, 2026");
  });

  it("handles other weekdays", () => {
    expect(formatLongSpanish(at(2026, 4, 19, 22, 9))).toBe("domingo 19 de abril, 2026");
    expect(formatLongSpanish(at(2026, 10, 26))).toBe("lunes 26 de octubre, 2026");
  });
});

describe("formatSlashShort (Ventas FECHA cell)", () => {
  it('renders "19/04/26 22:09"', () => {
    expect(formatSlashShort(at(2026, 4, 19, 22, 9))).toBe("19/04/26 22:09");
  });

  it("zero-pads", () => {
    expect(formatSlashShort(at(2026, 3, 14, 1, 45))).toBe("14/03/26 01:45");
  });
});

describe("formatMediumSpanish (ticket detail)", () => {
  it('renders "19 abr 2026, 22:09"', () => {
    expect(formatMediumSpanish(at(2026, 4, 19, 22, 9))).toBe("19 abr 2026, 22:09");
  });
});

describe("formatShiftStamp (Cajeros shift table)", () => {
  it('renders "09/04 01:39"', () => {
    expect(formatShiftStamp(at(2026, 4, 9, 1, 39))).toBe("09/04 01:39");
  });
});

describe("formatDayMonth (chart ticks)", () => {
  it('renders "26 sep"', () => {
    expect(formatDayMonth(at(2026, 9, 26))).toBe("26 sep");
  });
});

describe("week window helpers", () => {
  it("exposes the Monday-first weekday labels", () => {
    expect(WEEKDAY_MIN).toEqual(["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]);
  });

  it("lastNDays returns n local midnights, oldest first", () => {
    const days = lastNDays(7, at(2026, 10, 25, 15, 0));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(at(2026, 10, 19));
    expect(days[6]).toEqual(at(2026, 10, 25));
    for (const day of days) expect(day.getHours()).toBe(0);
  });

  it("addDays crosses month boundaries", () => {
    expect(addDays(at(2026, 10, 25), -7)).toEqual(at(2026, 10, 18));
    expect(addDays(at(2026, 3, 1), -1)).toEqual(at(2026, 2, 28));
  });

  it("startOfDay zeros the clock; isSameDay compares local calendars", () => {
    const morning = at(2026, 10, 25, 6, 30);
    expect(startOfDay(morning)).toEqual(at(2026, 10, 25));
    expect(isSameDay(morning, at(2026, 10, 25, 23, 59))).toBe(true);
    expect(isSameDay(morning, at(2026, 10, 26, 0, 1))).toBe(false);
  });

  // V2 remediation (M2/V4): the dashboard's rolling 7-day window labels
  // every bucket by its OWN date — the live reference ends the series at
  // today's weekday. The historical bug labeled positionally (lun..dom) and
  // was wrong 6 days out of 7.
  it("weekWindow labels each day by its own weekday, today last", () => {
    const window = weekWindow(at(2026, 10, 28, 18, 0)); // a Wednesday
    expect(window).toHaveLength(7);
    expect(window.map((d) => d.label)).toEqual([
      "jue", "vie", "sáb", "dom", "lun", "mar", "mié",
    ]);
    expect(window[6].date).toEqual(at(2026, 10, 28));
    expect(window[0].date).toEqual(at(2026, 10, 22));
  });

  it("weekWindow starting on a Monday reads lun..dom in order", () => {
    // Oct 19, 2026 is a Monday — the only start weekday where the old
    // positional labels happened to be right.
    expect(weekWindow(at(2026, 10, 25)).map((d) => d.label)).toEqual([
      "lun", "mar", "mié", "jue", "vie", "sáb", "dom",
    ]);
  });
});
