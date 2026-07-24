import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthNav } from "@/components/AuthNav";
import { MobileMenu } from "@/components/MobileMenu";
import { isStaff, type SessionUser } from "@/lib/auth";

// Barra de navegación del catálogo: marca + enlaces + tema + sesión. El filtrado
// por categoría ya no vive aquí (antes eran pestañas); ahora está en la página
// de exploración (/todo) como filtros.
export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-8">
        <MobileMenu showAdmin={isStaff(user?.role)} />

        <Link
          href="/"
          className="font-display shrink-0 text-lg font-black tracking-tight brand-text"
        >
          {SITE_NAME}
        </Link>

        {/* Enlaces solo en escritorio; en móvil viven en el menú lateral */}
        <nav className="hidden flex-1 items-center gap-0.5 sm:flex">
          <Link
            href="/todo"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-fill hover:text-foreground"
          >
            Explorar
          </Link>
          <Link
            href="/platzi-lives"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-fill hover:text-foreground"
          >
            Platzi Lives
          </Link>
          {isStaff(user?.role) && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-2 text-sm font-medium text-accent-ink transition hover:bg-fill"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Empuja el CTA y el tema a la derecha en móvil (sin la nav) */}
        <div className="flex-1 sm:hidden" aria-hidden="true" />

        <ThemeToggle className="shrink-0" />
        <AuthNav user={user} />
      </div>
    </header>
  );
}
