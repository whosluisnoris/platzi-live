import Link from "next/link";
import { getActiveCategories, getCategoryResourceCounts } from "@/lib/catalog";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/constants";
import { catColor } from "@/lib/color";

export const dynamic = "force-dynamic";

// Intro editorial (sin tarjetas): tres ideas numeradas separadas por hairlines.
const PRINCIPLES = [
  {
    n: "01",
    title: "Curado por área",
    text: "Cada recurso vive en su temática. Nada de buscar a ciegas entre resultados infinitos.",
  },
  {
    n: "02",
    title: "En español y gratis",
    text: "Solo contenido de calidad, gratuito y en tu idioma, reunido en un mismo lugar.",
  },
  {
    n: "03",
    title: "Playlists en orden",
    text: "Rutas de videos listas para seguir paso a paso, sin perderte entre mil pestañas.",
  },
];

export default async function LandingPage() {
  const [categories, counts] = await Promise.all([
    getActiveCategories(),
    getCategoryResourceCounts(),
  ]);

  // Mezcla de los colores de las categorías (el "predominante" de cada una) en
  // un solo degradado que firma la página principal.
  const palette = categories.map((c) => catColor(c.color));
  const blend =
    palette.length >= 2
      ? `linear-gradient(100deg, ${palette.join(", ")})`
      : "linear-gradient(100deg, var(--brand-red), var(--brand-magenta))";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Manchas de color de fondo (mezcla de las temáticas), muy sutiles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-[120px]"
          style={{ background: palette[0] ?? "var(--brand-magenta)" }}
        />
        <div
          className="absolute -right-32 top-10 h-[32rem] w-[32rem] rounded-full opacity-20 blur-[120px]"
          style={{ background: palette[1] ?? "var(--brand-red)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full opacity-15 blur-[120px]"
          style={{ background: palette[2] ?? "var(--brand-wine)" }}
        />
      </div>

      {/* Header */}
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-lg font-black tracking-tight brand-text">{SITE_NAME}</span>
        <div className="flex items-center gap-2">
          <Link
            href="/platzi-lives"
            className="rounded-full px-3 py-2 text-sm text-muted transition hover:text-foreground"
          >
            Platzi Lives
          </Link>
          <Link
            href="/todo"
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Explorar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1500px] px-5 pb-14 pt-14 sm:px-8 sm:pt-24">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-muted">
          Aprende IA y datos, sin el caos
        </p>
        <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-foreground sm:text-7xl">
          Demasiado video suelto
          <br />
          para aprender.{" "}
          <span className="brand-text">Aquí está ordenado.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
          {SITE_NAME} reúne y organiza los mejores recursos de YouTube por
          temática, para que estudies con una ruta clara en vez de perderte entre
          miles de videos dispersos.
        </p>

        {/* Un solo CTA dominante (ley de Hick) + una acción secundaria discreta */}
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link
            href="/todo"
            className="brand-gradient rounded-full px-7 py-3.5 text-sm font-bold text-[#fff8f0] shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
          >
            Explorar los recursos
          </Link>
          <Link
            href="/platzi-lives"
            className="text-sm font-semibold text-foreground underline decoration-2 underline-offset-4 transition hover:text-muted"
          >
            o mira los Platzi Lives
          </Link>
        </div>

        {/* Barra que mezcla los colores de las temáticas */}
        <div
          className="mt-14 h-1.5 w-full max-w-3xl rounded-full"
          style={{ backgroundImage: blend }}
          aria-hidden="true"
        />
      </section>

      {/* Cómo funciona — editorial, sin tarjetas, separado por hairlines */}
      <section className="mx-auto w-full max-w-[1500px] px-5 py-10 sm:px-8">
        <div className="grid gap-0 sm:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.n}
              className={`py-6 sm:px-8 sm:py-2 ${
                i > 0 ? "border-t border-border sm:border-l sm:border-t-0" : "sm:pl-0"
              }`}
            >
              <span className="font-mono text-sm text-accent">{p.n}</span>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Temáticas — cada una con su color predominante */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1500px] px-5 py-12 sm:px-8">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Explora por temática
            </h2>
            <Link
              href="/todo"
              className="text-sm font-semibold text-muted transition hover:text-foreground"
            >
              Ver todo →
            </Link>
          </div>

          <div className="border-t border-border">
            {categories.map((c) => {
              const color = catColor(c.color);
              const n = counts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/categoria/${c.slug}`}
                  className="group flex items-center gap-5 border-b border-border py-6 transition hover:bg-fill"
                >
                  <span
                    className="h-12 w-12 shrink-0 rounded-full transition group-hover:scale-110"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-0.5 truncate text-sm text-muted">{c.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-sm text-muted">
                    {n} {n === 1 ? "recurso" : "recursos"}
                  </span>
                  <span
                    className="shrink-0 text-xl transition group-hover:translate-x-1"
                    style={{ color }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
