// ---------------------------------------------------------------------------
// /api/cashiers — the cajeros.
// ---------------------------------------------------------------------------

import { makeCollectionRoutes } from "@/lib/server/http";
import { cashiersDelegate } from "@/lib/server/entities";

export const { GET, POST } = makeCollectionRoutes(cashiersDelegate);
