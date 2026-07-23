"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

// Botón para alternar entre tema oscuro y claro. El tema real ya lo fija un
// script en <body> antes del primer paint (sin parpadeo); aquí solo se lee y
// se cambia, persistiendo la elección en localStorage.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza con el tema que el script anti-FOUC ya fijó en <html>.
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current ?? "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("pl_theme", next);
    } catch {
      /* sin persistencia, solo cambia esta sesión */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-fill ${className}`}
    >
      {/* Evita divergencia de hidratación: sin icono hasta montar */}
      {mounted &&
        (theme === "dark" ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
            </g>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z"
              fill="currentColor"
            />
          </svg>
        ))}
    </button>
  );
}
