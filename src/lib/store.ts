"use client";

// ---------------------------------------------------------------------------
// The app + POS data Zustand stores. No React Context anywhere — views
// subscribe with selectors; the stores are the only mutation path.
//
// useAppStore — SPA view state + chrome (sidebar collapse, mobile drawer).
// usePosStore — the retail collections + the ticket being built at the
//               Terminal. Mutations go through the API seam and settle back
//               into this store; views never fetch bare-handed.
// ---------------------------------------------------------------------------

import { create } from "zustand";

import { apiGet, apiSend, ApiError } from "./api";
import { pathForView, viewFromPath, type ViewId } from "./router";
import { lineTotalCents, ticketTotals } from "./money";
import type { TicketLineInput } from "./pos-types";

const SIDEBAR_COLLAPSED_KEY = "vx-sidebar-collapsed";

// ---- the authenticated user's /api/auth/me shape ----------------------------

export type AppUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ---- useAppStore ------------------------------------------------------------

type AppStore = {
  view: ViewId;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  /** SPA navigation: pushes the canonical path + flips the view. */
  navigate: (view: ViewId) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenu: (open: boolean) => void;
  /** Mount-time sync: read the URL + the persisted collapse preference. */
  hydrate: () => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  view: "terminal",
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  navigate: (view) => {
    const current = get().view;
    set({ view, mobileMenuOpen: false });
    if (view !== current && typeof window !== "undefined") {
      window.history.pushState(null, "", pathForView(view));
    }
  },
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    }
  },
  toggleSidebar: () => get().setSidebarCollapsed(!get().sidebarCollapsed),
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),
  hydrate: () => {
    if (typeof window === "undefined") return;
    set({ view: viewFromPath(window.location.pathname) });
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) set({ sidebarCollapsed: stored === "1" });
  },
}));

// ---- the POS entity shapes (the API's JSON boundary) -------------------------

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  barcode: string;
  categoryId: string | null;
  categoryName: string | null;
  price: number; // cents, IVA-exclusive
  cost: number;
  stock: number;
  minStock: number;
  ivaRate: number;
  unit: string;
  imageUrl: string | null;
  active: boolean;
};

export type Register = {
  id: string;
  name: string;
  location: string;
  status: "closed" | "open";
};

export type Cashier = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

export type Shift = {
  id: string;
  registerId: string;
  registerName: string;
  cashierId: string;
  cashierName: string;
  openingFloat: number;
  closingAmount: number | null;
  openedAt: string;
  closedAt: string | null;
  status: "open" | "closed";
  salesTotal: number; // cents, IVA-inclusive
  salesCount: number;
};

export type SaleItem = {
  id: string;
  productId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  ivaRate: number;
  lineTotal: number;
};

export type Sale = {
  id: string;
  ticketNo: string;
  method: "efectivo" | "tarjeta";
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  clientName: string;
  cashierName: string;
  registerName: string;
  registerId: string | null;
  shiftId: string | null;
  createdAt: string;
  items: SaleItem[];
};

export type StoreSettings = {
  updatedAt?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fiscalId: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  ticketFooter: string;
  cardProvider: string;
};

export type DashboardData = {
  salesToday: number;
  transactionsToday: number;
  productCount: number;
  lowStockCount: number;
  weekly: { label: string; total: number }[];
  byCategory: { name: string; count: number }[];
  lowStock: { id: string; name: string; stock: number; minStock: number }[];
};

export type ReportData = {
  totalRevenue: number;
  transactions: number;
  averageTicket: number;
  daily: { date: string; label: string; total: number }[];
  byMethod: { method: string; total: number; count: number }[];
};

// ---- the load-failure warn (V2 L6) --------------------------------------------
// A dynamic import keeps the toast store out of store.ts's static graph —
// the toaster is a UI concern; the store only signals through it.
let lastLoadWarnAt = 0;
function warnLoadFailure(failures: number): void {
  const now = Date.now();
  if (now - lastLoadWarnAt < 5000) return;
  lastLoadWarnAt = now;
  void import("@/components/ui/toast").then(({ useToastStore }) => {
    useToastStore.getState().push(
      "error",
      failures === 1
        ? "No se pudo cargar una sección. Reintenta recargando la página."
        : `No se pudieron cargar ${failures} secciones. Reintenta recargando la página.`,
    );
  });
}

// ---- the ticket (Terminal state) ---------------------------------------------

export type TicketLine = {
  product: Product;
  qty: number;
};

function ticketFromLines(lines: TicketLine[]): TicketLineInput[] {
  return lines.map((line) => ({
    product: line.product,
    qty: line.qty,
    lineTotal: lineTotalCents(line.product.price, line.qty, line.product.ivaRate),
  }));
}

export function computeTicketTotals(lines: TicketLine[]) {
  return ticketTotals(
    lines.map((l) => ({
      unitPrice: l.product.price,
      qty: l.qty,
      ivaRate: l.product.ivaRate,
    })),
  );
}

// ---- usePosStore --------------------------------------------------------------

type PosCollections = {
  products: Product[];
  categories: Category[];
  registers: Register[];
  cashiers: Cashier[];
  shifts: Shift[];
  sales: Sale[];
  settings: StoreSettings | null;
};

export type LoadedKey = keyof Omit<PosCollections, "settings"> | "settings";

type PosStore = PosCollections & {
  ticket: TicketLine[];
  activeShift: Shift | null;
  loaded: Record<LoadedKey, boolean>;
  ticketAdd: (product: Product, qty?: number) => void;
  ticketSetQty: (productId: string, qty: number) => void;
  ticketRemove: (productId: string) => void;
  ticketClear: () => void;
  loadCollections: (keys: LoadedKey[]) => Promise<void>;
  loadAll: () => Promise<void>;
  setActiveShiftFrom: (shifts: Shift[]) => void;
  reset: () => void;
};

const EMPTY: PosCollections = {
  products: [],
  categories: [],
  registers: [],
  cashiers: [],
  shifts: [],
  sales: [],
  settings: null,
};

const FETCHERS: Record<Exclude<LoadedKey, never>, () => Promise<unknown>> = {
  products: () => apiGet<Product[]>("/api/products"),
  categories: () => apiGet<Category[]>("/api/categories"),
  registers: () => apiGet<Register[]>("/api/registers"),
  cashiers: () => apiGet<Cashier[]>("/api/cashiers"),
  shifts: () => apiGet<Shift[]>("/api/shifts"),
  sales: () => apiGet<Sale[]>("/api/sales"),
  settings: () => apiGet<StoreSettings>("/api/settings"),
};

/** The active shift: the OPEN one for the store (the reference gates the
 *  Terminal on "a turn is active", singular). */
export function pickActiveShift(shifts: Shift[]): Shift | null {
  return shifts.find((s) => s.status === "open") ?? null;
}

export const usePosStore = create<PosStore>((set, get) => ({
  ...EMPTY,
  ticket: [],
  activeShift: null,
  loaded: {
    products: false,
    categories: false,
    registers: false,
    cashiers: false,
    shifts: false,
    sales: false,
    settings: false,
  },
  ticketAdd: (product, qty = 1) => {
    const lines = [...get().ticket];
    const hit = lines.find((l) => l.product.id === product.id);
    if (hit) {
      hit.qty += qty;
      set({ ticket: lines });
    } else {
      set({ ticket: [...lines, { product, qty }] });
    }
  },
  ticketSetQty: (productId, qty) => {
    if (qty <= 0) {
      set({ ticket: get().ticket.filter((l) => l.product.id !== productId) });
      return;
    }
    set({
      ticket: get().ticket.map((l) =>
        l.product.id === productId ? { ...l, qty } : l,
      ),
    });
  },
  ticketRemove: (productId) =>
    set({ ticket: get().ticket.filter((l) => l.product.id !== productId) }),
  ticketClear: () => set({ ticket: [] }),
  loadCollections: async (keys) => {
    const results = await Promise.allSettled(
      keys.map((key) => FETCHERS[key]()),
    );
    const patch: Partial<PosStore> = {};
    const loadedPatch: Partial<Record<LoadedKey, boolean>> = {};
    let failures = 0;
    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status !== "fulfilled") {
        failures += 1;
        return;
      }
      if (key === "settings") patch.settings = result.value as StoreSettings;
      else (patch as Record<string, unknown>)[key] = result.value;
      loadedPatch[key] = true;
    });
    const nextState: Partial<PosStore> = {
      ...patch,
      loaded: { ...get().loaded, ...loadedPatch } as Record<LoadedKey, boolean>,
    };
    if (patch.shifts) nextState.activeShift = pickActiveShift(patch.shifts);
    set(nextState as PosStore);
    // V2 L6: a failed fetch used to silently render an empty view. One
    // rate-limited error toast per burst — the empty state stays, but the
    // failure is no longer invisible.
    if (failures > 0) warnLoadFailure(failures);
  },
  loadAll: async () => {
    await get().loadCollections([
      "products",
      "categories",
      "registers",
      "cashiers",
      "shifts",
      "sales",
      "settings",
    ]);
  },
  setActiveShiftFrom: (shifts) =>
    set({ shifts, activeShift: pickActiveShift(shifts) }),
  reset: () => set({ ...EMPTY, ticket: [], activeShift: null }),
}));

// ---- logout -------------------------------------------------------------------

/** Full-reload logout: the login page re-defaults the chrome from scratch. */
export async function logout(): Promise<void> {
  try {
    await apiSend("POST", "/api/auth/logout");
  } catch (err: unknown) {
    if (!(err instanceof ApiError)) throw err;
    // The cookie may already be gone — clearing locally is still the goal.
  }
  usePosStore.getState().reset();
  window.location.replace("/login");
}
