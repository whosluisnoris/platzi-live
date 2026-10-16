import { getActiveCategories, getCategoryResourceCounts } from "@/lib/catalog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HowToAddVideo } from "@/components/HowToAddVideo";
import { RoutePreview } from "@/components/RoutePreview";
import { topicColor } from "@/lib/color";
import {
  ButtonLink,
  GlowCard,
  IconTile,
  SectionHeader,
  TextLink,
  cn,
  containerClasses,
} from "@/components/ui";
import {
  getDictionary,
  isLocale,
  fmt,
  plural,
  localizeCategory,
  DEFAULT_LOCALE,
} from "@/lib/i18n";

// La barra y el pie vienen del layout del grupo (home), igual que en el
// catálogo: así Next puede prefetchearlos y mostrar el esqueleto de
// `loading.tsx` al volver al inicio desde otra página.
export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const [categories, counts] = await Promise.all([
    getActiveCategories(),
    getCategoryResourceCounts(),
  ]);

  // Las temáticas vienen de la base en español; el diccionario las traduce.
  const localizedCategories = categories.map((c) => ({ ...c, ...localizeCategory(c, t) }));
  const webName = localizedCategories.find((c) => c.slug === "web")?.name ?? "Web";

  const claims = [t.landing.claim1, t.landing.claim2, t.landing.claim3];

  return (
    <>
      {/* Hero: mensaje y un solo CTA a la izquierda; a la derecha, el producto
          (una ruta a medio recorrer) en vez de decoración. */}
      <section
        className={cn(
          containerClasses(),
          "grid items-center gap-10 pb-4 pt-10 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20 lg:pb-16 lg:pt-24"
        )}
      >
        <div className="flex flex-col">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem] lg:leading-none">
            {t.landing.titleLead}{" "}
            <span className="text-accent-ink">{t.landing.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted sm:mt-7 sm:text-lg">
            {t.landing.subtitle}
          </p>

          {/* El único botón naranja de la pantalla */}
          <div className="mt-7 flex flex-col items-stretch gap-2 sm:mt-9 sm:flex-row sm:items-center sm:gap-6">
            <ButtonLink href="/todo" size="lg">
              {t.landing.ctaPrimary} <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>

          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-muted sm:mt-12 sm:justify-start sm:gap-x-7 sm:text-sm">
            {claims.map((claim) => (
              <li key={claim} className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-complement" />
                {claim}
              </li>
            ))}
          </ul>
        </div>

        <RoutePreview
          topicName={webName}
          sampleLabel={t.landing.routeSample}
          nextLabel={t.landing.routeNext}
          progressLabels={[0, 1, 2, 3, 4].map((done) =>
            fmt(t.landing.routeProgress, { done, total: 4 })
          )}
          color={topicColor("web")}
        />
      </section>

      {/* Temáticas: justo después del hero, que es a lo que viene quien llega.
          Cada una con su color, que entra como brillo al pasar el cursor. */}
      {categories.length > 0 && (
        <section className={cn(containerClasses(), "pt-12 lg:pt-4")}>
          <SectionHeader
            title={t.landing.topicsTitle}
            action={
              <TextLink href="/todo" tone="complement" className="py-2 text-sm sm:text-[15px]">
                {t.landing.seeAll}
              </TextLink>
            }
          />

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {localizedCategories.map((c) => (
              <GlowCard
                key={c.id}
                href={`/categoria/${c.slug}`}
                color={topicColor(c.slug)}
                className="flex min-h-16 items-center gap-3 rounded-xl px-2.5 py-3 sm:flex-col sm:rounded-2xl sm:items-start sm:gap-3.5 sm:p-[18px]"
              >
                <IconTile color={topicColor(c.slug)}>
                  <CategoryIcon slug={c.slug} />
                </IconTile>
                <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                  <span className="font-display truncate text-[15px] font-bold text-foreground sm:text-[17px]">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted sm:text-[13px]">
                    {plural(t.landing.resourceCount, counts.get(c.id) ?? 0)}
                  </span>
                </span>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {/* Aportar: una franja compacta, el único sitio con números */}
      <HowToAddVideo t={t} />

      <div className="flex-1" />
    </>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
