"use client";

import type { Category } from "@/lib/types";

// Chips de categoría con selección múltiple, reutilizable en el admin para
// asignar N categorías a un recurso.
export function CategoryMultiSelect({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Crea al menos una categoría para poder asignarla.
      </p>
    );
  }

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            type="button"
            key={c.id}
            onClick={() => toggle(c.id)}
            aria-pressed={on}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
              on
                ? "bg-[#0aeb8b] text-[#0e1013]"
                : "bg-white/5 text-gray-300 ring-1 ring-white/10 hover:bg-white/10"
            }`}
          >
            {on && "✓ "}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
