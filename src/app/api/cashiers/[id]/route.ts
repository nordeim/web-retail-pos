// ---------------------------------------------------------------------------
// /api/cashiers/[id] — PATCH + DELETE (SetNull on their sales/shifts keeps
// the history rows).
// ---------------------------------------------------------------------------

import { makeItemRoutes } from "@/lib/server/http";
import { cashiersDelegate } from "@/lib/server/entities";

export const { PATCH, DELETE } = makeItemRoutes(cashiersDelegate);
