// ---------------------------------------------------------------------------
// /api/categories/[id] — PATCH rename + DELETE (products fall back to
// "Sin categoría" via SetNull; history is untouched).
// ---------------------------------------------------------------------------

import { makeItemRoutes } from "@/lib/server/http";
import { categoriesDelegate } from "@/lib/server/entities";

export const { PATCH, DELETE } = makeItemRoutes(categoriesDelegate);
