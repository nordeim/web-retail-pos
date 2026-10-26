// ---------------------------------------------------------------------------
// The money seam — the ONLY place cents become strings and strings become
// cents. Every monetary amount at rest is an integer number of cents; the
// reference's es-MX currency format ("$38.50") is produced here.
// Pinned by tests/money.test.ts.
// ---------------------------------------------------------------------------

/** Reference-measured money format: "$" + 2-decimal fixed, e.g. "$0.00". */
export function formatMoney(cents: number): string {
  if (!Number.isFinite(cents)) return "$0.00";
  return `$${(Math.round(cents) / 100).toFixed(2)}`;
}

/** es-MX thousands formatting for bare magnitudes ("1,234"). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

/** Half-up rounding to the nearest cent — the IVA line rule the reference's
 *  own ticket exhibits (1 × $18.50 @ 16% → $2.96 exact; 0.5-cent edges round
 *  away from zero so sellers never eat the fraction). */
export function roundHalfUp(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

/** Parse a user-typed money string ("38.5", "$38.50", "1,234.00") to cents.
 *  Returns null for anything that is not a finite non-negative amount. */
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.replace(/[$\s,]/g, "");
  if (cleaned === "" || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return roundHalfUp(value * 100);
}

/** Tax for one line: half-up cents of (unitPrice × qty × rate/10000).
 *  rate is integer basis points of a percent (16% → 1600). */
export function lineTaxCents(unitPriceCents: number, quantity: number, taxRate: number): number {
  return roundHalfUp((unitPriceCents * quantity * taxRate) / 10000);
}

/** Reference es-MX date-time for sale rows: "19/04/26 22:09". */
export function formatDateTimeShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

/** Reference es-MX long date for the dashboard header:
 *  "lunes 26 de octubre, 2026". */
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Sale-detail date: "19 abr 2026, 22:09". */
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatTicketDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mi}`;
}
