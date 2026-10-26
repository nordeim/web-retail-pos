// ---------------------------------------------------------------------------
// Spanish (es-MX) date formatting + local-time day math. Pure — unit-pinned
// by tests/date.test.ts.
//
// Reference-verified shapes (docs/reference-investigation.md):
//   Dashboard subtitle   "domingo 25 de octubre, 2026"
//   Ventas FECHA cell    "19/04/26 22:09"
//   Ventas detail        "19 abr 2026, 22:09"
//   Cajeros INICIO/FIN   "09/04 01:39"
//   Reportes axis ticks  "26 sep", "30 sep"
// ---------------------------------------------------------------------------

const DAYS_LONG = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** "domingo 25 de octubre, 2026" — the Dashboard subtitle. */
export function formatLongSpanish(date: Date): string {
  const day = DAYS_LONG[date.getDay()];
  const month = MONTHS_LONG[date.getMonth()];
  return `${day} ${date.getDate()} de ${month}, ${date.getFullYear()}`;
}

/** "19/04/26 22:09" — zero-padded, 24h. */
export function formatSlashShort(date: Date): string {
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yy = String(date.getFullYear() % 100).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "19 abr 2026, 22:09" — the ticket-detail date. */
export function formatMediumSpanish(date: Date): string {
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** "09/04 01:39" — the shift-table timestamps (no year). */
export function formatShiftStamp(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** "26 sep" — chart axis ticks. */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "lun" … "dom" — the 7-day chart's X axis (Monday-first). */
export const WEEKDAY_MIN: readonly string[] = [
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
  "dom",
];

/** ISO weekday (Monday = 0 … Sunday = 6) → WEEKDAY_MIN index. */
export function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * The dashboard's rolling 7-day window, oldest-first: 7 local midnights
 * ending TODAY, each labeled by its OWN weekday (V2 M2 — the historical
 * positional `WEEKDAY_MIN[index]` was wrong whenever the window did not
 * start on a Monday; the live reference rolls the labels with the dates
 * and ends the series at today).
 */
export function weekWindow(now: Date): { date: Date; label: string }[] {
  const out: { date: Date; label: string }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDays(now, -i);
    out.push({ date, label: WEEKDAY_MIN[isoWeekday(date)] });
  }
  return out;
}

/** Zero the clock (local midnight). */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add n days (local-safe: via midnight arithmetic). */
export function addDays(date: Date, n: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** The n-day window for the Reports page, oldest-first (local midnights). */
export function lastNDays(n: number, now: Date = new Date()): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(addDays(now, -i));
  return out;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Same local calendar day? */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
