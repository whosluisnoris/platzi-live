"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { SITE_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { catColor } from "@/lib/color";

type Tab = { href: string; label: string; color?: string | null };

// Barra de navegación del catálogo: marca (→ landing) + pestañas + toggle de
// tema. "Todo" y "Platzi Lives" son fijas; el resto viene de las categorías
// activas y cada una usa su color predominante en el estado activo.
export function CategoryTabs({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: "/todo", label: "Todo" },
    ...categories.map((c) => ({
      href: `/categoria/${c.slug}`,
      label: c.name,
      color: c.color,
    })),
    { href: "/platzi-lives", label: "Platzi Lives" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] items-center gap-4 px-3 py-3 sm:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-black tracking-tight brand-text"
        >
          {SITE_NAME}
        </Link>

        <nav className="custom-scroll -mx-1 flex flex-1 gap-1 overflow-x-auto px-1">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            const color = t.color ? catColor(t.color) : undefined;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                style={
                  active && color
                    ? {
                        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
                      }
                    : undefined
                }
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? color
                      ? "text-foreground"
                      : "bg-accent/15 text-accent ring-1 ring-accent/40"
                    : "text-muted hover:bg-fill hover:text-foreground"
                }`}
              >
                {active && color && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {t.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle className="shrink-0" />
      </div>
    </header>
  );
}
