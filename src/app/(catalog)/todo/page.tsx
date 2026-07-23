import { getAllResources } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";

export const dynamic = "force-dynamic";

// Pestaña "Todo": recursos de todas las categorías, sin filtrar.
export default async function TodoPage() {
  const resources = await getAllResources();

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Todo el catálogo</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Todos los recursos de aprendizaje, de más reciente a más antiguo.
        </p>
      </div>
      <ResourceGrid
        resources={resources}
        from="todo"
        empty="Aún no hay recursos en el catálogo. Vuelve pronto."
      />
    </main>
  );
}
