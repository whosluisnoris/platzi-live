"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";

type Result =
  | { kind: "success"; youtubeId?: string; warning?: string }
  | { kind: "duplicate"; youtubeId?: string }
  | { kind: "error"; message: string };

// Formulario para aportar un video (usuarios con sesión). Pega una URL de YouTube,
// elige categorías y se publica. Detecta duplicados y enlaza al video existente.
export function SubmitForm({ categories }: { categories: Category[] }) {
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, categoryIds: selected }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        youtubeId?: string;
        warning?: string;
      };

      if (res.status === 409) {
        setResult({ kind: "duplicate", youtubeId: data.youtubeId });
      } else if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "No se pudo agregar el video." });
      } else {
        setResult({ kind: "success", youtubeId: data.youtubeId, warning: data.warning });
        setUrl("");
        setSelected([]);
      }
    } catch {
      setResult({ kind: "error", message: "No hay conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Enlace de YouTube
          </span>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <span className="text-xs text-faint">
            Un video suelto, o una playlist con el link /playlist?list=…
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Categorías
          </span>
          <CategoryMultiSelect
            categories={categories}
            selected={selected}
            onChange={setSelected}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="brand-gradient self-start rounded-full px-6 py-3 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Agregando…" : "Publicar en Clusly"}
        </button>
      </form>

      {result && (
        <div className="mt-6">
          {result.kind === "success" && (
            <div className="rounded-xl bg-accent/10 p-4 ring-1 ring-accent/25">
              <p className="text-sm font-semibold text-foreground">
                ¡Gracias! Tu aporte ya está en Clusly.
              </p>
              {result.warning && (
                <p className="mt-1 text-xs text-muted">{result.warning}</p>
              )}
              {result.youtubeId && (
                <Link
                  href={`/recurso/${result.youtubeId}`}
                  className="mt-2 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
                >
                  Ver el video →
                </Link>
              )}
            </div>
          )}

          {result.kind === "duplicate" && (
            <div className="rounded-xl bg-fill p-4 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">
                Ese video ya está en Clusly.
              </p>
              <p className="mt-1 text-xs text-muted">
                Alguien se te adelantó. Puedes ir a votarlo para que suba.
              </p>
              {result.youtubeId && (
                <Link
                  href={`/recurso/${result.youtubeId}`}
                  className="mt-2 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
                >
                  Verlo →
                </Link>
              )}
            </div>
          )}

          {result.kind === "error" && (
            <p className="text-sm text-red-400">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
