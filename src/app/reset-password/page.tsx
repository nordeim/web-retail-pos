"use client";

// ---------------------------------------------------------------------------
// /reset-password — the reset leg of the S15 flow: ?token=… from the
// forgot-password response link, new password POSTed with the one-shot
// token, then back to /login. Light theme — matches the login card.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Lock, Zap } from "lucide-react";

import { apiSend } from "@/lib/api";

export default function ResetPasswordPage() {
  // The token is URL state read through useSyncExternalStore — the
  // lint-clean, hydration-safe equivalent of the classic effect+setState
  // bootstrap (getSnapshot returns a stable primitive).
  const token = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => new URLSearchParams(window.location.search).get("token"),
    () => null,
  );
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !token) return;
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiSend("POST", "/api/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => window.location.replace("/login"), 1600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f9fb] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <span aria-hidden className="pos-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-[0_10px_30px_rgb(99_102_241/0.35)]">
            <Zap className="h-8 w-8" strokeWidth={2.2} />
          </span>
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Nueva contraseña</h1>
        <p className="mb-8 mt-2 text-center text-sm text-slate-400">
          Elige una contraseña fuerte para tu cuenta.
        </p>

        {!token ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            Falta el token de recuperación. Solicita un enlace nuevo desde el login.
          </p>
        ) : done ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Contraseña actualizada. Redirigiendo al login…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="rp-password" className="mb-1 block text-center text-sm text-slate-600">
                Contraseña
              </label>
              <div className="relative">
                <Lock aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="rp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-400">
                Mínimo 8 caracteres, con mayúscula, minúscula y número.
              </p>
            </div>
            <div>
              <label htmlFor="rp-confirm" className="mb-1 block text-center text-sm text-slate-600">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="rp-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-lg bg-slate-900 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
