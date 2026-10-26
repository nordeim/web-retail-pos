// ---------------------------------------------------------------------------
// The entity delegates (ADR-006, VeloxPOS edition): one configuration object
// per master-data model, consumed by the makeCollectionRoutes/makeItemRoutes
// factories. Every query is scoped where:{userId} — ownership by
// construction; updates/removes verify ownership BEFORE mutating. Every
// payload passes its Zod schema first. The transactional surfaces (shift
// open/close, checkout) live in src/lib/server/pos.ts — they are NOT CRUD.
// ---------------------------------------------------------------------------

import type { ZodType } from "zod";

import { db } from "../db";
import {
  cashierCreateSchema,
  cashierUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  registerCreateSchema,
  registerUpdateSchema,
} from "../validation";
import { NotFoundError, parseWith, type EntityDelegate } from "./http";

// ---- the minimal structural Prisma model --------------------------------------

type Row = Record<string, unknown>;

/**
 * The structural slice the factory needs. The Prisma delegates are cast
 * INTO this shape at the config sites below (one `as OwnedModel` per
 * model): Prisma's generic update/create signatures don't structurally
 * accept `data: unknown` under strictFunctionTypes, but the factory only
 * ever passes schema-parsed rows. The cast is the documented seam boundary.
 */
type OwnedModel = {
  findMany(args: {
    where: { userId: string };
    orderBy?: { createdAt: "asc" | "desc" } | { name: "asc" };
  }): Promise<unknown[]>;
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown>;
  create(args: { data: unknown }): Promise<unknown>;
  update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};

// ---- the sent-keys PATCH filter (S81/S82 lesson, kept verbatim) -----------------

/**
 * zod@4's `.partial()` does NOT suppress create-time `.default()` — a parsed
 * partial materializes every defaulted field, so writing it verbatim would
 * reset untouched columns on every PATCH. Keep only the keys the caller
 * actually sent, INTERSECTED with the keys the schema actually parsed.
 */
export const sentKeysPatch = (input: unknown, parsed: Row): Row => {
  const source = (input ?? {}) as Row;
  const writes: Row = {};
  for (const key of Object.keys(source)) {
    if (source[key] === undefined) continue;
    if (!(key in parsed)) continue;
    writes[key] = parsed[key];
  }
  return writes;
};

// ---- the owned-delegate factory ---------------------------------------------------

type OwnedConfig = {
  model: OwnedModel;
  createSchema: ZodType<Row>;
  updateSchema: ZodType<Row>;
  orderBy?: "asc" | "desc";
  listArgs?: { orderBy: { name: "asc" } | { createdAt: "asc" | "desc" } };
};

function makeOwnedDelegate(config: OwnedConfig): EntityDelegate {
  const { model, createSchema, updateSchema } = config;
  const listArgs = config.listArgs ?? { orderBy: { createdAt: "asc" as const } };

  return {
    list: (userId) => model.findMany({ where: { userId }, ...listArgs }),

    create: async (userId, input) => {
      const parsed = parseWith(createSchema, input);
      return model.create({ data: { ...(parsed as Row), userId } });
    },

    update: async (userId, id, input) => {
      const existing = await model.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundError();
      const parsed = parseWith(updateSchema, input);
      const writes = sentKeysPatch(input, parsed);
      if (Object.keys(writes).length === 0) return existing;
      return model.update({ where: { id }, data: writes });
    },

    remove: async (userId, id) => {
      const existing = await model.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundError();
      await model.delete({ where: { id } });
      return { ok: true };
    },
  };
}

// ---- the VeloxPOS delegates --------------------------------------------------------

export const categoriesDelegate = makeOwnedDelegate({
  model: db.category as unknown as OwnedModel,
  createSchema: categoryCreateSchema,
  updateSchema: categoryUpdateSchema,
  listArgs: { orderBy: { name: "asc" } },
});

export const productsDelegate = makeOwnedDelegate({
  model: db.product as unknown as OwnedModel,
  createSchema: productCreateSchema,
  updateSchema: productUpdateSchema,
  listArgs: { orderBy: { createdAt: "desc" } },
});

export const registersDelegate = makeOwnedDelegate({
  model: db.cashRegister as unknown as OwnedModel,
  createSchema: registerCreateSchema,
  updateSchema: registerUpdateSchema,
  listArgs: { orderBy: { name: "asc" } },
});

export const cashiersDelegate = makeOwnedDelegate({
  model: db.cashier as unknown as OwnedModel,
  createSchema: cashierCreateSchema,
  updateSchema: cashierUpdateSchema,
  listArgs: { orderBy: { createdAt: "asc" } },
});

/** Guard helper: assert a user-owned row exists or 404 (pre-check pattern). */
export async function requireOwned(
  model: { findFirst(args: { where: Record<string, unknown> }): Promise<unknown> },
  userId: string,
  id: string,
  message = "That record does not exist.",
): Promise<Row> {
  const row = (await model.findFirst({ where: { id, userId } })) as Row | null;
  if (!row) throw new NotFoundError(message);
  return row;
}

export { parseWith };
