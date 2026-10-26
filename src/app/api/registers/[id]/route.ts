// ---------------------------------------------------------------------------
// /api/registers/[id] — PATCH + DELETE. Deleting a register with an open
// shift cascades the shift (schema onDelete: Cascade) — the client refreshes
// the shift state after any register mutation.
// ---------------------------------------------------------------------------

import { makeItemRoutes } from "@/lib/server/http";
import { registersDelegate } from "@/lib/server/entities";

export const { PATCH, DELETE } = makeItemRoutes(registersDelegate);
