"use client";

import { useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

// Controles de sesión para la barra de navegación. Sin sesión: enlaces de entrar
// y registro. Con sesión: botón para aportar video + menú con "Mis videos" y salir.
export function AuthNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href="/entrar"
          className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground sm:inline-block"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="brand-gradient rounded-full px-4 py-2 text-sm font-bold text-on-accent transition hover:brightness-110 active:scale-95"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  const initial = user.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/enviar"
        className="hidden rounded-full bg-fill px-3.5 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong sm:inline-block"
      >
        + Aportar video
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent-ink ring-1 ring-accent/30 transition hover:bg-accent/25"
          title={user.displayName}
        >
          {initial}
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div
              role="menu"
              className="glass absolute right-0 z-50 mt-2 w-52 rounded-xl p-1.5 shadow-xl backdrop-blur-md"
            >
              <div className="truncate px-3 py-2 text-xs text-faint">{user.email}</div>
              <MenuLink href="/mis-videos" onClick={() => setOpen(false)}>
                Mis videos
              </MenuLink>
              <MenuLink href="/enviar" onClick={() => setOpen(false)}>
                Aportar video
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                disabled={loggingOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-fill hover:text-foreground disabled:opacity-60"
              >
                {loggingOut ? "Saliendo…" : "Cerrar sesión"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-fill"
    >
      {children}
    </Link>
  );
}
