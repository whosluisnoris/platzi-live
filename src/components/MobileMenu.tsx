"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

// Menú lateral (drawer) para móvil: mueve los enlaces de navegación fuera de la
// barra superior, que en pantallas chicas solo conserva el CTA y el tema. En
// escritorio no se muestra (los enlaces viven en la barra). `showAdmin` añade el
// enlace al panel solo para staff.
const LINKS = [
  { href: "/todo", label: "Explorar" },
  { href: "/platzi-lives", label: "Platzi Lives" },
];

export function MobileMenu({
  showAdmin = false,
  loggedIn = false,
}: {
  showAdmin?: boolean;
  loggedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const links = showAdmin ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-fill"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] sm:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-border bg-background p-4 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg font-black tracking-tight brand-text">
                {SITE_NAME}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-fill hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-0.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-fill"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {!loggedIn && (
              <Link
                href="/entrar"
                onClick={() => setOpen(false)}
                className="mt-auto rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-fill hover:text-foreground"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
