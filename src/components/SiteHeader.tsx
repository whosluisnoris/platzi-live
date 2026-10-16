import { LocaleLink } from "@/components/LocaleLink";
import { SITE_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AuthNav } from "@/components/AuthNav";
import { MobileMenu } from "@/components/MobileMenu";
import { isStaff, type SessionUser } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";

// Barra de navegación de toda la plataforma: marca + enlaces + idioma + tema +
// sesión. Los enlaces se localizan solos (LocaleLink), así que /todo apunta a
// /es/todo o /en/todo según el idioma activo.
export function SiteHeader({
  user,
  lang,
}: {
  user: SessionUser | null;
  lang: Locale;
}) {
  const t = getDictionary(lang);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full min-w-0 max-w-[1500px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-8">
        <MobileMenu showAdmin={isStaff(user?.role)} loggedIn={!!user} />

        <LocaleLink
          href="/"
          className="font-display shrink-0 text-xl font-extrabold tracking-tight text-foreground"
        >
          {SITE_NAME}
          <span className="text-accent">.</span>
        </LocaleLink>

        {/* Enlaces solo en escritorio; en móvil viven en el menú lateral */}
        <nav className="hidden flex-1 items-center gap-0.5 sm:flex">
          <NavLink href="/todo">{t.nav.explore}</NavLink>
          {user && <NavLink href="/guardados">{t.nav.saved}</NavLink>}
          <NavLink href="/blog">{t.nav.blog}</NavLink>
          <NavLink href="/opiniones">{t.nav.opinions}</NavLink>
          {isStaff(user?.role) && (
            <LocaleLink
              href="/admin"
              className="rounded-full px-3 py-2 text-sm font-medium text-accent-ink transition hover:bg-fill"
            >
              {t.nav.admin}
            </LocaleLink>
          )}
        </nav>

        {/* Empuja el CTA, el idioma y el tema a la derecha en móvil (sin la nav) */}
        <div className="flex-1 sm:hidden" aria-hidden="true" />

        <LanguageToggle className="shrink-0" />
        <ThemeToggle className="shrink-0" />
        <AuthNav user={user} />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <LocaleLink
      href={href}
      className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-fill hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </LocaleLink>
  );
}
