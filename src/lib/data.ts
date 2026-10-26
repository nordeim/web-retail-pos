"use client";

// ---------------------------------------------------------------------------
// The data cache — one collection store keyed by API path (the family's
// collection-store pattern). Views read through useCollection(selector) and
// mutate through the small command surface; every command refetches its
// collection so the UI can never drift from the server.
// ---------------------------------------------------------------------------

import * as React from "react";

import { apiGet, apiSend, ApiError } from "./api";

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  barcode: string;
  priceCents: number;
  costCents: number | null;
  stock: number;
  minStock: number;
  taxRate: number;
  unit: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CashRegister = {
  id: string;
  name: string;
  location: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Cashier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Shift = {
  id: string;
  registerId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  openingFloatCents: number;
  closingAmountCents: number | null;
  expectedAmountCents: number | null;
  differenceCents: number | null;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
  taxRate: number;
  lineTotalCents: number;
};

export type Sale = {
  id: string;
  ticketNumber: string;
  cashierId: string | null;
  registerId: string | null;
  shiftId: string | null;
  customerName: string;
  paymentMethod: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
};

export type StoreSettings = {
  id: string;
  storeName: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  ticketFooter: string;
  cardProvider: string;
  createdAt: string;
  updatedAt: string;
};

type Listener = () => void;

/** The module-level cache shared across chunks on globalThis (the family's
 *  Turbopack store-duplication guard). */
interface CacheHost {
  __posDataCache?: DataCache;
}
const host = globalThis as unknown as CacheHost;

class DataCache {
  private state = new Map<string, unknown>();
  private loading = new Set<string>();
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    for (const listener of this.listeners) listener();
  }

  get<T>(path: string): T | undefined {
    return this.state.get(path) as T | undefined;
  }

  set(path: string, value: unknown) {
    this.state.set(path, value);
    this.emit();
  }

  /** GET once; concurrent callers share the in-flight promise. Errors are
   *  swallowed by design — the view renders empty and the next command
   *  refetches (degrade, never fail). */
  async load<T>(path: string): Promise<T | null> {
    if (this.loading.has(path)) return null;
    this.loading.add(path);
    try {
      const data = await apiGet<T>(path);
      this.state.set(path, data);
      this.emit();
      return data;
    } catch {
      return null;
    } finally {
      this.loading.delete(path);
    }
  }

  invalidate(path: string) {
    this.state.delete(path);
    this.emit();
  }
}

const cache = host.__posDataCache ?? new DataCache();
host.__posDataCache = cache;

// ---- the React binding -------------------------------------------------------

export function useCollection<T>(path: string | null): T | undefined {
  const value = React.useSyncExternalStore(
    cache.subscribe,
    () => (path ? cache.get<T>(path) : undefined),
    () => undefined,
  );
  React.useEffect(() => {
    if (path) void cache.load<T>(path);
  }, [path]);
  return value;
}

// ---- the command surface ------------------------------------------------------

async function run<T>(fn: () => Promise<T>, refetch: string[]): Promise<T> {
  const result = await fn();
  await Promise.all(refetch.map((path) => cache.load(path)));
  return result;
}

function fail(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(0, err instanceof Error ? err.message : "Error de red.");
}

export const posApi = {
  categories: {
    create: (body: unknown) =>
      run(
        () => apiSend<Category>("POST", "/api/categories", body).catch(fail),
        ["/api/categories"],
      ),
    update: (id: string, body: unknown) =>
      run(
        () => apiSend("PATCH", `/api/categories/${id}`, body).catch(fail),
        ["/api/categories", "/api/products"],
      ),
    remove: (id: string) =>
      run(
        () => apiSend("DELETE", `/api/categories/${id}`).catch(fail),
        ["/api/categories", "/api/products"],
      ),
  },
  products: {
    create: (body: unknown) =>
      run(
        () => apiSend<Product>("POST", "/api/products", body).catch(fail),
        ["/api/products"],
      ),
    update: (id: string, body: unknown) =>
      run(
        () => apiSend<Product>("PATCH", `/api/products/${id}`, body).catch(fail),
        ["/api/products"],
      ),
    remove: (id: string) =>
      run(
        () => apiSend("DELETE", `/api/products/${id}`).catch(fail),
        ["/api/products"],
      ),
  },
  registers: {
    create: (body: unknown) =>
      run(
        () => apiSend<CashRegister>("POST", "/api/registers", body).catch(fail),
        ["/api/registers"],
      ),
    update: (id: string, body: unknown) =>
      run(
        () => apiSend<CashRegister>("PATCH", `/api/registers/${id}`, body).catch(fail),
        ["/api/registers"],
      ),
    remove: (id: string) =>
      run(
        () => apiSend("DELETE", `/api/registers/${id}`).catch(fail),
        ["/api/registers", "/api/shifts"],
      ),
  },
  cashiers: {
    create: (body: unknown) =>
      run(
        () => apiSend<Cashier>("POST", "/api/cashiers", body).catch(fail),
        ["/api/cashiers"],
      ),
    update: (id: string, body: unknown) =>
      run(
        () => apiSend<Cashier>("PATCH", `/api/cashiers/${id}`, body).catch(fail),
        ["/api/cashiers"],
      ),
    remove: (id: string) =>
      run(
        () => apiSend("DELETE", `/api/cashiers/${id}`).catch(fail),
        ["/api/cashiers", "/api/shifts"],
      ),
  },
  shifts: {
    open: (body: unknown) =>
      run(
        () => apiSend<Shift>("POST", "/api/shifts", body).catch(fail),
        ["/api/shifts", "/api/registers", "/api/cashiers"],
      ),
    close: (id: string, body: unknown) =>
      run(
        () => apiSend<Shift>("POST", `/api/shifts/${id}/close`, body).catch(fail),
        ["/api/shifts"],
      ),
  },
  sales: {
    checkout: (body: unknown) =>
      run(
        () => apiSend<Sale>("POST", "/api/sales", body).catch(fail),
        ["/api/sales", "/api/products", "/api/shifts", "/api/reports/summary"],
      ),
  },
  settings: {
    save: (body: unknown) =>
      run(
        () => apiSend<StoreSettings>("PATCH", "/api/settings/store", body).catch(fail),
        ["/api/settings/store"],
      ),
  },
};

/** Load a collection imperatively (the shell's pre-warm uses this). */
export function loadCollection(path: string): Promise<unknown> {
  return cache.load(path);
}
