import { notFound } from "next/navigation";
import { getCategoryBySlug, getResourcesByCategory } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";
import { catColor } from "@/lib/color";
import { CategoryIcon } from "@/components/CategoryIcon";

export const dynamic = "force-dynamic";

// Grid de recursos de una categoría, con su ícono y el acento del tema.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const resources = await getResourcesByCategory(category.id);
  const color = catColor(category.color);

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-on-complement"
          style={{ backgroundColor: "var(--complement)" }}
        >
          <CategoryIcon slug={slug} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{category.description}</p>
          )}
        </div>
      </div>
      <ResourceGrid
        resources={resources}
        from={slug}
        accent={color}
        empty="Aún no hay recursos en esta categoría. Pronto agregaremos más."
      />
    </main>
  );
}
