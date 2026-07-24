"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import type { ResourceSort } from "@/lib/catalog";

// Barra de filtros de la exploración (reemplaza las viejas pestañas). El estado
// vive en la URL (?cat=slug,slug&sort=top|new) para que sea compartible y el
// servidor consulte con ese filtro. Cambiar un filtro navega a la nueva URL.
export function ExploreFilters({
  categories,
  selected,
  sort,
}: {
  categories: Category[];
  selected: string[];
  sort: ResourceSort;
}) {
  const router = useRouter();

  function pushState(nextSlugs: string[], nextSort: ResourceSort) {
    const params = new URLSearchParams();
    if (nextSlugs.length > 0) params.set("cat", nextSlugs.join(","));
    if (nextSort !== "top") params.set("sort", nextSort);
    const qs = params.toString();
    router.push(qs ? `/todo?${qs}` : "/todo", { scroll: false });
  }

  function toggle(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    pushState(next, sort);
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-faint">
          Orden
        </span>
        <SortButton active={sort === "top"} onClick={() => pushState(selected, "top")}>
          Más votados
        </SortButton>
        <SortButton active={sort === "new"} onClick={() => pushState(selected, "new")}>
          Recientes
        </SortButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={selected.length === 0} onClick={() => pushState([], sort)}>
          Todas
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={selected.includes(c.slug)}
            onClick={() => toggle(c.slug)}
          >
            {c.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
        active
          ? "bg-accent/15 text-accent-ink ring-1 ring-accent/40"
          : "text-muted hover:bg-fill hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
        active
          ? "bg-accent text-on-accent"
          : "bg-fill text-muted ring-1 ring-border hover:bg-fill-strong hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
