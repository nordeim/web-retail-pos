// ---------------------------------------------------------------------------
// /api/products/[id] — PATCH update + DELETE remove (ownership-scoped).
// ---------------------------------------------------------------------------

import { makeItemRoutes } from "@/lib/server/http";
import { productsDelegate } from "@/lib/server/entities";

export const { PATCH, DELETE } = makeItemRoutes(productsDelegate);
