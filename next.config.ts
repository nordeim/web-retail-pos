import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Next 16's dev-origin protection silently blocks dev chunks for the
  // 127.0.0.1 origin (unhydrated page, native form GET fallbacks) — restore
  // both origins for local browser/probe access (see
  // docs/Tailwind-V4-Validation-Report.md, session-12 methodology note).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Path-based SPA routing: the reference app's views live at real paths
  // (/POS, /Dashboard, /Inventory, /Sales, /Registers, /Cashiers,
  // /Reports, /StoreSettings — PascalCase, measured live 2026-10-26). We
  // keep ONE page (src/app/page.tsx) and rewrite those paths onto it; the
  // client store syncs view state with location.pathname (see
  // src/lib/router.ts).
  async rewrites() {
    return [
      { source: "/POS", destination: "/" },
      { source: "/Dashboard", destination: "/" },
      { source: "/Inventory", destination: "/" },
      { source: "/Sales", destination: "/" },
      { source: "/Registers", destination: "/" },
      { source: "/Cashiers", destination: "/" },
      { source: "/Reports", destination: "/" },
      { source: "/StoreSettings", destination: "/" },
    ];
  },
};

export default nextConfig;
