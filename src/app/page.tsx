"use client";

// ---------------------------------------------------------------------------
// The WHOLE app (§4.1): one page — auth gate → shell → view switcher. The
// 8 PascalCase paths are rewritten onto / by next.config.ts; the store syncs
// the view with the pathname (hydrate()).
//
// Gate: /api/auth/me (user identity + store colors) pre-warms the Terminal
// collections IN PARALLEL; a 401 leaves through window.location.replace
// ("/login") — a FULL reload so the login surface paints its light theme.
// ---------------------------------------------------------------------------

import * as React from "react";

import { MobileChrome } from "@/components/layout/mobile-chrome";
import { Sidebar } from "@/components/layout/sidebar";
import { Zap } from "lucide-react";
import { apiGet, ApiError } from "@/lib/api";
import { loadCollection } from "@/lib/data";
import type { ViewId } from "@/lib/router";
import { useAppStore, type AppUser } from "@/lib/store";
import { cn } from "@/lib/utils";

import { DashboardView } from "@/components/views/dashboard-view";
import { CashiersView } from "@/components/views/cashiers-view";
import { InventoryView } from "@/components/views/inventory-view";
import { RegistersView } from "@/components/views/registers-view";
import { ReportsView } from "@/components/views/reports-view";
import { SalesView } from "@/components/views/sales-view";
import { SettingsView } from "@/components/views/settings-view";
import { TerminalView } from "@/components/views/terminal-view";

/** Sets data-app-hydrated on the shell commit — the e2e gate that proves
 *  the authed chrome (sidebar nav) has actually rendered. */
function HydrationMarker() {
  React.useEffect(() => {
    document.documentElement.dataset.appHydrated = "true";
  }, []);
  return null;
}

/** The static view registry — one component per NAV_ITEM view id. */
const VIEW_COMPONENTS: Record<ViewId, React.ComponentType> = {
  terminal: TerminalView,
  dashboard: DashboardView,
  inventory: InventoryView,
  sales: SalesView,
  registers: RegistersView,
  cashiers: CashiersView,
  reports: ReportsView,
  settings: SettingsView,
};

type GateStatus = "loading" | "ready" | "error";

function Splash({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#080a14]">
      <span
        aria-hidden
        className="pos-gradient flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl text-white shadow-[0_8px_32px_rgb(99_102_241/0.45)]"
      >
        <Zap className="h-7 w-7" strokeWidth={2.2} />
      </span>
      {error && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-slate-400">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-300 outline-none focus-visible:ring-2 focus-visible:ring-sf-primary/40"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Hex → "r g b" triplet for the runtime --pos-* vars (Ajustes colors). */
function hexToTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num) || full.length !== 6) return "";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

export default function Home() {
  const [status, setStatus] = React.useState<GateStatus>("loading");
  const [gateError, setGateError] = React.useState<string>("");
  const [attempt, setAttempt] = React.useState(0);
  const view = useAppStore((s) => s.view);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  React.useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setStatus("loading");
      setGateError("");
      // The view comes from the URL, not the render closure.
      useAppStore.getState().hydrate();
      const activeView = useAppStore.getState().view;

      // The Terminal's collections pre-warm IN PARALLEL with the auth
      // round-trip and never block the shell on failure.
      const prewarmPaths =
        activeView === "terminal"
          ? ["/api/products", "/api/shifts"]
          : ["/api/shifts"];
      const prewarm = Promise.all(
        prewarmPaths.map((path) => loadCollection(path).catch(() => null)),
      );

      try {
        const { user } = await apiGet<{ user: AppUser }>("/api/auth/me");
        if (cancelled) return;
        useAppStore.getState().setUser(user);

        // The store's configurable colors ride the shell (Ajustes →
        // Personalización) — applied as runtime --pos-* triplets.
        try {
          const settings = await apiGet<{ primaryColor: string; secondaryColor: string }>(
            "/api/settings/store",
          );
          if (cancelled) return;
          useAppStore.getState().setStoreColors(settings.primaryColor, settings.secondaryColor);
          const root = document.documentElement;
          const primary = hexToTriplet(settings.primaryColor);
          const secondary = hexToTriplet(settings.secondaryColor);
          if (primary) root.style.setProperty("--pos-primary", primary);
          if (secondary) root.style.setProperty("--pos-gradient-to", secondary);
        } catch {
          // Defaults already in :root — a failed settings read never gates.
        }

        await prewarm;
        if (cancelled) return;
        setStatus("ready");
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.replace("/login");
          return;
        }
        setGateError(
          err instanceof Error
            ? err.message
            : "Algo salió mal al cargar la tienda.",
        );
        setStatus("error");
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status !== "ready") {
    return (
      <>
        <a href="#main-content" className="pos-skip-link">
          Saltar al contenido principal
        </a>
        <Splash
          error={status === "error" ? gateError : undefined}
          onRetry={status === "error" ? () => setAttempt((n) => n + 1) : undefined}
        />
      </>
    );
  }

  const ActiveView = VIEW_COMPONENTS[view] ?? VIEW_COMPONENTS.terminal;

  return (
    <>
      <a href="#main-content" className="pos-skip-link">
        Saltar al contenido principal
      </a>
      <Sidebar />
      <HydrationMarker />
      <MobileChrome />
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "min-h-dvh pt-16 outline-none transition-[margin] lg:pt-0",
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[220px]",
        )}
      >
        <ActiveView />
      </main>
    </>
  );
}
