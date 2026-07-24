"use client";

import { useState } from "react";
import Link from "next/link";

type Mode = "login" | "signup";

// Formulario de acceso (entrar / registro). POST a las rutas /api/auth/* y, al
// entrar con éxito, recarga a `next` para que toda la app (nav incluida) refleje
// la sesión. En el registro con confirmación por correo, muestra el aviso de
// "revisa tu correo" en lugar de redirigir.
export function AuthForm({
  mode,
  next = "/",
  initialError,
}: {
  mode: Mode;
  next?: string;
  initialError?: string;
}) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "confirm"
      ? "No pudimos confirmar tu correo. El enlace pudo expirar; intenta entrar de nuevo."
      : null
  );
  const [sent, setSent] = useState(false);

  const safeNext = next.startsWith("/") ? next : "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { email, password, displayName } : { email, password }
        ),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        needsConfirmation?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Intenta de nuevo.");
        return;
      }

      if (isSignup && data.needsConfirmation) {
        setSent(true);
        return;
      }

      // Sesión iniciada: recarga completa para propagar la sesión al servidor.
      window.location.assign(safeNext);
    } catch {
      setError("No hay conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
          ✉️
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
          Revisa tu correo
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Te enviamos un enlace de confirmación a{" "}
          <span className="font-semibold text-foreground">{email}</span>. Ábrelo para
          activar tu cuenta y empezar a aportar videos.
        </p>
        <Link
          href="/entrar"
          className="mt-6 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
        >
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
        {isSignup ? "Crea tu cuenta" : "Entra a tu cuenta"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Aporta videos, clasifícalos y vota por los que ayudan."
          : "Bienvenido de vuelta a Clusly."}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        {isSignup && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Nombre
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo te llamas"
              autoComplete="name"
              className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Correo
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Contraseña
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "Mínimo 8 caracteres" : "Tu contraseña"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="brand-gradient mt-1 rounded-full px-6 py-3 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Un momento…"
            : isSignup
              ? "Crear cuenta"
              : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {isSignup ? (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/entrar"
              className="font-semibold text-accent-ink underline decoration-2 underline-offset-4"
            >
              Entra
            </Link>
          </>
        ) : (
          <>
            ¿Nuevo en Clusly?{" "}
            <Link
              href="/registro"
              className="font-semibold text-accent-ink underline decoration-2 underline-offset-4"
            >
              Crea tu cuenta
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
