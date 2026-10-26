// ---------------------------------------------------------------------------
// /api/categories — product categories (unique per user by name).
// ---------------------------------------------------------------------------

import { makeCollectionRoutes } from "@/lib/server/http";
import { categoriesDelegate } from "@/lib/server/entities";

export const { GET, POST } = makeCollectionRoutes(categoriesDelegate);
