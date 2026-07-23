import { ResourceCard } from "./ResourceCard";
import type { ResourceRow } from "@/lib/types";

// Cuadrícula de tarjetas de recurso, compartida por las páginas de categoría y
// la de "Todo". Server Component (sin interactividad propia).
export function ResourceGrid({
  resources,
  from,
  empty,
  accent,
}: {
  resources: ResourceRow[];
  from?: string;
  empty: string;
  accent?: string | null;
}) {
  if (resources.length === 0) {
    return <p className="py-16 text-center text-sm text-faint">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} from={from} accent={accent} />
      ))}
    </div>
  );
}
