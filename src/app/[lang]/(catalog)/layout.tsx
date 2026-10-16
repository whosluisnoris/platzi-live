import { SiteShell } from "@/components/SiteShell";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Layout del catálogo: el marco compartido de la plataforma (barra + pie).
export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <SiteShell lang={isLocale(lang) ? lang : DEFAULT_LOCALE}>{children}</SiteShell>
  );
}
