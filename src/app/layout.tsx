import type { Metadata, Viewport } from "next";

import "./globals.css";

import { Toaster } from "@/components/ui/toast";
import { siteUrl } from "@/lib/site";

// The root layout is a SERVER component: metadata + the global toaster. The
// app itself is dark-only (the reference's own contract); the login route
// paints its light card through explicit utilities.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "VeloxPOS — Punto de Venta",
  description:
    "VeloxPOS — sistema de punto de venta para tiendas de retail: terminal, inventario, ventas, cajas, cajeros y reportes.",
};

export const viewport: Viewport = {
  themeColor: "#080a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
