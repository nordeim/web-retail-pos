// ---------------------------------------------------------------------------
// /api/registers — the cajas (cash registers).
// ---------------------------------------------------------------------------

import { makeCollectionRoutes } from "@/lib/server/http";
import { registersDelegate } from "@/lib/server/entities";

export const { GET, POST } = makeCollectionRoutes(registersDelegate);
