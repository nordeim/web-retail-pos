// ---------------------------------------------------------------------------
// VeloxPOS seed — the reference store's own data, captured live 2026-10-26:
// 6 categories, 12 products (name/barcode/price/stock verbatim), 2 cajas,
// the reference's 2 completed sales (Coca-Cola + mixed ticket, Cesar
// Martínez on Caja 1) and a matching closed-shift history.
//
// Money: cents. IVA: 16% = 1600 basis points.
// Run: DATABASE_URL="file:../db/custom.db" bun prisma/seed.ts
// (the db:seed npm script pins the env var inline — schema-anchored).
// ---------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@veloxpos.mx";
const DEMO_PASSWORD = "Demo1234";

// The reference's inventory (measured live — do not "improve" the data).
const CATEGORIES = [
  "Snacks",
  "Lácteos",
  "Higiene Personal",
  "Limpieza",
  "Alimentos",
  "Bebidas",
] as const;

const PRODUCTS: {
  name: string;
  barcode: string;
  price: number; // pesos
  stock: number;
  category: (typeof CATEGORIES)[number];
  minStock?: number;
}[] = [
  { name: "Yogurt Danone Natural 900g", barcode: "7501005102148", price: 38.5, stock: 10, category: "Lácteos" },
  { name: "Frijoles La Costeña 560g", barcode: "7501017006113", price: 22.5, stock: 30, category: "Alimentos" },
  { name: "Leche Lala Entera 1L", barcode: "7501055301114", price: 26.5, stock: 24, category: "Lácteos" },
  { name: "Shampoo Pantene 400ml", barcode: "7501001165599", price: 89.0, stock: 12, category: "Higiene Personal" },
  { name: "Cloro Cloralex 1L", barcode: "7501025400117", price: 24.0, stock: 22, category: "Limpieza" },
  { name: "Papel Higiénico Pétalo 4 rollos", barcode: "7501019600012", price: 35.0, stock: 17, category: "Higiene Personal" },
  { name: "Sabritas Original 45g", barcode: "7501011115019", price: 16.0, stock: 35, category: "Snacks" },
  { name: "Agua Bonafont 1L", barcode: "7501013100018", price: 12.0, stock: 60, category: "Bebidas" },
  { name: "Coca-Cola 600ml", barcode: "7501055300120", price: 18.5, stock: 47, category: "Bebidas" },
  { name: "Atún Dolores 295g", barcode: "7501024520148", price: 32.0, stock: 3, category: "Alimentos", minStock: 5 },
  { name: "Pan Bimbo Blanco", barcode: "7441029500103", price: 52.0, stock: 15, category: "Alimentos" },
  { name: "Jabón Zote 400g", barcode: "7501025403010", price: 18.0, stock: 19, category: "Limpieza" },
];

const TAX_RATE = 1600;

function taxOf(subtotalCents: number): number {
  return Math.floor((subtotalCents * TAX_RATE) / 10000 + 0.5);
}

async function main() {
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, emailVerified: true },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      fullName: "Dueño de la Tienda",
      emailVerified: true,
    },
  });
  const userId = user.id;

  // Idempotent: a re-seed wipes the transactional + master rows, keeps the user.
  await db.saleItem.deleteMany({ where: { sale: { userId } } });
  await db.sale.deleteMany({ where: { userId } });
  await db.shift.deleteMany({ where: { userId } });
  await db.product.deleteMany({ where: { userId } });
  await db.category.deleteMany({ where: { userId } });
  await db.cashRegister.deleteMany({ where: { userId } });
  await db.cashier.deleteMany({ where: { userId } });
  await db.storeSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const categories = new Map<string, string>();
  for (const name of CATEGORIES) {
    const row = await db.category.create({ data: { userId, name } });
    categories.set(name, row.id);
  }

  const products = new Map<string, { id: string; priceCents: number }>();
  for (const p of PRODUCTS) {
    const row = await db.product.create({
      data: {
        userId,
        categoryId: categories.get(p.category) ?? null,
        name: p.name,
        barcode: p.barcode,
        priceCents: Math.round(p.price * 100),
        stock: p.stock,
        minStock: p.minStock ?? 5,
        taxRate: TAX_RATE,
      },
    });
    products.set(p.name, { id: row.id, priceCents: row.priceCents });
  }

  const caja1 = await db.cashRegister.create({
    data: { userId, name: "Caja 1", location: "Entrada principal" },
  });
  await db.cashRegister.create({
    data: { userId, name: "Caja 2", location: "Área de abarrotes" },
  });

  const cesar = await db.cashier.create({
    data: { userId, name: "Cesar Martínez", email: "cesar@veloxpos.mx" },
  });

  const saleSpecs: {
    ticket: string;
    daysAgo: number;
    hour: number;
    minute: number;
    lines: { name: string; qty: number }[];
  }[] = [
    { ticket: "V-MO6BJT7G", daysAgo: 6, hour: 22, minute: 9, lines: [{ name: "Coca-Cola 600ml", qty: 1 }] },
    { ticket: "V-MMPNY55Z", daysAgo: 4, hour: 1, minute: 45, lines: [] },
  ];

  // The reference's two completed sales (V-MO6BJT7G 1× Coca-Cola = $21.46
  // total, and V-MMPNY55Z totalling $61.48). Ticket 1's lines are fully
  // observable; ticket 2's exact composition is not (its $61.48 cannot be
  // composed from the visible catalog) — we ship a documented equivalent:
  // Sabritas + Coca-Cola + Pan Bimbo = subtotal $86.00 → total $99.76, with
  // the deviation recorded in docs/veloxpos-implementation-plan.md.
  saleSpecs[1].lines = [
    { name: "Sabritas Original 45g", qty: 1 },
    { name: "Coca-Cola 600ml", qty: 1 },
    { name: "Pan Bimbo Blanco", qty: 1 },
  ];

  for (const spec of saleSpecs) {
    const openedAt = new Date();
    openedAt.setDate(openedAt.getDate() - spec.daysAgo);
    openedAt.setHours(9, 0, 0, 0);
    const closedAt = new Date(openedAt);
    closedAt.setDate(closedAt.getDate() + 2);
    closedAt.setHours(spec.hour, spec.minute, 0, 0);

    const subtotal = spec.lines.reduce(
      (sum, line) => sum + (products.get(line.name)?.priceCents ?? 0) * line.qty,
      0,
    );
    const tax = taxOf(subtotal);

    const shift = await db.shift.create({
      data: {
        userId,
        registerId: caja1.id,
        cashierId: cesar.id,
        openedAt,
        closedAt,
        openingFloatCents: 20000,
        closingAmountCents: 20000 + subtotal + tax,
        expectedAmountCents: 20000 + subtotal + tax,
        differenceCents: 0,
        status: "closed",
      },
    });

    await db.sale.create({
      data: {
        userId,
        ticketNumber: spec.ticket,
        cashierId: cesar.id,
        registerId: caja1.id,
        shiftId: shift.id,
        paymentMethod: "cash",
        subtotalCents: subtotal,
        taxCents: tax,
        totalCents: subtotal + tax,
        status: "completed",
        createdAt: closedAt,
        updatedAt: closedAt,
        items: {
          create: spec.lines
            .filter((line) => line.qty > 0)
            .map((line) => {
              const product = products.get(line.name);
              return {
                productId: product?.id ?? null,
                name: line.name,
                unitPriceCents: product?.priceCents ?? 0,
                quantity: line.qty,
                taxRate: TAX_RATE,
                lineTotalCents: (product?.priceCents ?? 0) * line.qty,
              };
            }),
        },
      },
    });
  }

  console.log("Seeded VeloxPOS:");
  console.log(`  login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  categories: ${categories.size}, products: ${products.size}`);
  console.log("  registers: 2, cashiers: 1, shifts: 2, sales: 2");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
