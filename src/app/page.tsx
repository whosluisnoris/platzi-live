import Link from "next/link";
import { getActiveCategories, getCategoryResourceCounts } from "@/lib/catalog";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const VALUE_PROPS = [
  {
    icon: "🎯",
    title: "Curado por área",
    text: "Nada de buscar a ciegas: cada recurso vive en su temática (IA, agentes, datos y más).",
  },
  {
    icon: "🇪🇸",
    title: "En español y gratis",
    text: "Contenido de calidad, gratuito y en tu idioma, reunido en un solo lugar.",
  },
  {
    icon: "📚",
    title: "Playlists en orden",
    text: "Rutas de videos listas para seguir paso a paso, sin perderte entre mil pestañas.",
  },
];

export default async function LandingPage() {
  const [categories, counts] = await Promise.all([
    getActiveCategories(),
    getCategoryResourceCounts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header propio de la landing (sin pestañas de catálogo) */}
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-xl font-bold text-white">
          {SITE_NAME.split(" ")[0]}{" "}
          <span className="text-[#0aeb8b]">
            {SITE_NAME.split(" ").slice(1).join(" ")}
          </span>
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/platzi-lives"
            className="rounded-lg px-3 py-2 text-gray-300 transition hover:text-white"
          >
            Platzi Lives
          </Link>
          <Link
            href="/todo"
            className="rounded-lg bg-[#0aeb8b] px-4 py-2 font-semibold text-[#0e1013] transition hover:bg-[#08c975]"
          >
            Explorar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-12 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-block rounded-full bg-[#0aeb8b]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0aeb8b] ring-1 ring-[#0aeb8b]/30">
            Aprende IA y datos, sin el caos
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Demasiado video suelto para aprender.{" "}
            <span className="text-[#0aeb8b]">Aquí está ordenado.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            {SITE_TAGLINE} {SITE_NAME} reúne y organiza los mejores recursos de
            YouTube por temática, para que aprendas en orden en vez de perderte
            entre miles de videos dispersos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/todo"
              className="rounded-lg bg-[#0aeb8b] px-6 py-3 text-sm font-semibold text-[#0e1013] transition hover:bg-[#08c975] active:scale-95"
            >
              Explorar todos los recursos →
            </Link>
            <Link
              href="/platzi-lives"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5"
            >
              Ver Platzi Lives
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona / valor */}
      <section className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 py-8 sm:grid-cols-3 sm:px-8">
        {VALUE_PROPS.map((v) => (
          <div key={v.title} className="glass backdrop-blur-md rounded-2xl p-6">
            <div className="text-2xl">{v.icon}</div>
            <h3 className="mt-3 text-base font-bold text-white">{v.title}</h3>
            <p className="mt-1.5 text-sm text-gray-400">{v.text}</p>
          </div>
        ))}
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-8">
          <h2 className="mb-6 text-2xl font-bold text-white">
            Explora por <span className="text-[#0aeb8b]">temática</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/categoria/${c.slug}`}
                  className="group flex flex-col justify-between rounded-2xl bg-[#14171c] p-6 ring-1 ring-white/10 transition hover:ring-[#0aeb8b]/40"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#0aeb8b]">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-1.5 text-sm text-gray-400">{c.description}</p>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-medium text-gray-500">
                    {n} {n === 1 ? "recurso" : "recursos"} →
                  </p>
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
