// ---------------------------------------------------------------------------
// Store settings — the 1:1 StoreSettings row. GET upserts the defaults (the
// settings view must always render), PATCH validates through the Zod schema
// and applies the sent-keys discipline. The store's two colors are also
// echoed onto the authed shell (see page.tsx) so the gradient chrome follows
// Ajustes without a reload.
// ---------------------------------------------------------------------------

import { db } from "../db";
import { storeSettingsSchema } from "../validation";
import { parseWith } from "./http";

export async function getOrCreateSettings(userId: string) {
  const existing = await db.storeSettings.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.storeSettings.create({ data: { userId } });
}

export async function updateSettings(userId: string, input: unknown) {
  await getOrCreateSettings(userId);
  const parsed = parseWith(storeSettingsSchema, input);
  const source = (input ?? {}) as Record<string, unknown>;
  const writes: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (source[key] === undefined) continue;
    if (!(key in parsed)) continue;
    writes[key] = parsed[key];
  }
  // Logo/color emptiness semantics: an explicitly empty logoUrl clears it.
  return db.storeSettings.update({ where: { userId }, data: writes });
}
