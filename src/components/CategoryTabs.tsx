"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { SITE_NAME } from "@/lib/constants";

// Barra de navegación del catálogo: marca (→ landing) + pestañas. "Todo" y
// "Platzi Lives" son fijas; el resto viene de las categorías activas.
export function CategoryTabs({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/todo", label: "Todo" },
    ...categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })),
    { href: "/platzi-lives", label: "Platzi Lives" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e1013]/80 bg-gradient-to-b from-white/[0.06] to-transparent backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-3 py-3 sm:px-8 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" className="shrink-0 text-xl font-bold text-white">
          {SITE_NAME.split(" ")[0]}{" "}
          <span className="text-[#0aeb8b]">
            {SITE_NAME.split(" ").slice(1).join(" ") || ""}
          </span>
        </Link>

        <nav className="custom-scroll -mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => {
            const active =
              pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#0aeb8b]/15 text-[#0aeb8b] ring-1 ring-[#0aeb8b]/40"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
