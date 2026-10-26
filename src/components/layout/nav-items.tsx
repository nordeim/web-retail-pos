"use client";

// ---------------------------------------------------------------------------
// The ONE nav-item markup source — consumed by BOTH the desktop sidebar and
// the mobile drawer; never re-implement the item markup.
// Icons are reference-matched (measured off the live sidebar 2026-10-26):
// Terminal is shopping-cart, Dashboard is bar-chart-3, Inventario is package,
// Ventas is history, Cajas is monitor, Cajeros is users, Reportes is
// file-text, Ajustes is settings.
// Geometry (measured): row height 42px, padding 10px 12px, radius 12px,
// 14px/500 labels; active bg rgba(124,58,237,.2) + violet-300 text.
// ---------------------------------------------------------------------------

import {
  BarChart3,
  FileText,
  History,
  Monitor,
  Package,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { NAV_ITEMS } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { ViewId } from "@/lib/router";

export const NAV_ICONS: Record<ViewId, LucideIcon> = {
  terminal: ShoppingCart,
  dashboard: BarChart3,
  inventory: Package,
  sales: History,
  registers: Monitor,
  cashiers: Users,
  reports: FileText,
  settings: Settings,
};

type NavItemLinkProps = {
  view: ViewId;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function NavItemLink({ view, collapsed = false, onNavigate, className }: NavItemLinkProps) {
  const item = NAV_ITEMS.find((n) => n.id === view);
  const active = useAppStore((s) => s.view) === view;
  const navigate = useAppStore((s) => s.navigate);
  if (!item) return null;
  const Icon = NAV_ICONS[view];

  return (
    <a
      href={item.path}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      onClick={(e) => {
        e.preventDefault();
        navigate(view);
        onNavigate?.();
      }}
      className={cn(
        "group flex outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sf-primary/40",
        active ? "text-violet-300" : "text-white/40 hover:text-white/70 hover:bg-white/5",
        "rounded-xl",
        className,
      )}
    >
      <span
        className={cn(
          "flex flex-1 items-center rounded-xl px-3 py-2.5 transition-colors",
          !collapsed && "gap-3",
          active && "bg-violet-600/20",
        )}
      >
        <Icon
          className={cn("h-5 w-5 shrink-0", active && "text-violet-300")}
          strokeWidth={2}
        />
        {!collapsed && (
          <span className={cn("flex-1 truncate text-sm font-medium", active && "text-violet-300")}>
            {item.label}
          </span>
        )}
      </span>
    </a>
  );
}
