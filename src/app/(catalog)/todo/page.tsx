import {
  getActiveCategories,
  getResourcesFiltered,
  getCategoriesForResources,
  type ResourceSort,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { ResourceGrid } from "@/components/ResourceGrid";
import { ExploreFilters } from "@/components/ExploreFilters";

export const dynamic = "force-dynamic";

// Exploración: recursos de todas las categorías con filtros (categoría + orden).
// Por defecto muestra los más votados. El estado del filtro vive en la URL.
export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string }>;
}) {
  const { cat, sort: sortParam } = await searchParams;
  const selectedSlugs = (cat ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sort: ResourceSort = sortParam === "new" ? "new" : "top";

  const [categories, resources, user] = await Promise.all([
    getActiveCategories(),
    getResourcesFiltered({ categorySlugs: selectedSlugs, sort }),
    getCurrentUser(),
  ]);
  const resourceIds = resources.map((r) => r.id);
  const [userVotes, categoriesByResource] = await Promise.all([
    user ? getUserVotes(user.id, resourceIds) : Promise.resolve<Record<string, number>>({}),
    getCategoriesForResources(resourceIds),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Explorar
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Lo mejor de la comunidad, ordenado por votos. Filtra por categoría o
            descubre lo más reciente.
          </p>
        </div>
      </div>

      <ExploreFilters categories={categories} selected={selectedSlugs} sort={sort} />

      <ResourceGrid
        resources={resources}
        from="todo"
        userVotes={userVotes}
        categoriesByResource={categoriesByResource}
        canVote={!!user}
        empty={
          selectedSlugs.length > 0
            ? "No hay videos en esas categorías todavía. Prueba otras o aporta el primero."
            : "Aún no hay videos. ¡Sé el primero en aportar uno!"
        }
      />
    </main>
  );
}
