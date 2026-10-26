"use client";

// ---------------------------------------------------------------------------
// The desktop chrome: a fixed dark rail — `hidden lg:flex`, 220px expanded /
// 68px collapsed (reference-measured 2026-10-26). Everything below lg goes
// through the mobile drawer (mobile-chrome.tsx); `main` carries the lg:ml
// offset (page.tsx).
//
// Measured anatomy: brand row 73px (p-5 px-4 + border-b #1e2235) with the
// 40px violet gradient chip + "Mi Tienda" (17px/700); the nav list p-4 with
// 42px rows (10px 12px padding, 12px radius); a footer collapse chevron in a
// top-bordered strip. Collapsed: brand text unmounts, icons center, the
// chevron flips (ONE ChevronLeft glyph, rotate-180 when collapsed).
// ---------------------------------------------------------------------------

import * as React from "react";
import { ChevronLeft, Zap } from "lucide-react";

import { NavItemLink } from "@/components/layout/nav-items";
import { NAV_ITEMS } from "@/lib/router";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      data-testid="desktop-sidebar"
      className={cn(
        "fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-[#1e2235] bg-[#0d0f1a] transition-[width] duration-300 lg:flex",
        collapsed ? "w-[68px]" : "w-[220px]",
      )}
    >
      {/* Brand row — the reference's h-[73px] p-5/px-4 + border-b block. */}
      <div
        className={cn(
          "flex h-[73px] shrink-0 items-center border-b border-[#1e2235]",
          collapsed ? "justify-center px-0" : "gap-3 px-4",
        )}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white pos-gradient shadow-[0_4px_16px_rgb(99_102_241/0.45)]"
        >
          <Zap className="h-5 w-5" strokeWidth={2.2} />
        </span>
        {!collapsed && (
          <span className="truncate text-[17px] font-bold text-white">Mi Tienda</span>
        )}
      </div>

      {/* The ONE nav-item source — NavItemLink for every NAV_ITEM. */}
      <nav
        aria-label="Navegación principal"
        data-testid="sidebar-nav"
        className={cn("flex flex-1 flex-col overflow-y-auto py-4", collapsed ? "px-2" : "px-2")}
      >
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.id} view={item.id} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer: the collapse toggle in its own bordered strip. */}
      <div className="flex shrink-0 justify-center border-t border-[#1e2235] py-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 outline-none transition-colors hover:bg-white/5 hover:text-white/60 focus-visible:ring-2 focus-visible:ring-sf-primary/40"
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
            strokeWidth={2}
          />
        </button>
      </div>
    </aside>
  );
}
