"use client";

// ---------------------------------------------------------------------------
// The login surface (/login) — the reference's LIGHT auth card: circular
// logo, "Welcome to VeloxPOS" (30px/700 #0f172a), the four OAuth rows
// (visual parity; each answers an honest "not configured" toast on this
// self-hosted instance), the OR divider, labeled email/password inputs with
// leading icons, the dark Sign-in block and the Forgot/Sign-up footer.
//
// Three client-side screens share this card: sign-in, sign-up (registers an
// UNVERIFIED account; the 6-digit code rides the response — the self-hosted
// delivery — and the verify step completes activation) and forgot-password
// (the reset link rides the response; it deep-links to /reset-password).
// ---------------------------------------------------------------------------

import * as React from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { apiSend } from "@/lib/api";

type Mode = "signin" | "signup" | "verify" | "forgot";

const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "microsoft", label: "Continue with Microsoft", icon: MicrosoftIcon },
  { id: "facebook", label: "Continue with Facebook", icon: FacebookIcon },
  { id: "apple", label: "Continue with Apple", icon: AppleIcon },
] as const;

export function LoginSurface() {
  const toast = useToast();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  // The auth surface is LIGHT while the app body is dark — paint the body
  // to match so overscroll/edges never flash the dark canvas underneath.
  React.useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#f6f9fb";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") {
        await apiSend("POST", "/api/auth/login", { email, password });
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from_url");
        window.location.replace(from && from.startsWith("/") ? from : "/POS");
        return;
      }
      if (mode === "signup") {
        await apiSend<{ ok: boolean; code?: string }>("POST", "/api/auth/register", {
          name: fullName,
          email,
          password,
        });
        setMode("verify");
        toast.toast.info("Cuenta creada. Revisa el código de verificación mostrado.");
        return;
      }
      if (mode === "verify") {
        await apiSend("POST", "/api/auth/verify-email", { email, code });
        toast.toast.success("Cuenta verificada. Ya puedes iniciar sesión.");
        setMode("signin");
        return;
      }
      // forgot — the reset link rides the response (self-hosted delivery)
      const res = await apiSend<{ resetUrl?: string }>("POST", "/api/auth/forgot-password", { email });
      if (res.resetUrl) {
        const path = res.resetUrl.replace(/^https?:\/\/[^/]+/, "");
        window.location.replace(path);
        return;
      }
      toast.toast.info("Si la cuenta existe, el enlace de recuperaci\u00f3n fue generado.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f9fb] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)] sm:p-10">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <span
            aria-hidden
            className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2e1a47] shadow-[0_10px_30px_rgb(99_102_241/0.35)]"
          >
            <CubeIcon />
          </span>
        </div>

        <h1 className="whitespace-nowrap text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome to VeloxPOS
        </h1>
        <p className="mb-8 mt-2 text-center text-base text-slate-400">
          {mode === "signin" && "Sign in to continue"}
          {mode === "signup" && "Crea tu cuenta de tienda"}
          {mode === "verify" && "Verifica tu email"}
          {mode === "forgot" && "Recupera tu acceso"}
        </p>

        {mode === "signin" && (
          <div className="mb-6 space-y-3">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() =>
                  toast.toast.info(
                    "OAuth no está configurado en esta instancia. Usa email y contraseña.",
                  )
                }
                className="flex h-[54px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <provider.icon />
                {provider.label}
              </button>
            ))}
          </div>
        )}

        {mode === "signin" && (
          <div className="mb-6 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold tracking-widest text-slate-400">OR</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        )}

        <form onSubmit={submit} className="space-y-4" data-testid="login-form">
          {mode === "signup" && (
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-center text-sm text-slate-600">
                Nombre
              </label>
              <input
                id="auth-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {mode !== "verify" && (
            <>
              <div>
                <label htmlFor="auth-email" className="mb-1 block text-center text-sm text-slate-600">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    data-testid="login-email"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <label htmlFor="auth-password" className="mb-1 block text-center text-sm text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={mode === "signup" ? 8 : undefined}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      data-testid="login-password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  {mode === "signup" && (
                    <p className="mt-1 text-xs text-slate-400">
                      Mínimo 8 caracteres, con mayúscula, minúscula y número.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {mode === "verify" && (
            <div>
              <label htmlFor="auth-code" className="mb-1 block text-center text-sm text-slate-600">
                Código de 6 dígitos
              </label>
              <div className="relative">
                <ShieldCheck
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="auth-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength={6}
                  data-testid="verify-code"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-center font-mono text-lg tracking-[0.4em] text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Instancia auto-alojada: el código se mostró al crear la cuenta (sin correo).
              </p>
            </div>
          )}

          {error && (
            <p role="alert" data-testid="login-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            data-testid="login-submit"
            className="h-12 w-full rounded-lg bg-slate-900 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {busy && "…"}
            {mode === "signin" && (busy ? "Signing in…" : "Sign in")}
            {mode === "signup" && (busy ? "Creando…" : "Crear cuenta")}
            {mode === "verify" && (busy ? "Verificando…" : "Verificar")}
            {mode === "forgot" && (busy ? "Enviando…" : "Enviar enlace")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          {mode === "signin" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                Forgot password?
              </button>
              <p className="text-slate-500">
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="font-semibold text-indigo-500 hover:text-indigo-600"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className="mx-auto text-slate-500 hover:text-slate-700"
            >
              Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// ---- brand + OAuth glyphs (inline SVG; no network font/icon dependency) ----

function CubeIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      <defs>
        <linearGradient id="cubeA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="cubeB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M24 4 42 14v20L24 44 6 34V14L24 4z" fill="url(#cubeB)" />
      <path d="M24 4 42 14l-18 10L6 14 24 4z" fill="url(#cubeA)" />
      <path d="M24 24v20L6 34V14l18 10z" fill="#4f46e5" opacity="0.85" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.6 1.4l3.2-3.1C16.9 1.1 14.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-4.9 6.8-4.9z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M16.7 15.5l.5-3.5h-3.4v-2.3c0-1 .5-1.9 2-1.9h1.5V4.8s-1.4-.2-2.7-.2c-2.7 0-4.5 1.6-4.5 4.6V12H7v3.5h3.1V24h3.7v-8.5h2.9z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black" aria-hidden>
      <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.11 2.95 3.62 2.89 1.45-.06 2-.94 3.75-.94s2.25.94 3.78.91c1.56-.03 2.55-1.42 3.5-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.06-4.6zM14.14 4.06c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.85-1.39 2.23-1.22 3.54 1.29.1 2.6-.65 3.41-1.62z" />
    </svg>
  );
}
