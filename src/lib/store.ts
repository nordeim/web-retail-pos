"use client";

// ---------------------------------------------------------------------------
// The ONE Zustand store (§4.3 — one store per application). No React Context
// anywhere — views subscribe with selectors; the store is the only mutation
// path for SPA view state and the authed user identity.
//
// useAppStore — view ↔ pathname sync, sidebar collapse (persisted), the
//               mobile drawer flag, the authed user + store colors.
// ---------------------------------------------------------------------------

import { create } from "zustand";

import { pathForView, viewFromPath, type ViewId } from "./router";

const SIDEBAR_COLLAPSED_KEY = "pos-sidebar-collapsed";

// ---- the authenticated user's /api/auth/me shape (camelCase User row) ------

export type AppUser = {
  id: string;
  email: string;
  /** The API's public field (publicUser() maps the DB's fullName → name). */
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppStore = {
  view: ViewId;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  user: AppUser | null;
  /** The store's configurable gradient colors (Ajustes → Personalización). */
  primaryColor: string;
  secondaryColor: string;
  /** SPA navigation: pushes the canonical path + flips the view. */
  navigate: (view: ViewId) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenu: (open: boolean) => void;
  setUser: (user: AppUser | null) => void;
  setStoreColors: (primary: string, secondary: string) => void;
  /** Mount-time sync: read the URL + the persisted collapse preference. */
  hydrate: () => void;
};

let popstateBound = false;

export const useAppStore = create<AppStore>((set, get) => ({
  view: "terminal",
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  user: null,
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",

  navigate: (view) => {
    try {
      window.history.pushState({}, "", pathForView(view));
    } catch {
      // history unavailable (SSR/tests) — the view flip still happens
    }
    set({ view, mobileMenuOpen: false });
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
    } catch {
      // private mode — the preference just doesn't persist
    }
  },

  toggleSidebar: () => {
    get().setSidebarCollapsed(!get().sidebarCollapsed);
  },

  setMobileMenu: (open) => set({ mobileMenuOpen: open }),

  setUser: (user) => set({ user }),

  setStoreColors: (primaryColor, secondaryColor) => set({ primaryColor, secondaryColor }),

  hydrate: () => {
    set({ view: viewFromPath(window.location.pathname) });
    try {
      set({ sidebarCollapsed: window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true" });
    } catch {
      // ignore — default expanded
    }
    if (!popstateBound) {
      popstateBound = true;
      window.addEventListener("popstate", () => {
        useAppStore.setState({ view: viewFromPath(window.location.pathname) });
      });
    }
  },
}));
