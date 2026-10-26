"use client";

// ---------------------------------------------------------------------------
// The below-lg chrome: a fixed dark app bar (hamburger + brand chip + store
// name) and the slide-in navigation drawer — the working mobile menu the
// reference never shipped. Drawer contract (e2e-pinned at 390×844):
//   · full-height left panel, w-72, all 8 NavItemLinks, no footer;
//   · Esc and backdrop-tap close it; body scroll locks while open;
//   · navigating closes it; the hamburger carries aria-expanded.
//
// Trap 4 (Tailwind v4): the drawer's nav list is flex flex-col gap-* —
// never space-y-* with margin-utility children (v4's :where() rewrite flips
// the specificity outcome and the CTA/list gaps render wrong).
// ---------------------------------------------------------------------------

import * as React from "react";
import { Menu, X, Zap } from "lucide-react";

import { NavItemLink } from "@/components/layout/nav-items";
import { NAV_ITEMS } from "@/lib/router";
import { useAppStore, usePosStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileChrome() {
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen);
  const setMobileMenu = useAppStore((s) => s.setMobileMenu);
  const storeName = usePosStore((s) => s.settings?.name ?? "Mi Tienda");
  const close = React.useCallback(() => setMobileMenu(false), [setMobileMenu]);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // While the drawer is open: lock body scroll, close on Escape, keep focus
  // INSIDE the dialog (V2 L11 — the overlay declared aria-modal without
  // enforcing it), and close if the viewport crosses into lg (the app bar
  // disappears there).
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    // Move focus into the dialog on open (aria-modal's contract).
    const focusTarget =
      panelRef.current?.querySelector<HTMLElement>("a[href], button") ?? panelRef.current;
    focusTarget?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      // Wrap Tab within the overlay's focusable elements.
      const focusables = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
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
      // Return focus to the invoker on close (WCAG dialog contract).
      previousFocus?.focus?.();
    };
  }, [mobileMenuOpen, close]);

  return (
    <>
      {/* App bar (the page's banner below lg). */}
      <header
        data-testid="mobile-app-bar"
        className="vx-app-bar fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-[#0d0f1a] px-4 lg:hidden"
        style={{ borderColor: "#1e2235" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            aria-controls="vx-mobile-drawer"
            data-testid="mobile-menu-button"
            onClick={() => setMobileMenu(true)}
            className="vx-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <span className="vx-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white">
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <p className="truncate text-base font-bold text-white">{storeName}</p>
        </div>
      </header>

      {/* The drawer: a full-viewport overlay + the panel. Rendered only when
          open so the focus order never crosses a hidden dialog. */}
      {mobileMenuOpen && (
        <div
          data-testid="mobile-drawer-overlay"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          id="vx-mobile-drawer"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={close}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <div
            data-testid="mobile-drawer-panel"
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              "vx-scroll absolute bottom-0 left-0 top-0 flex w-72 flex-col overflow-y-auto border-r bg-[#0d0f1a] shadow-2xl",
              "animate-in slide-in-from-left duration-200",
            )}
            style={{ borderColor: "#1e2235" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b p-4" style={{ borderColor: "#1e2235" }}>
              <div className="flex items-center gap-3">
                <span className="vx-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white">
                  <Zap className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <p className="truncate text-base font-bold text-white">{storeName}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar menú"
                data-testid="mobile-drawer-close"
                onClick={close}
                className="vx-focus flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Trap 4: flex gap-1 — NEVER space-y with margin children. */}
            <nav
              aria-label="Navegación principal"
              className="flex flex-1 flex-col gap-1 p-3"
            >
              {NAV_ITEMS.map((item) => (
                <NavItemLink key={item.id} item={item} onNavigate={close} />
              ))}
            </nav>

            <div className="shrink-0 p-4 text-xs text-slate-500">VeloxPOS</div>
          </div>
        </div>
      )}
    </>
  );
}
