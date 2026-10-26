// ---------------------------------------------------------------------------
// The single view ↔ path map — the reference's own PascalCase routes
// (measured live 2026-10-26): Terminal→/POS, Dashboard→/Dashboard,
// Inventario→/Inventory, Ventas→/Sales, Cajas→/Registers, Cajeros→/Cashiers,
// Reportes→/Reports, Ajustes→/StoreSettings. Rewritten onto / by
// next.config.ts; the SPA store syncs view state with the pathname.
// Pure — unit-pinned by tests/router.test.ts.
// ---------------------------------------------------------------------------

export type ViewId =
  | "terminal"
  | "dashboard"
  | "inventory"
  | "sales"
  | "registers"
  | "cashiers"
  | "reports"
  | "settings";

export const VIEWS: ViewId[] = [
  "terminal",
  "dashboard",
  "inventory",
  "sales",
  "registers",
  "cashiers",
  "reports",
  "settings",
];

export type NavItem = { id: ViewId; label: string; path: string };

/** All 8 reference views in sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { id: "terminal", label: "Terminal", path: "/POS" },
  { id: "dashboard", label: "Dashboard", path: "/Dashboard" },
  { id: "inventory", label: "Inventario", path: "/Inventory" },
  { id: "sales", label: "Ventas", path: "/Sales" },
  { id: "registers", label: "Cajas", path: "/Registers" },
  { id: "cashiers", label: "Cajeros", path: "/Cashiers" },
  { id: "reports", label: "Reportes", path: "/Reports" },
  { id: "settings", label: "Ajustes", path: "/StoreSettings" },
];

/** Canonical path for a view (unknown ids fall back to /POS). */
export function pathForView(view: ViewId): string {
  return NAV_ITEMS.find((item) => item.id === view)?.path ?? "/POS";
}

/** Map a pathname to its view id — first segment wins, case-insensitive,
 *  trailing slashes tolerated; root/unknown → terminal. */
export function viewFromPath(pathname: string): ViewId {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return "terminal";
  const hit = NAV_ITEMS.find((item) => item.path.toLowerCase() === `/${segment}`);
  return hit?.id ?? "terminal";
}
