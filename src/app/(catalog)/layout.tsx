import { getActiveCategories } from "@/lib/catalog";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

// Layout compartido del catálogo: barra de pestañas (categorías activas + "Todo"
// + "Platzi Lives") sobre todas las páginas del route group, más el pie de página.
// La encuesta flotante NO vive aquí: su pregunta es sobre Platzi Lives, así que
// solo se monta en esa página.
export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getActiveCategories();
  return (
    <div className="flex min-h-screen flex-col">
      <CategoryTabs categories={categories} />
      {children}
      <SiteFooter />
    </div>
  );
}
