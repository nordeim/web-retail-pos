// ---------------------------------------------------------------------------
// /api/products — the inventory collection. GET lists (newest first, the
// reference's Inventario order); POST creates. P2002 on the per-user
// barcode unique → 409 via the shared error mapper.
// ---------------------------------------------------------------------------

import { makeCollectionRoutes } from "@/lib/server/http";
import { productsDelegate } from "@/lib/server/entities";

export const { GET, POST } = makeCollectionRoutes(productsDelegate);
