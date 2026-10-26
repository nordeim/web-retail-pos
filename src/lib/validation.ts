// ---------------------------------------------------------------------------
// Zod schemas — the ONE validation boundary every API route parses through.
// Rules mirrored by the client forms: length caps, enum membership, integer
// cents ≥ 0, real-calendar dates. Unit-pinned by tests/validation.test.ts.
// ---------------------------------------------------------------------------

import { z } from "zod";

// ---- shared primitives -------------------------------------------------------

export const PAYMENT_METHODS = ["cash", "card", "transfer"] as const;
export const PRODUCT_UNITS = ["Pieza", "Kilogramo", "Litro", "Paquete"] as const;
export const CARD_PROVIDERS = ["none", "terminal", "link"] as const;

/** Non-empty trimmed string with a length cap. */
function text(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label} debe tener ${max} caracteres como máximo`);
}

/** Optional text field ("" allowed). */
function optionalText(max: number) {
  return z.string().trim().max(max).default("");
}

const centsField = (label: string) =>
  z.number({ error: `${label} debe ser un número` }).int(`${label} debe ser un entero (centavos)`).min(0, `${label} no puede ser negativo`);

/** Hex color (#rgb or #rrggbb). */
export const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido (usa #rgb o #rrggbb)");

/** Data-URL image guard: accept only image/* data URLs up to ~1.5 MB. */
export const dataUrlImage = z
  .string()
  .max(2_000_000, "La imagen excede el tamaño máximo (≈1.5 MB)")
  .refine(
    (v) => v === "" || /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v),
    "Formato de imagen no soportado",
  );

// ---- categories ---------------------------------------------------------------

export const categoryCreateSchema = z.object({ name: text(60, "El nombre") });
export const categoryUpdateSchema = z.object({ name: text(60, "El nombre") });
export type CategoryInput = z.infer<typeof categoryCreateSchema>;

// ---- products ------------------------------------------------------------------

const nullableId = z.string().trim().regex(/^c[a-z0-9]{20,}$/i, "Identificador inválido").nullable();

export const productCreateSchema = z.object({
  name: text(120, "El nombre"),
  barcode: text(64, "El código de barras"),
  categoryId: nullableId.optional(),
  priceCents: centsField("El precio de venta"),
  costCents: centsField("El costo").nullable().optional(),
  stock: z.number({ error: "El stock debe ser un número" }).int().min(0, "El stock no puede ser negativo").default(0),
  minStock: z.number({ error: "El stock mínimo debe ser un número" }).int().min(0).default(5),
  taxRate: z.number().int().min(0).max(10000, "La tasa no puede exceder 100%").default(1600),
  unit: z.enum(PRODUCT_UNITS).default("Pieza"),
  imageUrl: dataUrlImage.nullable().optional(),
  active: z.boolean().default(true),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductInput = z.infer<typeof productCreateSchema>;

// ---- cash registers --------------------------------------------------------------

export const registerCreateSchema = z.object({
  name: text(60, "El nombre"),
  location: optionalText(120),
  active: z.boolean().default(true),
});
export const registerUpdateSchema = registerCreateSchema.partial();

// ---- cashiers ---------------------------------------------------------------------

export const cashierCreateSchema = z.object({
  name: text(80, "El nombre"),
  email: z.string().trim().email("Email inválido").max(120).or(z.literal("")).default(""),
  phone: optionalText(40),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "El PIN debe tener entre 4 y 6 dígitos")
    .or(z.literal(""))
    .default(""),
  active: z.boolean().default(true),
});
export const cashierUpdateSchema = cashierCreateSchema.partial();

// ---- shifts -------------------------------------------------------------------------

export const shiftOpenSchema = z.object({
  registerId: z.string().trim().min(1, "Selecciona una caja"),
  cashierId: z.string().trim().min(1, "Selecciona un cajero"),
  openingFloatCents: centsField("El fondo de caja"),
  notes: optionalText(500),
});

export const shiftCloseSchema = z.object({
  closingAmountCents: centsField("El conteo final"),
  notes: optionalText(500),
});

// ---- sales / checkout ------------------------------------------------------------------

export const checkoutLineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().min(1, "La cantidad debe ser ≥ 1").max(999),
});

export const checkoutSchema = z
  .object({
    items: z.array(checkoutLineSchema).min(1, "El ticket está vacío").max(200),
    paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
    customerName: optionalText(80),
  })
  .refine((data) => new Set(data.items.map((i) => i.productId)).size === data.items.length, {
    message: "El ticket tiene líneas duplicadas",
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---- store settings ----------------------------------------------------------------------

export const storeSettingsSchema = z.object({
  storeName: text(80, "El nombre de la tienda"),
  logoUrl: dataUrlImage.nullable().optional(),
  address: optionalText(200),
  phone: optionalText(40),
  email: z.string().trim().email("Email inválido").max(120).or(z.literal("")).default(""),
  taxId: optionalText(40),
  currency: z.enum(["MXN", "USD", "EUR"]).default("MXN"),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  ticketFooter: optionalText(300),
  cardProvider: z.enum(CARD_PROVIDERS).default("none"),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

// ---- auth (kept from the inherited stack; VeloxPOS copy) -----------------------------------

export const registerSchema = z.object({
  fullName: text(80, "El nombre"),
  email: z.string().trim().email("Email inválido").max(120),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña debe tener 72 caracteres como máximo")
    .regex(/[A-Z]/, "Incluye al menos una letra mayúscula")
    .regex(/[a-z]/, "Incluye al menos una letra minúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(120),
  password: z.string().min(1, "La contraseña es obligatoria").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido").max(120),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(10).max(128),
  password: registerSchema.shape.password,
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email("Email inválido").max(120),
  code: z.string().trim().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Email inválido").max(120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual").max(72),
    newPassword: registerSchema.shape.password,
  });

export const changeEmailSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña").max(72),
  email: z.string().trim().email("Email inválido").max(120),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña").max(72),
});

export const preferencesSchema = z.object({
  fullName: text(80, "El nombre"),
});
