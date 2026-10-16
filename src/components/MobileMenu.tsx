"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LocaleLink } from "@/components/LocaleLink";
import { SITE_NAME } from "@/lib/constants";
import { useT } from "@/components/I18nProvider";

// Menú lateral (drawer) para móvil: mueve los enlaces de navegación fuera de la
// barra superior, que en pantallas chicas solo conserva el CTA y el tema. En
// escritorio no se muestra (los enlaces viven en la barra). `loggedIn` añade
// "Guardados" (lista personal) y `showAdmin` el enlace al panel, solo staff.
export function MobileMenu({
  showAdmin = false,
  loggedIn = false,
}: {
  showAdmin?: boolean;
  loggedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const links = [
    { href: "/todo", label: t.nav.explore },
    { href: "/blog", label: t.nav.blog },
    { href: "/enviar", label: t.nav.submitShort },
    ...(loggedIn
      ? [
          { href: "/guardados", label: t.nav.saved },
          { href: "/perfil", label: t.nav.myProfile },
        ]
      : []),
    { href: "/opiniones", label: t.nav.opinions },
    ...(showAdmin ? [{ href: "/admin", label: t.nav.admin }] : []),
  ];

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.openMenu}
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
            aria-label={t.nav.menu}
            className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-border bg-background p-4 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                {SITE_NAME}
                <span className="text-accent">.</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.nav.closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-fill hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-0.5">
              {links.map((l) => (
                <LocaleLink
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-fill"
                >
                  {l.label}
                </LocaleLink>
              ))}
            </nav>

            {!loggedIn && (
              <LocaleLink
                href="/entrar"
                onClick={() => setOpen(false)}
                className="mt-auto rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-fill hover:text-foreground"
              >
                {t.nav.signIn}
              </LocaleLink>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
