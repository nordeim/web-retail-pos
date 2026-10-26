// ---------------------------------------------------------------------------
// Every API payload contract for the POS domain. Zod v4 in strip mode
// (unknown keys dropped — the repo-wide convention). Unit-pinned by
// tests/validation.test.ts.
// ---------------------------------------------------------------------------

import { z } from "zod";

// ---- shared atoms ----------------------------------------------------------

const idField = z.string().min(1);
/** Dialogs send "" for cleared relations — accept it and map to null. */
const nullableId = z
  .union([idField, z.literal("")])
  .nullish()
  .transform((v) => (v === "" ? null : (v ?? null)));
const passwordField = z.string().min(8).max(200);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
/** Money at the boundary arrives as a decimal STRING from the inputs. */
const moneyCents = z
  .union([z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "number") return Math.round(v * 100);
    const cleaned = v.replace(/[$,\s]/g, "");
    if (cleaned === "" || !/^\d*(\.\d*)?$/.test(cleaned)) return NaN;
    return Math.round(Number(cleaned) * 100);
  })
  .refine((v) => Number.isFinite(v) && v >= 0, {
    message: "Enter a valid amount.",
  });
const intField = z.coerce.number().int();
const nonNegativeInt = intField.refine((v) => v >= 0, {
  message: "Must be zero or greater.",
});
const percentInt = intField.refine((v) => v >= 0 && v <= 100, {
  message: "Must be between 0 and 100.",
});

// ---- auth (kept from the scaffold) ------------------------------------------

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordField,
});

export const registerSchema = z.object({
  fullName: z.string().max(100).optional().default(""),
  email: z.string().email(),
  password: passwordField,
});

export const requestResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordField,
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export const changeEmailSchema = z.object({
  password: passwordField,
  newEmail: z.string().email(),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordField,
  newPassword: passwordField,
});

export const deleteAccountSchema = z.object({
  password: passwordField,
});

// ---- store settings ----------------------------------------------------------

export const CARD_PROVIDERS = [
  "Ninguno",
  "Clip",
  "Banorte",
  "Mercado Pago",
  "Terminal Bancaria",
] as const;

export const CURRENCIES = [
  "MXN - Peso Mexicano",
  "USD - Dólar Americano",
  "EUR - Euro",
] as const;

export const settingsSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(300).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  email: z.string().max(120).optional().default(""),
  fiscalId: z.string().max(40).optional().default(""),
  currency: z.enum(CURRENCIES).optional().default("MXN - Peso Mexicano"),
  primaryColor: hexColor.optional().default("#6366f1"),
  secondaryColor: hexColor.optional().default("#8b5cf6"),
  ticketFooter: z.string().max(300).optional().default(""),
  cardProvider: z.enum(CARD_PROVIDERS).optional().default("Ninguno"),
});

// ---- categories ---------------------------------------------------------------

export const categorySchema = z.object({
  name: z.string().min(1).max(60),
});

// ---- products -------------------------------------------------------------------

export const UNITS = ["Pieza", "Kilogramo", "Litro", "Paquete", "Servicio"] as const;

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  barcode: z.string().max(64).optional().default(""),
  categoryId: nullableId,
  price: moneyCents,
  cost: moneyCents.optional().default(0),
  stock: nonNegativeInt.optional().default(0),
  minStock: nonNegativeInt.optional().default(5),
  ivaRate: percentInt.optional().default(16),
  unit: z.enum(UNITS).optional().default("Pieza"),
  imageUrl: z.string().max(500).optional(),
  active: z.boolean().optional().default(true),
});

/** PATCH: the dialogs send only the changed keys; the factory filters sent keys. */
export const productUpdateSchema = productCreateSchema.partial();

// ---- registers (Cajas) ------------------------------------------------------------

export const registerCreateSchema = z.object({
  name: z.string().min(1).max(80),
  location: z.string().max(120).optional().default(""),
});

export const registerUpdateSchema = registerCreateSchema.partial();

// ---- cashiers (Cajeros) -------------------------------------------------------------

export const cashierCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().max(120).optional().default(""),
  active: z.boolean().optional().default(true),
});

export const cashierUpdateSchema = cashierCreateSchema.partial();

// ---- shifts (Turnos) ------------------------------------------------------------------

export const shiftOpenSchema = z.object({
  registerId: idField,
  cashierId: idField,
  openingFloat: moneyCents.optional().default(0),
});

export const shiftCloseSchema = z.object({
  closingAmount: moneyCents.optional().default(0),
});

// ---- sales ------------------------------------------------------------------------------

export const saleItemInput = z.object({
  productId: idField,
  qty: intField.refine((v) => v >= 1, { message: "Quantity must be at least 1." }),
});

export const saleCreateSchema = z.object({
  registerId: idField,
  items: z.array(saleItemInput).min(1, { message: "The ticket is empty." }),
  method: z.enum(["efectivo", "tarjeta"]).default("efectivo"),
  clientName: z.string().max(120).optional().default(""),
  // cashReceived sufficiency is a DOMAIN rule (total-dependent), enforced
  // server-side in the sale route (V2 L2 — the historical refine was a
  // tautology and the value was dropped on the floor).
  cashReceived: moneyCents.optional(),
});

// ---- read helpers ------------------------------------------------------------------------

/** Parse ?days= for the reports endpoint (7 | 14 | 30 | 90, default 30). */
export function reportDays(value: string | null): 7 | 14 | 30 | 90 {
  const n = Number(value);
  if (n === 7 || n === 14 || n === 90) return n;
  return 30;
}
