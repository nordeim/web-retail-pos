// ---------------------------------------------------------------------------
// PATCH /api/settings/preferences — the account display name. A whitespace-
 // only name is rejected 400 and a padded name is stored TRIMMED. The `name`
// field is the client's alias for the schema's fullName. The hashless
// updated user rides the response so the store's user slice updates in place.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { preferencesSchema } from "@/lib/validation";
import { publicUser } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  readJson,
  toErrorResponse,
  withUser,
} from "@/lib/server/http";

type PrefsBody = { name?: unknown; fullName?: unknown };

export const PATCH = withUser(async (user, request) => {
  try {
    const raw = (await readJson(request)) as PrefsBody;

    const rawName = raw.fullName !== undefined ? raw.fullName : raw.name;
    if (rawName !== undefined) {
      if (typeof rawName !== "string" || rawName.trim().length === 0) {
        return errorResponse(400, "El nombre no puede estar vacío.");
      }
    }

    const schemaInput =
      rawName !== undefined && typeof rawName === "string"
        ? { ...raw, fullName: rawName }
        : raw;
    const prefs = parseWith(preferencesSchema, schemaInput);

    const updated = await db.user.update({
      where: { id: user.id },
      data: { fullName: prefs.fullName },
    });

    return NextResponse.json({ ok: true, user: publicUser(updated) });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});
