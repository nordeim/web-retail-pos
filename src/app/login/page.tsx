"use client";

import * as React from "react";
import { Zap } from "lucide-react";

// The measured auth surface (sub-screens swap client-side — see
// src/components/auth/login-surface.tsx). useSearchParams requires a
// Suspense boundary during static prerender; the fallback renders the
// brand card so the prerendered HTML is never empty.
import { LoginSurface } from "@/components/auth/login-surface";

function AuthFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f9fb] p-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white/95 p-10 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)]">
        <span
          aria-hidden
          className="pos-gradient flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl text-white"
        >
          <Zap className="h-8 w-8" strokeWidth={2.2} />
        </span>
      </div>
    </main>
  );
}

export default function AuthRoutePage() {
  return (
    <React.Suspense fallback={<AuthFallback />}>
      <LoginSurface />
    </React.Suspense>
  );
}
