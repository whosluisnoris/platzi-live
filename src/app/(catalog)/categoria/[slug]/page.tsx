import { notFound } from "next/navigation";
import { getCategoryBySlug, getResourcesByCategory } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";

export const dynamic = "force-dynamic";

// Grid de recursos de una categoría.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const resources = await getResourcesByCategory(category.id);

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-gray-400">{category.description}</p>
        )}
      </div>
      <ResourceGrid
        resources={resources}
        from={slug}
        empty="Aún no hay recursos en esta categoría. Pronto agregaremos más."
      />
    </main>
  );
}
