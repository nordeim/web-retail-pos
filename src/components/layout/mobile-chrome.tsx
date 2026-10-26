"use client";

// ---------------------------------------------------------------------------
// The below-lg chrome — THE SUPERSET FIX for the reference's broken mobile
// navigation. On the reference (measured 390×844, 2026-10-26) the 220px
// sidebar stays fixed-OPEN on phones, covers the content, and offers no
// hamburger/drawer/backdrop. This component ships the working pattern the
// repo proved on the StudyFlow port, restyled to the POS dark system:
//
//   • a fixed h-16 app bar (hamburger + brand) — lg:hidden
//   • a slide-in drawer (w-72, max-w-[85vw]) over a bg-black/60 backdrop
//   • closes on: item tap, backdrop tap, Escape, and crossing lg
//   • body scroll locked while open
//
// Tailwind v4 trap discipline: the nav list is flex flex-col gap-* — NEVER
// space-y-* with mt-*/mb-* children (trap 4); the backdrop blur is
// backdrop-blur-xs (v4 name, trap 9).
// ---------------------------------------------------------------------------

import * as React from "react";
import { X, Zap } from "lucide-react";

import { NavItemLink } from "@/components/layout/nav-items";
import { NAV_ITEMS } from "@/lib/router";
import { useAppStore } from "@/lib/store";

export function MobileChrome() {
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen);
  const setMobileMenu = useAppStore((s) => s.setMobileMenu);
  const close = React.useCallback(() => setMobileMenu(false), [setMobileMenu]);

  // While the drawer is open: lock body scroll, close on Escape, and close
  // if the viewport crosses into lg (the app bar itself disappears there).
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (desktop.matches) close();
    };
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [mobileMenuOpen, close]);

  return (
    <>
      {/* App bar — the page's banner below lg. */}
      <header
        data-testid="mobile-appbar"
        className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#1e2235] bg-[#0d0f1a] px-4 lg:hidden"
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            data-testid="mobile-hamburger"
            onClick={() => setMobileMenu(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-sf-primary/40"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white pos-gradient shadow-[0_4px_16px_rgb(99_102_241/0.45)]"
          >
            <Zap className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="truncate text-base font-bold text-white">Mi Tienda</span>
        </div>
      </header>

      {/* The slide-in drawer — mounted only while open. */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          data-testid="mobile-drawer"
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            data-testid="mobile-drawer-backdrop"
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="pos-slide-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[#1e2235] bg-[#0d0f1a] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[#1e2235] p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white pos-gradient shadow-[0_4px_16px_rgb(99_102_241/0.45)]"
                >
                  <Zap className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p className="text-[17px] font-bold text-white">Mi Tienda</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar menú"
                data-testid="mobile-drawer-close"
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-sf-primary/40"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <nav
              aria-label="Navegación principal"
              data-testid="mobile-drawer-nav"
              className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
            >
              {NAV_ITEMS.map((item) => (
                <NavItemLink key={item.id} view={item.id} onNavigate={close} />
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
