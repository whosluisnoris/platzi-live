import { getAllResources } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";

export const dynamic = "force-dynamic";

// Pestaña "Todo": recursos de todas las categorías, sin filtrar.
export default async function TodoPage() {
  const resources = await getAllResources();

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Todo el catálogo
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Todos los recursos de aprendizaje, de más reciente a más antiguo.
          </p>
        </div>
      </div>
      <ResourceGrid
        resources={resources}
        from="todo"
        empty="Aún no hay recursos en el catálogo. Vuelve pronto."
      />
    </main>
  );
}
