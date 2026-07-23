"use client";

import { useState, useCallback, useEffect } from "react";
import type { Category } from "@/lib/types";

// Genera un slug kebab-case a partir del nombre (sin acentos ni símbolos).
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesManager({
  secret,
  onChange,
}: {
  secret: string;
  onChange?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/categories", { headers });
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    await load();
    onChange?.();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slugTouched ? slug.trim() : slugify(name);
    if (!name.trim() || !finalSlug) {
      setStatus({ text: "Nombre y slug son obligatorios", ok: false });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: name.trim(), slug: finalSlug, description }),
    });
    if (res.ok) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setStatus({ text: "Categoría creada ✓", ok: true });
      await refresh();
    } else {
      const data = await res.json();
      setStatus({ text: data.error ?? "No se pudo crear", ok: false });
    }
    setLoading(false);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, ...body }),
    });
    await refresh();
  }

  // Reordena intercambiando sort_order con el vecino.
  async function move(index: number, dir: -1 | 1) {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    await Promise.all([
      fetch("/api/admin/categories", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: a.id, sortOrder: b.sort_order }),
      }),
      fetch("/api/admin/categories", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: b.id, sortOrder: a.sort_order }),
      }),
    ]);
    await refresh();
  }

  async function remove(id: string, catName: string) {
    if (
      !window.confirm(
        `¿Borrar la categoría "${catName}"? Los recursos no se borran, solo pierden esta categoría.`
      )
    )
      return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-white">
        Categorías <span className="text-[#0aeb8b]">del catálogo</span>
      </h2>

      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-col gap-3 rounded-xl bg-[#14171c] p-4 ring-1 ring-white/10 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
          Nombre
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="p. ej. Visión por computadora"
            className="rounded-lg bg-[#0e1013] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
          Slug (URL)
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="vision-por-computadora"
            className="rounded-lg bg-[#0e1013] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
          />
        </label>
        <label className="flex flex-[2_2_0%] flex-col gap-1 text-xs text-gray-400">
          Descripción (opcional)
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la temática"
            className="rounded-lg bg-[#0e1013] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-[#0aeb8b] px-5 py-2 text-sm font-semibold text-[#0e1013] hover:bg-[#08c975] disabled:opacity-50 transition"
        >
          {loading ? "Creando…" : "Crear"}
        </button>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-[#0aeb8b]" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no hay categorías.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c, i) => (
            <li
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-lg bg-[#14171c] px-4 py-3 ring-1 ${
                c.is_active ? "ring-white/10" : "opacity-60 ring-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className="text-gray-500 hover:text-white disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === categories.length - 1}
                    aria-label="Bajar"
                    className="text-gray-500 hover:text-white disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {c.name}{" "}
                    <span className="font-mono text-xs text-gray-500">/{c.slug}</span>
                  </p>
                  {c.description && (
                    <p className="truncate text-xs text-gray-500">{c.description}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => patch(c.id, { isActive: !c.is_active })}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${
                    c.is_active
                      ? "border border-white/10 text-gray-300 hover:bg-white/5"
                      : "border border-[#0aeb8b]/30 text-[#0aeb8b] hover:bg-[#0aeb8b]/10"
                  }`}
                >
                  {c.is_active ? "Activa" : "Inactiva"}
                </button>
                <button
                  onClick={() => remove(c.id, c.name)}
                  className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
